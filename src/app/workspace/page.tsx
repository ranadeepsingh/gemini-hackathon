"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal as TerminalIcon,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Folder,
  Eye,
  TrendingUp,
  Layers,
  FileCode,
  CheckCircle,
  Database,
  Lock,
  X
} from "lucide-react";
import Link from "next/link";
import AntigravityCatToggle from "@/components/AntigravityCatToggle";
import { supabase } from "@/lib/supabase/client";

const SUPABASE_CLIENT_TIMEOUT_MS = 3500;

async function withClientTimeout<T>(
  operation: PromiseLike<T>,
  label: string,
  timeoutMs = SUPABASE_CLIENT_TIMEOUT_MS
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      Promise.resolve(operation),
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(`${label} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

// Basename helper for nested file paths
function getBasename(filePath: string): string {
  return filePath.split("/").pop() || filePath;
}

function formatWorkspaceSnapshot(files: Record<string, string>): string {
  return Object.entries(files)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([filePath, fileContent]) => `--- FILE: ${filePath} ---\n${fileContent}`)
    .join("\n\n");
}

function isAgentCliCommand(command: string): boolean {
  return command === "antigravity run" ||
    command === "agy run" ||
    command.startsWith("antigravity run ") ||
    command.startsWith("agy run ") ||
    command.startsWith("antigravity prompt ") ||
    command.startsWith("agy prompt ") ||
    command.startsWith("antigravity ask ") ||
    command.startsWith("agy ask ") ||
    command.startsWith("prompt ") ||
    command.startsWith("ask ");
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function stripAnsiCodes(text: string): string {
  return text.replace(/\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g, "");
}

const MAX_TERMINAL_LOGS = 180;
const MAX_TERMINAL_LINE_LENGTH = 700;

function terminalPrompt(cwd: string): string {
  return `agy 🧠 ${cwd ? `(/${cwd})` : "(/)"} >> `;
}

function terminalCommandLine(cwd: string, command: string): string {
  return `${terminalPrompt(cwd)}${command}`;
}

function hasTrailingPrompt(logs: string[]): boolean {
  const lastLine = logs[logs.length - 1] || "";
  return lastLine.startsWith("agy 🧠") && lastLine.trim().endsWith(">>");
}

function normalizeTerminalLines(lines: string[]): string[] {
  return lines
    .flatMap(line => stripAnsiCodes(line).split("\n"))
    .map(line => line.trimEnd())
    .filter(line => line.trim() !== "")
    .filter(line => !line.startsWith("[METRICS]"))
    .map(line => line.length > MAX_TERMINAL_LINE_LENGTH ? `${line.slice(0, MAX_TERMINAL_LINE_LENGTH)} ...` : line);
}

function appendTerminalLogs(previous: string[], lines: string[], cwd: string): string[] {
  const base = hasTrailingPrompt(previous) ? previous.slice(0, -1) : previous;
  const next = [...base, ...normalizeTerminalLines(lines)].slice(-MAX_TERMINAL_LOGS);
  return [...next, terminalPrompt(cwd)];
}

function replaceTerminalLogs(lines: string[], cwd: string): string[] {
  return [...normalizeTerminalLines(lines).slice(-MAX_TERMINAL_LOGS), terminalPrompt(cwd)];
}

function extractMetricUsage(rawText: string): { input: number; output: number; total: number; cost: number } | null {
  const match = rawText.match(/\[METRICS\] prompt_tokens=(\d+) candidates_tokens=(\d+) total_tokens=(\d+) cost_usd=([\d.]+)/);
  if (!match) return null;
  return {
    input: Number(match[1]),
    output: Number(match[2]),
    total: Number(match[3]),
    cost: Number(match[4])
  };
}

function extractThoughtEvents(lines: string[]): string[] {
  return lines.flatMap(line => {
    if (line.includes("[THINKING]")) {
      return [`[STEP] THINKING: ${line.replace(/.*\[THINKING\]/, "").trim()}`];
    }
    if (line.includes("[ACTION]")) {
      return [`[STEP] EXECUTED: ${line.replace(/.*\[ACTION\]/, "").trim()}`];
    }
    return [];
  });
}

interface WorkspaceRubric {
  id?: string;
  metric_key: string;
  metric_label: string;
  weight: number;
  description: string;
}

interface SessionDetails {
  total_input_tokens?: number;
  total_output_tokens?: number;
  total_reasoning_tokens?: number;
  cost_usd?: number | string;
  session_type?: string;
}

interface WorkspaceResponse {
  activeFile: string;
  files: Record<string, string>;
}

interface ExecuteResponse {
  stdout?: string;
  stderr?: string;
  code?: number;
  success?: boolean;
  error?: string;
  newCwd?: string;
}

interface GradeReport {
  score_agentic_flow: number;
  score_skill_verification: number;
  score_prompt_engineering: number;
  score_aggregate: number;
  summary_review: string;
  rubric_scores?: Array<{
    metric_key: string;
    score: number;
    feedback: string;
  }>;
  test_cases_passed?: number;
  test_cases_total?: number;
  is_passing?: boolean;
}

interface TestPanelState {
  status: "idle" | "running" | "passed" | "failed" | "error";
  passed: number;
  total: number;
  failedTests: string[];
  exitCode?: number;
  summary: string;
}

// Client-side fallback rubrics for resilient offline capability
const LOCAL_FALLBACK_RUBRICS: Record<string, WorkspaceRubric[]> = {
  "agentic-matrix-optimizer": [
    { metric_key: "unit_test_correctness", metric_label: "Latency Cleanup", weight: 0.40, description: "Checks that the artificial sleep is removed and repeated calls complete quickly." },
    { metric_key: "concurrency_safety", metric_label: "Matrix Output Integrity", weight: 0.25, description: "Verifies the implementation still returns the same result as np.matmul." },
    { metric_key: "loop_efficiency", metric_label: "Minimal Edit Discipline", weight: 0.20, description: "Reviews whether the solution stays small, readable, and demo-friendly." },
    { metric_key: "collaboration_communication", metric_label: "Interviewer Collaboration", weight: 0.15, description: "Evaluator review of candidate communications, reasoning trace descriptions, and agility during injected sandbox stress tests." }
  ],
  "python-backend-io-service": [
    { metric_key: "io_contract_correctness", metric_label: "I/O Contract Correctness", weight: 0.40, description: "Hidden unittest verification of exact status codes, response fields, and weighted score outputs." },
    { metric_key: "input_validation", metric_label: "Input Validation Discipline", weight: 0.25, description: "Checks malformed JSON, bad routes, mismatched lengths, non-numeric values, and invalid weight totals." },
    { metric_key: "agent_prompting", metric_label: "Agent Prompting Effectiveness", weight: 0.20, description: "Evaluates whether the candidate used Antigravity prompts to produce scoped, reviewable project changes." },
    { metric_key: "code_maintainability", metric_label: "Service Maintainability", weight: 0.15, description: "Reviews small-service structure, function boundaries, and readability under interview constraints." }
  ],
  "skill-log-parser": [
    { metric_key: "parser_conformance", metric_label: "Log Stream Parsing Conformance", weight: 0.40, description: "Deterministic score calculating percentage of malformed and high-dimensional log vectors parsed without crashes." },
    { metric_key: "schema_correctness", metric_label: "Frontmatter & Manifest Declaration", weight: 0.20, description: "Static parser verification confirming SKILL.md has valid yaml configurations matching specifications." },
    { metric_key: "stream_efficiency", metric_label: "Log Chunk Streaming Speed", weight: 0.20, description: "AI assessment of buffer extraction, chunk limits, and file safety bounds during extreme high loads." },
    { metric_key: "interview_feedback", metric_label: "Boundary Error Explanation", weight: 0.20, description: "Review of candidate ability to articulate file permission exceptions and log stream security overrides." }
  ],
  "prompt-adversarial-defense": [
    { metric_key: "jailbreak_defense", metric_label: "Jailbreak Suite Defense Rate", weight: 0.40, description: "Deterministic proportion of adversarial test suites successfully blocked (Grandma exploit, roleplay overlays, etc.)." },
    { metric_key: "input_sanitization", metric_label: "Preprocessing Sanitization Filters", weight: 0.20, description: "Verifies defensive code contains explicit regex rules to scrub hex or base64 injection patterns." },
    { metric_key: "prompt_defensiveness", metric_label: "Defensive Prompt Layout Strength", weight: 0.20, description: "LLM grading of text instructions protecting developer API tokens and systemic boundaries." },
    { metric_key: "interviewer_score", metric_label: "Threat Modeling Maturity", weight: 0.20, description: "Evaluation of candidate threat vector explanations and defensive prompt structuring during workspace trials." }
  ],
  "agentic-dependency-resolver": [
    { metric_key: "conflict_resolution", metric_label: "Automated Semver Resolution", weight: 0.40, description: "Checks whether resolver.py computes correct package version matrix without loops or import crashes." },
    { metric_key: "dependency_matching", metric_label: "Requirements Manifest Assembly", weight: 0.20, description: "Confirms the requirements.lock contains the resolved package constraints." },
    { metric_key: "algorithm_design", metric_label: "Backtracking Optimization Pattern", weight: 0.20, description: "Gemini evaluation of solver backtracking complexity, node pruning, and caching." },
    { metric_key: "code_articulation", metric_label: "Graph Cycle Explanation", weight: 0.20, description: "Interviewer evaluation of candidate explanation of cycle-detection and topological sorting." }
  ],
  "agentic-anomaly-detector": [
    { metric_key: "leak_remediation", metric_label: "Memory Pool Leak Remediation", weight: 0.40, description: "Deterministic check that heap memory limits remain strictly below 50MB under 1000 event runs." },
    { metric_key: "resource_management", metric_label: "Explicit Resource Tracking", weight: 0.20, description: "Code scanner check verifying unclosed socket handles are caught and garbage collection triggers are executed." },
    { metric_key: "daemon_robustness", metric_label: "Daemon Multi-threading Safety", weight: 0.20, description: "LLM review of background daemon durability, infinite loop defenses, and deadlock mitigations." },
    { metric_key: "system_knowledge", metric_label: "Memory Analysis Proficiency", weight: 0.20, description: "Evaluation of candidate knowledge of heap growth diagnostics and custom system hooks." }
  ],
  "skill-k8s-debugger": [
    { metric_key: "triage_parsing", metric_label: "Triage Log Pattern Parsing", weight: 0.40, description: "Checks if triage tool correctly isolates pod statuses and extracts log lines under crash loops." },
    { metric_key: "credential_redaction", metric_label: "PII & Security Token Redaction", weight: 0.20, description: "Verifies that API keys, certs, or private cluster variables are 100% sanitized before stdout printing." },
    { metric_key: "regex_safety", metric_label: "Parsing Filter Security Bounds", weight: 0.20, description: "AI review of command argument sanitization to block arbitrary bash execution inside shell commands." },
    { metric_key: "incident_response", metric_label: "On-call Diagnostic Agility", weight: 0.20, description: "Senior technical lead assessment of incident diagnosis workflow under high pressure." }
  ],
  "skill-db-migrator": [
    { metric_key: "migration_safety", metric_label: "Concurrent Indexing Execution", weight: 0.40, description: "Checks whether execution avoids transactional locks and uses safe CONCURRENTLY patterns." },
    { metric_key: "rollback_generation", metric_label: "Rollback Validation Integrity", weight: 0.20, description: "Verifies rollback.sql accurately undoes table indexes without locking." },
    { metric_key: "index_analysis", metric_label: "AI Locking Pattern Review", weight: 0.20, description: "Gemini evaluation of locking index pathways, transactional speed bounds, and partition setups." },
    { metric_key: "db_proficiency", metric_label: "DBMS Lock Matrix Knowledge", weight: 0.20, description: "Lead evaluation of DBMS table locking patterns, share updates, and isolation level concepts." }
  ],
  "prompt-pydantic-guard": [
    { metric_key: "schema_conformance", metric_label: "JSON Schema Output Conformity", weight: 0.40, description: "Deterministic evaluation calculating output conformity and presence of required fields under plain-text pressure." },
    { metric_key: "validation_pipeline", metric_label: "Regex Output Assertions", weight: 0.20, description: "Verifies that validator utilizes explicit Pydantic schema validation structures." },
    { metric_key: "escape_resistance", metric_label: "Schema Vandalism Resilience", weight: 0.20, description: "LLM evaluation of prompt protections forcing the output schema compliance." },
    { metric_key: "precision_engineering", metric_label: "Structured Output Competency", weight: 0.20, description: "Examiner review of structural data schema alignment and clean system interfaces." }
  ],
  "prompt-data-leak-shield": [
    { metric_key: "pii_redaction", metric_label: "PII Redaction Accuracy", weight: 0.40, description: "Deterministic checks measuring percentage of Names, phone numbers, and SSNs securely replaced." },
    { metric_key: "disclosure_block", metric_label: "Credential Leak Prevention", weight: 0.20, description: "Code verification ensuring that administrative clinic keys or prompts are 100% blocked from leaks." },
    { metric_key: "anonymization_depth", metric_label: "HIPAA Semantics Alignment", weight: 0.20, description: "LLM evaluation of redaction safety depth without stripping critical telehealth contexts." },
    { metric_key: "compliance_interview", metric_label: "Data Privacy Competency", weight: 0.20, description: "Examiner evaluation of candidate knowledge on healthcare compliance policies and leak protection loops." }
  ]
};

const GENERAL_DEFAULT_RUBRICS: WorkspaceRubric[] = [
  { metric_key: "code_correctness", metric_label: "Functional Correctness", weight: 0.40, description: "Evaluating semantic correct outputs and passed test suite benchmarks." },
  { metric_key: "code_architecture", metric_label: "Architecture & Safety Standards", weight: 0.30, description: "Verifying secure layouts, resource allocations, and defensive programming bounds." },
  { metric_key: "code_efficiency", metric_label: "Execution Performance Ratio", weight: 0.20, description: "Assessing processing latency overhead, complexity bounds, and O-notation scales." },
  { metric_key: "collaboration_trace", metric_label: "Analytical Reasoning Trace", weight: 0.10, description: "Reviewing trace details, command descriptions, and communicative agility." }
];

interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  children: Record<string, FileNode>;
}

function buildFileTree(filePaths: string[]): FileNode {
  const root: FileNode = { name: "root", path: "", isDir: true, children: {} };
  for (const filePath of filePaths) {
    const parts = filePath.split("/");
    let current = root;
    let cumulativePath = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      cumulativePath = cumulativePath ? `${cumulativePath}/${part}` : part;
      const isLast = i === parts.length - 1;
      if (!current.children[part]) {
        current.children[part] = {
          name: part,
          path: cumulativePath,
          isDir: !isLast,
          children: {}
        };
      }
      current = current.children[part];
    }
  }
  return root;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function highlightPython(code: string): string {
  let escaped = escapeHtml(code);
  const placeholders: string[] = [];
  
  const pushPlaceholder = (text: string, cls: string) => {
    const idx = placeholders.length;
    placeholders.push(`<span class="${cls}">${text}</span>`);
    return `___PLACEHOLDER_${idx}___`;
  };

  // 1. Comments
  escaped = escaped.replace(/(#.*)$/gm, (match) => {
    return pushPlaceholder(match, "text-text-muted/60 italic");
  });

  // 2. Triple quoted strings
  escaped = escaped.replace(/(&quot;&quot;&quot;[\s\S]*?&quot;&quot;&quot;)/g, (match) => {
    return pushPlaceholder(match, "text-agy-green/80");
  });
  escaped = escaped.replace(/(&#x27;&#x27;&#x27;[\s\S]*?&#x27;&#x27;&#x27;)/g, (match) => {
    return pushPlaceholder(match, "text-agy-green/80");
  });

  // 3. Regular strings
  escaped = escaped.replace(/(&quot;.*?&quot;)/g, (match) => {
    return pushPlaceholder(match, "text-agy-green/80");
  });
  escaped = escaped.replace(/(&#x27;.*?&#x27;)/g, (match) => {
    return pushPlaceholder(match, "text-agy-green/80");
  });

  // 4. Keywords
  const keywords = [
    "def", "class", "import", "from", "as", "return", "if", "elif", "else", "try",
    "except", "finally", "for", "while", "in", "is", "and", "or", "not", "assert",
    "with", "yield", "pass", "break", "continue", "lambda", "global", "nonlocal", "del"
  ];
  const keywordRegex = new RegExp(`\\b(${keywords.join("|")})\\b`, "g");
  escaped = escaped.replace(keywordRegex, '<span class="text-agy-cyan font-bold">$1</span>');

  // 5. Types & Builtins
  const builtins = ["self", "print", "len", "range", "list", "dict", "set", "tuple", "str", "int", "float", "bool", "Exception", "ValueError", "TypeError", "object", "super", "sum", "map"];
  const builtinRegex = new RegExp(`\\b(${builtins.join("|")})\\b`, "g");
  escaped = escaped.replace(builtinRegex, '<span class="text-agy-violet font-semibold">$1</span>');

  // 6. Booleans and None
  escaped = escaped.replace(/\b(True|False|None)\b/g, '<span class="text-agy-violet font-bold">$1</span>');

  // 7. Function names in def
  escaped = escaped.replace(/\bdef\s+(\w+)\b/g, 'def <span class="text-white font-semibold">$1</span>');

  // 8. Numbers
  escaped = escaped.replace(/\b(\d+)\b/g, '<span class="text-agy-green font-bold">$1</span>');

  // 9. Decorators
  escaped = escaped.replace(/(@\w+)/g, '<span class="text-agy-violet font-semibold">$1</span>');

  // 10. Restore placeholders
  for (let i = placeholders.length - 1; i >= 0; i--) {
    escaped = escaped.replace(`___PLACEHOLDER_${i}___`, placeholders[i]);
  }

  return escaped;
}

function highlightMarkdown(code: string): string {
  let escaped = escapeHtml(code);

  // Headers
  escaped = escaped.replace(/^(#{1,6}\s+.*)$/gm, '<span class="text-agy-cyan font-bold">$1</span>');

  // Inline code
  escaped = escaped.replace(/(`)(.*?)\1/g, '<span class="text-agy-green bg-bg-panel/40 px-1.5 py-0.5 rounded font-mono">$1$2$1</span>');

  // Bold
  escaped = escaped.replace(/(\*\*|__)(.*?)\1/g, '<span class="font-bold text-white">$1$2$1</span>');

  // Italic
  escaped = escaped.replace(/(\*|_)(.*?)\1/g, '<span class="italic text-text-muted">$1$2$1</span>');

  // Blockquotes
  escaped = escaped.replace(/^&gt;\s+(.*)$/gm, '<span class="text-text-muted/85 italic border-l-2 border-slate-700 pl-2">$1</span>');

  // Lists
  escaped = escaped.replace(/^(\s*[-*+]\s+)/gm, '<span class="text-agy-green font-bold">$1</span>');
  escaped = escaped.replace(/^(\s*\d+\.\s+)/gm, '<span class="text-agy-green font-bold">$1</span>');

  // Fenced blocks
  escaped = escaped.replace(/(```[a-z]*[\s\S]*?```)/g, '<span class="text-agy-violet">$1</span>');

  return escaped;
}

function highlightJson(code: string): string {
  let escaped = escapeHtml(code);

  // Keys
  escaped = escaped.replace(/(&quot;.*?&quot;)\s*:/g, '<span class="text-agy-cyan font-semibold">$1</span>:');

  // Values (strings)
  escaped = escaped.replace(/:\s*(&quot;.*?&quot;)/g, ': <span class="text-agy-green">$1</span>');

  // Booleans / nulls
  escaped = escaped.replace(/\b(true|false|null)\b/g, '<span class="text-agy-violet font-semibold">$1</span>');

  // Numbers
  escaped = escaped.replace(/\b(\d+)\b/g, '<span class="text-agy-green font-bold">$1</span>');

  return escaped;
}

function getHighlighter(content: string, filename: string): string {
  if (!content) return "";
  const ext = filename.split(".").pop() || "";
  if (ext === "py") return highlightPython(content);
  if (ext === "md") return highlightMarkdown(content);
  if (ext === "json") return highlightJson(content);
  return escapeHtml(content);
}

function isReadOnlyFile(filePath: string): boolean {
  if (!filePath) return false;
  const lower = filePath.toLowerCase();
  return lower === "challenge.md" || lower.endsWith("/challenge.md");
}

function extractFailedTestDetails(rawText: string): string[] {
  const outputLines = rawText.split("\n").map(line => line.trimEnd());
  const failures: string[] = [];

  for (let index = 0; index < outputLines.length; index += 1) {
    const header = outputLines[index].trim();
    if (!/^(FAIL|ERROR):\s+/.test(header)) continue;

    const block: string[] = [];
    for (let nextIndex = index + 1; nextIndex < outputLines.length; nextIndex += 1) {
      const line = outputLines[nextIndex].trim();
      if (/^(FAIL|ERROR):\s+/.test(line) || /^Ran\s+\d+\s+tests?/i.test(line) || /^FAILED\s+/i.test(line)) break;
      if (!line || /^[-=]{5,}$/.test(line) || line === "Traceback (most recent call last):") continue;
      block.push(line);
    }

    const location = block.find(line => line.startsWith("File "));
    const reason = [...block].reverse().find(line => (
      /(?:AssertionError|Error|Exception|TypeError|ValueError):/.test(line) ||
      line.includes(" != ") ||
      line.includes(" was not ") ||
      line.includes(" failed")
    )) || block[block.length - 1];

    failures.push([header, location, reason].filter(Boolean).join("\n"));
  }

  const pytestFailures = outputLines
    .map(line => line.trim())
    .filter(line => /^FAILED\s+/.test(line));

  return failures.length > 0
    ? failures
    : pytestFailures.map(line => line.replace(/^FAILED\s+/, "FAILED: "));
}

function parseTestRunResult(stdout: string, stderr: string, exitCode?: number): TestPanelState {
  const rawText = stripAnsiCodes(`${stdout}\n${stderr}`);
  const lines = rawText
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);

  const ranMatch = rawText.match(/Ran\s+(\d+)\s+tests?/i);
  const failureMatch = rawText.match(/failures=(\d+)/i);
  const errorMatch = rawText.match(/errors=(\d+)/i);
  const total = ranMatch ? Number(ranMatch[1]) : 0;
  const failures = failureMatch ? Number(failureMatch[1]) : 0;
  const errors = errorMatch ? Number(errorMatch[1]) : 0;
  const explicitFailedCount = failures + errors;
  const failedTests = extractFailedTestDetails(rawText);

  const inferredTotal = total || (exitCode === 0 ? 1 : Math.max(1, failedTests.length));
  const failedCount = Math.max(explicitFailedCount, failedTests.length, exitCode === 0 ? 0 : 1);
  const passed = Math.max(0, inferredTotal - failedCount);
  const status = exitCode === 0 && failedCount === 0 ? "passed" : "failed";

  if (status === "failed" && failedTests.length === 0) {
    const assertionLines = lines.filter(line => (
      line.includes("AssertionError") ||
      line.includes("Traceback") ||
      line.includes("Error:") ||
      line.includes("FAILED")
    ));
    failedTests.push(assertionLines[0] || `Test runner exited with code ${exitCode ?? 1}`);
  }

  return {
    status,
    passed,
    total: inferredTotal,
    failedTests,
    exitCode,
    summary: status === "passed"
      ? "All validation tests passed."
      : `${failedTests.length || failedCount} validation test${(failedTests.length || failedCount) === 1 ? "" : "s"} failed.`
  };
}

function WorkspaceCockpit() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const problemSlug = searchParams.get("problem") || "agentic-matrix-optimizer";
  const sessionId = searchParams.get("session") || "demo-session-id";
  const resetSandbox = searchParams.get("reset") === "true";

  // Dynamic Workspace Files State
  const [files, setFiles] = useState<Record<string, string>>({});
  const [openTabs, setOpenTabs] = useState<string[]>([]);
  const [activeTab, setActiveFile] = useState<string>("");
  const [code, setCode] = useState<string>("");
  const activeTabRef = useRef("");

  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState("");
  const [terminalCwd, setTerminalCwd] = useState<string>("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Realtime Telemetry Stats & Agents State
  const [isRunning, setIsRunning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [totalTokens, setTotalTokens] = useState(0);
  const [reasoningTokens, setReasoningTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0.0);
  const [completionProgress, setCompletionProgress] = useState(0);
  const [thoughtsLog, setThoughtsLog] = useState<string[]>([]);
  const [sessionDetails, setSessionDetails] = useState<SessionDetails | null>(null);
  const [testPanel, setTestPanel] = useState<TestPanelState>({
    status: "idle",
    passed: 0,
    total: 0,
    failedTests: [],
    summary: "Run tests to see validation results."
  });



  const terminalEndRef = useRef<HTMLDivElement>(null);
  const terminalViewportRef = useRef<HTMLDivElement>(null);
  const shouldStickToTerminalBottomRef = useRef(true);

  // Editor overlapping refs for scroll-synchronization
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  // Keep track of directory expansion state for the File Tree Sidebar
  const [expandedDirs, setExpandedDirs] = useState<Record<string, boolean>>({});

  // Resizable Sizing States
  const [leftWidth, setLeftWidth] = useState(60); // % for left panel (IDE/Terminal split)
  const [editorHeight, setEditorHeight] = useState(35); // % for files editor height
  const [sidebarWidth, setSidebarWidth] = useState(208); // px for file explorer sidebar
  const [isDesktop, setIsDesktop] = useState(false);
  const [activeDrag, setActiveDrag] = useState<"leftRight" | "editorTerminal" | "sidebar" | null>(null);

  // Refs for resizing calculations
  const containerRef = useRef<HTMLDivElement>(null);
  const leftPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  // Drag to resize left/right panels
  const handleLeftRightResize = (e: React.PointerEvent<HTMLDivElement>) => {
    const handleElement = e.currentTarget;
    handleElement.setPointerCapture(e.pointerId);
    setActiveDrag("leftRight");
    const startX = e.clientX;
    const startWidth = leftWidth;
    const containerWidth = containerRef.current?.getBoundingClientRect().width || window.innerWidth;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaPercentage = (deltaX / containerWidth) * 100;
      const newWidth = Math.max(30, Math.min(80, startWidth + deltaPercentage));
      setLeftWidth(newWidth);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      handleElement.releasePointerCapture(upEvent.pointerId);
      setActiveDrag(null);
      handleElement.removeEventListener("pointermove", onPointerMove);
      handleElement.removeEventListener("pointerup", onPointerUp);
    };

    handleElement.addEventListener("pointermove", onPointerMove);
    handleElement.addEventListener("pointerup", onPointerUp);
  };

  // Drag to resize editor / terminal vertically
  const handleEditorTerminalResize = (e: React.PointerEvent<HTMLDivElement>) => {
    const handleElement = e.currentTarget;
    handleElement.setPointerCapture(e.pointerId);
    setActiveDrag("editorTerminal");
    const startY = e.clientY;
    const startHeight = editorHeight;
    const containerHeight = leftPanelRef.current?.getBoundingClientRect().height || window.innerHeight;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const deltaPercentage = (deltaY / containerHeight) * 100;
      const newHeight = Math.max(20, Math.min(80, startHeight + deltaPercentage));
      setEditorHeight(newHeight);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      handleElement.releasePointerCapture(upEvent.pointerId);
      setActiveDrag(null);
      handleElement.removeEventListener("pointermove", onPointerMove);
      handleElement.removeEventListener("pointerup", onPointerUp);
    };

    handleElement.addEventListener("pointermove", onPointerMove);
    handleElement.addEventListener("pointerup", onPointerUp);
  };

  // Drag to resize file tree sidebar horizontally
  const handleSidebarResize = (e: React.PointerEvent<HTMLDivElement>) => {
    const handleElement = e.currentTarget;
    handleElement.setPointerCapture(e.pointerId);
    setActiveDrag("sidebar");
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(120, Math.min(400, startWidth + deltaX));
      setSidebarWidth(newWidth);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      handleElement.releasePointerCapture(upEvent.pointerId);
      setActiveDrag(null);
      handleElement.removeEventListener("pointermove", onPointerMove);
      handleElement.removeEventListener("pointerup", onPointerUp);
    };

    handleElement.addEventListener("pointermove", onPointerMove);
    handleElement.addEventListener("pointerup", onPointerUp);
  };

  const handleScroll = () => {
    if (textareaRef.current) {
      const scrollTop = textareaRef.current.scrollTop;
      const scrollLeft = textareaRef.current.scrollLeft;
      if (preRef.current) {
        preRef.current.scrollTop = scrollTop;
        preRef.current.scrollLeft = scrollLeft;
      }
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = scrollTop;
      }
    }
  };

  const handleTerminalViewportScroll = () => {
    const viewport = terminalViewportRef.current;
    if (!viewport) return;
    const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
    shouldStickToTerminalBottomRef.current = distanceFromBottom < 96;
  };

  const reconcileWorkspaceFiles = useCallback((workspaceData: WorkspaceResponse) => {
    const fileKeys = Object.keys(workspaceData.files);
    const currentActive = activeTabRef.current;
    const nextActive = currentActive && workspaceData.files[currentActive] !== undefined
      ? currentActive
      : (workspaceData.activeFile || fileKeys[0] || "");

    setFiles(workspaceData.files);
    setOpenTabs(prev => {
      const existingTabs = prev.filter(tab => workspaceData.files[tab] !== undefined);
      if (existingTabs.length > 0) {
        return nextActive && !existingTabs.includes(nextActive)
          ? [nextActive, ...existingTabs]
          : existingTabs;
      }
      // On initial load, open all visible files sorted with challenge.md first
      const allFiles = Object.keys(workspaceData.files);
      return allFiles.sort((a, b) => {
        if (a === "challenge.md") return -1;
        if (b === "challenge.md") return 1;
        return a.localeCompare(b);
      });
    });
    setActiveFile(nextActive);
    setCode(nextActive ? workspaceData.files[nextActive] || "" : "");
  }, []);

  // Keep editor scroll alignment when tabs change
  useEffect(() => {
    if (textareaRef.current) textareaRef.current.scrollTop = 0;
    if (textareaRef.current) textareaRef.current.scrollLeft = 0;
    if (preRef.current) preRef.current.scrollTop = 0;
    if (preRef.current) preRef.current.scrollLeft = 0;
    if (lineNumbersRef.current) lineNumbersRef.current.scrollTop = 0;
  }, [activeTab]);

  const renderFileTree = (node: FileNode, depth = 0) => {
    // Sort directories first, then files
    const sortedChildren = Object.values(node.children).sort((a, b) => {
      if (a.isDir && !b.isDir) return -1;
      if (!a.isDir && b.isDir) return 1;
      return a.name.localeCompare(b.name);
    });

    return (
      <div className="space-y-1">
        {sortedChildren.map(child => {
          const isSelected = activeTab === child.path;
          const isDirExpanded = expandedDirs[child.path] !== false; // Expand by default

          if (child.isDir) {
            return (
              <div key={child.path} className="space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setExpandedDirs(prev => ({
                      ...prev,
                      [child.path]: prev[child.path] === false ? true : false
                    }));
                  }}
                  className="w-full flex items-center gap-1.5 px-2 py-1 text-left font-mono text-[10px] text-text-muted hover:text-white hover:bg-slate-800/30 rounded transition-colors cursor-pointer"
                  style={{ paddingLeft: `${(depth + 1) * 8}px` }}
                >
                  <Folder className="w-3.5 h-3.5 text-agy-cyan" />
                  <span className="truncate font-semibold uppercase tracking-wider">{child.name}</span>
                </button>
                {isDirExpanded && (
                  <div className="border-l border-slate-800/40 ml-[7px]">
                    {renderFileTree(child, depth + 1)}
                  </div>
                )}
              </div>
            );
          } else {
            const isReadOnly = isReadOnlyFile(child.path);
            return (
              <button
                type="button"
                key={child.path}
                onClick={() => handleTabChange(child.path)}
                className={`w-full flex items-center gap-1.5 px-2 py-1 text-left font-mono text-[10px] rounded transition-colors cursor-pointer ${
                  isSelected
                    ? isReadOnly
                      ? "bg-agy-violet/10 text-agy-violet font-bold border-r-2 border-agy-violet"
                      : "bg-agy-green/10 text-agy-green font-bold border-r-2 border-agy-green"
                    : "text-text-muted/80 hover:text-white hover:bg-slate-800/20"
                }`}
                style={{ paddingLeft: `${(depth + 1) * 8}px` }}
              >
                {isReadOnly ? (
                  <Lock className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-agy-violet animate-pulse" : "text-text-muted/40"}`} />
                ) : (
                  <FileCode className={`w-3.5 h-3.5 shrink-0 ${isSelected ? "text-agy-green" : "text-text-muted/50"}`} />
                )}
                <span className="truncate">{child.name}</span>
              </button>
            );
          }
        })}
      </div>
    );
  };

  // Load authenticated user and their profile/role
  const [profile, setProfile] = useState<{ full_name?: string; role?: string } | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [injectedStrain, setInjectedStrain] = useState(false);
  const [vmPatched, setVmPatched] = useState(false);
  const [rubrics, setRubrics] = useState<WorkspaceRubric[]>([]);

  useEffect(() => {
    async function loadUserAndProfile() {
      try {
        const { data: { user } } = await withClientTimeout(
          supabase.auth.getUser(),
          "Supabase auth lookup",
          2500
        );
        if (user) {
          const { data: profileData } = await withClientTimeout(
            supabase
              .from("profiles")
              .select("*")
              .eq("id", user.id)
              .single(),
            "Supabase profile lookup",
            2500
          );
          if (profileData) {
            setProfile(profileData);
          }
        } else {
          if (typeof window !== "undefined") {
            const demoRole = localStorage.getItem("demo_role");
            if (demoRole) {
              setProfile({
                full_name: `Demo ${demoRole.charAt(0).toUpperCase() + demoRole.slice(1)}`,
                role: demoRole.toLowerCase() === "interviewer" ? "interviewer" : "candidate"
              });
            }
          }
        }
      } catch (err) {
        console.warn("Could not load user or profile from Supabase in workspace", err);
      }
    }
    loadUserAndProfile();
  }, []);

  // Fetch challenge rubrics dynamically from Supabase
  useEffect(() => {
    async function loadRubrics() {
      try {
        const { data: problemData } = await withClientTimeout(
          supabase
            .from("problems")
            .select("id")
            .eq("slug", problemSlug)
            .single(),
          "Supabase problem rubric lookup"
        );

        if (problemData) {
          const { data: rubricsData } = await withClientTimeout(
            supabase
              .from("challenge_rubrics")
              .select("*")
              .eq("problem_id", problemData.id)
              .order("created_at", { ascending: true }),
            "Supabase challenge rubrics lookup"
          );

          if (rubricsData && rubricsData.length > 0) {
            setRubrics(rubricsData.map(r => ({
              ...r,
              weight: Number(r.weight)
            })));
            return;
          }
        }
      } catch (err) {
        console.warn("Failed to load rubrics from DB, using fallback", err);
      }

      const fallback = LOCAL_FALLBACK_RUBRICS[problemSlug] || GENERAL_DEFAULT_RUBRICS;
      setRubrics(fallback);
    }
    loadRubrics();
  }, [problemSlug]);

  // Set up realtime telemetry streaming of interview_sessions updates
  useEffect(() => {
    if (!sessionId || sessionId === "demo-session-id") return;

    async function loadSessionDetails() {
      try {
        const { data } = await withClientTimeout(
          supabase
            .from("interview_sessions")
            .select("*")
            .eq("id", sessionId)
            .single(),
          "Supabase session telemetry lookup"
        );

        if (data) {
          setTotalTokens(data.total_input_tokens + data.total_output_tokens);
          setReasoningTokens(data.total_reasoning_tokens);
          setTotalCost(Number(data.cost_usd));
          setSessionDetails(data);
        }
      } catch (err) {
        console.warn("Failed to load initial session details:", err);
      }
    }
    loadSessionDetails();

    const channel = supabase
      .channel(`session-telemetry-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "interview_sessions",
          filter: `id=eq.${sessionId}`
        },
        (payload) => {
          const updatedSession = payload.new;
          setTotalTokens(updatedSession.total_input_tokens + updatedSession.total_output_tokens);
          setReasoningTokens(updatedSession.total_reasoning_tokens);
          setTotalCost(Number(updatedSession.cost_usd));
          setSessionDetails(updatedSession);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const isInterviewer = !!(profile?.role && profile.role.toLowerCase().includes("interviewer"));

  // Load physical workspace files from host system
  useEffect(() => {
    let active = true;
    async function loadWorkspace() {
      try {
        setTerminalLogs(replaceTerminalLogs([
          "AntiCode sandbox initializing...",
          "Loading candidate workspace files..."
        ], ""));

        const res = await fetch(`/api/workspace?problemSlug=${problemSlug}${resetSandbox ? "&reset=true" : ""}`);
        if (!res.ok) throw new Error("Workspace initialization failed");
        const data = await res.json() as WorkspaceResponse;

        if (!active) return;

        reconcileWorkspaceFiles(data);
        setTerminalLogs(replaceTerminalLogs([
          "Official Antigravity SDK terminal ready.",
          "Commands: status, run, prompt \"...\", ask \"...\", test, clear."
        ], ""));
      } catch (err: unknown) {
        console.error(err);
        if (active) {
          setTerminalLogs(replaceTerminalLogs([
            `Error initializing workspace sandbox: ${getErrorMessage(err)}`,
          ], ""));
        }
      }
    }

    loadWorkspace();

    return () => {
      active = false;
    };
  }, [problemSlug, resetSandbox, reconcileWorkspaceFiles]);

  // Debounced auto-save to host filesystem
  useEffect(() => {
    if (!activeTab || code === undefined) return;

    // Skip saving if it matches the current loaded state perfectly
    if (files[activeTab] === code) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        const response = await fetch("/api/workspace", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            problemSlug,
            filename: activeTab,
            code
          })
        });
        if (response.ok) {
          // Update the cache
          setFiles(prev => ({ ...prev, [activeTab]: code }));
        }
      } catch (err) {
        console.error("Auto-save error:", err);
      } finally {
        setIsSaving(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [code, activeTab, problemSlug, files]);

  // Terminal Auto-scrolling
  useEffect(() => {
    if (!shouldStickToTerminalBottomRef.current) return;
    const viewport = terminalViewportRef.current;
    if (!viewport) return;
    const frame = window.requestAnimationFrame(() => {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: "smooth" });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [terminalLogs]);

  const handleTabChange = (tabName: string) => {
    // Save current active tab code back to cache first
    if (activeTab && code !== undefined) {
      setFiles(prev => ({ ...prev, [activeTab]: code }));
    }
    setOpenTabs(prev => prev.includes(tabName) ? prev : [...prev, tabName]);
    setActiveFile(tabName);
    setCode(files[tabName] || "");
  };

  const handleCloseTab = (tabName: string, event: React.SyntheticEvent<HTMLElement>) => {
    event.stopPropagation();
    if (activeTab && code !== undefined) {
      setFiles(prev => ({ ...prev, [activeTab]: code }));
    }

    setOpenTabs(prev => {
      const closingIndex = prev.indexOf(tabName);
      const nextTabs = prev.filter(tab => tab !== tabName);
      if (activeTab === tabName) {
        const fallbackTab = nextTabs[Math.min(closingIndex, nextTabs.length - 1)] || "";
        setActiveFile(fallbackTab);
        setCode(fallbackTab ? files[fallbackTab] || "" : "");
      }
      return nextTabs;
    });
  };

  // Deploy autonomous Antigravity solver loop
  const handleDeployAgent = async (agentCommand = "antigravity run") => {
    if (isRunning) return;

    setIsRunning(true);
    setTotalTokens(0);
    setTotalCost(0.0);
    setThoughtsLog([]);
    setCompletionProgress(5);

    setTerminalLogs(prev => appendTerminalLogs(prev, [
      terminalCommandLine(terminalCwd, agentCommand),
      "[system] Starting official Antigravity SDK runner..."
    ], terminalCwd));

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSlug,
          command: agentCommand,
          sessionId,
          cwd: terminalCwd
        })
      });
      const data = await response.json() as ExecuteResponse;
      if (!response.ok || data.error) {
        throw new Error(data.error || `Command failed with status ${response.status}`);
      }

      const rawStdout = stripAnsiCodes(data.stdout || "");
      const rawStderr = stripAnsiCodes(data.stderr || "");
      const rawText = `${rawStdout}\n${rawStderr}`;
      const lines = normalizeTerminalLines(rawText.split("\n"));
      const metricUsage = extractMetricUsage(rawText);
      const traceEvents = extractThoughtEvents(lines);

      if (metricUsage) {
        setTotalTokens(metricUsage.total);
        setTotalCost(metricUsage.cost);
      }
      if (traceEvents.length > 0) {
        setThoughtsLog(traceEvents);
        setCompletionProgress(Math.min(90, 12 + traceEvents.length * 12));
      }

      try {
        const res = await fetch(`/api/workspace?problemSlug=${problemSlug}`);
        if (res.ok) {
          const workspaceData = await res.json() as WorkspaceResponse;
          reconcileWorkspaceFiles(workspaceData);
        }
      } catch (e) {
        console.error("Failed to re-sync files:", e);
      }

      const completionLine = data.code === 0
        ? "[system] SDK run complete. Workspace synchronized."
        : `[system] SDK run exited with code ${data.code ?? 1}.`;
      setTerminalLogs(prev => appendTerminalLogs(prev, [
        ...(lines.length > 0 ? lines : ["Command completed with no terminal output."]),
        completionLine
      ], terminalCwd));
      setCompletionProgress(100);

    } catch (err: unknown) {
      setTerminalLogs(prev => appendTerminalLogs(prev, [
        `Error deploying agent: ${getErrorMessage(err)}`,
      ], terminalCwd));
    } finally {
      setIsRunning(false);
    }
  };

  // Run candidate unit test assertion suite
  const handleRunTests = async () => {
    if (isRunning || isEvaluating) return;

    setIsRunning(true);
    setTestPanel({
      status: "running",
      passed: 0,
      total: 0,
      failedTests: [],
      summary: "Running hidden validation suite..."
    });

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSlug,
          command: "antigravity test",
          sessionId,
          cwd: terminalCwd
        })
      });
      const data = await response.json() as ExecuteResponse;
      if (!response.ok || data.error) {
        throw new Error(data.error || `Command failed with status ${response.status}`);
      }

      setTestPanel(parseTestRunResult(data.stdout || "", data.stderr || "", data.code));

      // Re-fetch files from the workspace to load any changes
      try {
        const res = await fetch(`/api/workspace?problemSlug=${problemSlug}`);
        if (res.ok) {
          const workspaceData = await res.json() as WorkspaceResponse;
          reconcileWorkspaceFiles(workspaceData);
        }
      } catch (e) {
        console.error("Failed to re-sync files:", e);
      }
    } catch (err: unknown) {
      setTestPanel({
        status: "error",
        passed: 0,
        total: 1,
        failedTests: [getErrorMessage(err)],
        summary: "Unable to run validation tests."
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Run standard local shell utility command instantly
  const handleExecuteSystemCommand = async (sysCommand: string) => {
    if (isRunning) return;

    setIsRunning(true);
    setTerminalLogs(prev => appendTerminalLogs(prev, [
      terminalCommandLine(terminalCwd, sysCommand)
    ], terminalCwd));

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSlug,
          command: sysCommand,
          sessionId,
          cwd: terminalCwd
        })
      });

      const data = await response.json() as ExecuteResponse;
      if (!response.ok) {
        throw new Error(data.error || `Command failed with status ${response.status}`);
      }

      // Handle CD state updates back from server
      let nextCwd = terminalCwd;
      if (data.newCwd !== undefined) {
        setTerminalCwd(data.newCwd);
        nextCwd = data.newCwd;
      }

      const rawStdout = stripAnsiCodes(data.stdout || "");
      const rawStderr = stripAnsiCodes(data.stderr || "");
      const combinedLines = normalizeTerminalLines([rawStdout, rawStderr]);

      setTerminalLogs(prev => appendTerminalLogs(prev, [
        ...combinedLines,
      ], nextCwd));

      // Re-fetch files in case shell command modified them
      try {
        const res = await fetch(`/api/workspace?problemSlug=${problemSlug}`);
        if (res.ok) {
          const workspaceData = await res.json() as WorkspaceResponse;
          reconcileWorkspaceFiles(workspaceData);
        }
      } catch (e) {
        console.error("Failed to re-sync files:", e);
      }
    } catch (err: unknown) {
      setTerminalLogs(prev => appendTerminalLogs(prev, [
        `Error running command: ${getErrorMessage(err)}`,
      ], terminalCwd));
    } finally {
      setIsRunning(false);
    }
  };

  // Handle Command History Arrow Navigation
  const handleTerminalKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length === 0) return;
      const nextIndex = historyIndex + 1;
      if (nextIndex < commandHistory.length) {
        setHistoryIndex(nextIndex);
        setTerminalInput(commandHistory[commandHistory.length - 1 - nextIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIndex = historyIndex - 1;
      if (nextIndex >= 0) {
        setHistoryIndex(nextIndex);
        setTerminalInput(commandHistory[commandHistory.length - 1 - nextIndex]);
      } else {
        setHistoryIndex(-1);
        setTerminalInput("");
      }
    }
  };

  // Interactive CLI commands form submit handler
  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    setTerminalInput("");

    // Append to Command History
    setCommandHistory(prev => [...prev, cmd]);
    setHistoryIndex(-1);

    if (cmd === "clear") {
      setTerminalLogs([terminalPrompt(terminalCwd)]);
      return;
    }

    if (cmd.startsWith("/")) {
      setTerminalLogs(prev => appendTerminalLogs(prev, [
        terminalCommandLine(terminalCwd, cmd),
        `[system] Unsupported slash command: ${cmd}. Use status, run, prompt, ask, test, or clear.`
      ], terminalCwd));
      return;
    }

    // Define helper list of specific shortcuts
    const isExplicitTest = cmd === "test" || cmd === "antigravity test" || cmd === "agy test" || cmd === "python run_tests.py";
    const isExplicitRun = cmd === "run" || cmd === "antigravity run" || cmd === "agy run";
    const isExplicitStatus = cmd === "status" || cmd === "antigravity status" || cmd === "agy status";
    const isExplicitCi = cmd === "ci" || cmd === "antigravity ci" || cmd === "agy ci";

    if (isExplicitTest) {
      handleRunTests();
      return;
    }

    if (isExplicitRun) {
      handleDeployAgent("antigravity run");
      return;
    }

    if (isExplicitStatus) {
      handleDeployAgent("antigravity status");
      return;
    }

    if (isExplicitCi) {
      handleRunTests();
      return;
    }

    // Check if command is already an agent CLI structure
    if (isAgentCliCommand(cmd)) {
      // Normalize direct shortcut aliases (prompt "..." or ask "...")
      let normalizedCmd = cmd;
      if (cmd.startsWith("prompt ")) {
        normalizedCmd = `antigravity ${cmd}`;
      } else if (cmd.startsWith("ask ")) {
        normalizedCmd = `antigravity ${cmd}`;
      }
      handleDeployAgent(normalizedCmd);
      return;
    }

    // Check if it is a general system/shell command
    const tokens = cmd.split(/\s+/);
    const firstWord = tokens[0]?.toLowerCase() || "";
    const shellUtilities = [
      "ls", "la", "ll", "pwd", "cat", "cd", "python", "python3", "pytest", "pip", "pip3",
      "mkdir", "rm", "rmdir", "touch", "echo", "grep", "git", "whoami", "date", "clear",
      "chmod", "cp", "mv", "find", "sh", "bash", "uname", "curl", "wget", "npm", "node", "npx"
    ];

    const isShellCommand = shellUtilities.includes(firstWord) || cmd.includes("|") || cmd.includes(">") || cmd.includes("&&") || cmd.includes("$");

    if (isShellCommand) {
      handleExecuteSystemCommand(cmd);
      return;
    }

    // For any other non-shortcut plain-text inputs, automatically wrap as antigravity prompt "..."
    const promptCommand = `antigravity prompt "${cmd.replace(/"/g, '\\"')}"`;
    handleDeployAgent(promptCommand);
  };

  // Single-pass Gemini grading submission
  const handleFinishAndEvaluate = async () => {
    // Validate rubric weights sum
    const weightSum = rubrics.reduce((acc, r) => acc + r.weight, 0);
    if (Math.abs(weightSum - 1.00) >= 0.001) {
      setTerminalLogs(prev => appendTerminalLogs(prev, [
        `[WARNING] Cannot trigger evaluation: Rubric weights sum to ${(weightSum * 100).toFixed(0)}%, but must equal exactly 100%.`,
      ], terminalCwd));
      return;
    }

    setIsRunning(false);
    setIsEvaluating(true);
    setCompletionProgress(100);

    setTerminalLogs(prev => appendTerminalLogs(prev, [
      `[system] Submitting sandbox code files for single-pass Gemini evaluation...`,
    ], terminalCwd));

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSlug,
          candidateCode: formatWorkspaceSnapshot({ ...files, [activeTab]: code }),
          executionLogs: thoughtsLog,
          rubrics: rubrics.map(r => ({
            metric_key: r.metric_key,
            metric_label: r.metric_label,
            weight: r.weight,
            description: r.description
          }))
        })
      });

      if (!response.ok) throw new Error("Gemini evaluation failed");
      const gradeReport = await response.json() as GradeReport;

      // If mock demo session, directly bypass to demo report parameters
      const encodedGradeReport = encodeURIComponent(JSON.stringify(gradeReport));

      if (sessionId === "demo-session-id") {
        router.push(`/reports/demo-report-id?problem=${problemSlug}&grade=${encodedGradeReport}`);
        return;
      }

      // Save evaluation scorecard directly to Supabase
      const { data, error } = await supabase
        .from("evaluation_reports")
        .insert({
          session_id: sessionId,
          submitted_code: formatWorkspaceSnapshot({ ...files, [activeTab]: code }),
          score_agentic_flow: gradeReport.score_agentic_flow,
          score_skill_verification: gradeReport.score_skill_verification,
          score_prompt_engineering: gradeReport.score_prompt_engineering,
          score_aggregate: gradeReport.score_aggregate,
          summary_review: gradeReport.summary_review,
          test_cases_passed: gradeReport.test_cases_passed !== undefined ? gradeReport.test_cases_passed : (gradeReport.score_aggregate >= 70 ? 3 : 2),
          test_cases_total: gradeReport.test_cases_total !== undefined ? gradeReport.test_cases_total : 3,
          is_passing: gradeReport.is_passing !== undefined ? gradeReport.is_passing : (gradeReport.score_aggregate >= 70),
          detailed_results: gradeReport
        })
        .select()
        .single();

      if (error) {
        console.warn("Could not insert evaluation scorecard:", error.message);
      }

      if (data && gradeReport.rubric_scores) {
        // Iterate over dynamic rubric scores and save into relational session_rubrics_scores
        for (const rs of gradeReport.rubric_scores) {
          const matchedRubric = rubrics.find(r => r.metric_key === rs.metric_key);
          if (matchedRubric && matchedRubric.id) {
            const { error: rsError } = await supabase
              .from("session_rubrics_scores")
              .insert({
                report_id: data.id,
                rubric_id: matchedRubric.id,
                score: rs.score,
                feedback: rs.feedback
              });
            if (rsError) {
              console.warn(`Error inserting rubric score for ${rs.metric_key}:`, rsError.message);
            }
          }
        }
      }

      // Close and finalize session
      const { error: sessionError } = await supabase
        .from("interview_sessions")
        .update({ status: "completed", ended_at: new Date().toISOString() })
        .eq("id", sessionId);

      if (sessionError) {
        console.warn("Could not update interview session status:", sessionError.message);
      }

      if (data) {
        router.push(`/reports/${data.id}?problem=${problemSlug}`);
      } else {
        router.push(`/reports/demo-report-id?problem=${problemSlug}&grade=${encodedGradeReport}`);
      }
    } catch (err: unknown) {
      console.warn("Routing report fallback:", err);
      router.push(`/reports/demo-report-id?problem=${problemSlug}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className={`min-h-screen bg-bg-dark text-white flex flex-col h-screen overflow-hidden ${activeDrag ? "select-none cursor-" + (activeDrag === "editorTerminal" ? "row-resize" : "col-resize") : ""}`}>
      {/* Laser Top Overlay scanlines */}
      <div className="absolute inset-0 bg-scanlines opacity-[0.02] pointer-events-none" />

      {/* Workspace Header */}
      <header className="min-h-14 border-b border-slate-800/80 bg-bg-panel/90 backdrop-blur-md flex flex-col md:flex-row md:items-center md:justify-between gap-2 px-3 sm:px-6 py-2 shrink-0 relative z-30">
        <div className="flex items-center gap-3 min-w-0 w-full md:w-auto">
          <Link href="/dashboard" aria-label="AntiCode dashboard" className="flex items-center gap-3 rounded-md transition-opacity hover:opacity-90 shrink-0">
            <div className="w-6 h-6 rounded border border-agy-cyan/25 bg-bg-dark flex items-center justify-center overflow-hidden shadow-[0_0_8px_rgba(0,240,255,0.15)]">
              <img src="/assets/anticode_logo.svg" className="w-full h-full object-cover" alt="AntiCode Mini-Logo" />
            </div>
            <span className="font-extrabold tracking-wider text-xs">ANTICODE COCKPIT</span>
          </Link>
          <span className="hidden sm:inline font-mono text-[9px] text-text-muted border-l border-slate-800 pl-3 uppercase truncate">
            MATRIX: {problemSlug}
          </span>
          <span className="hidden lg:inline font-mono text-[9px] text-text-muted border-l border-slate-800 pl-3 uppercase">
            SESSION: {sessionId.substring(0, 8)}
          </span>
          {sessionDetails?.session_type && (
            <span className="hidden lg:inline font-mono text-[9px] text-agy-violet border-l border-slate-800 pl-3 uppercase font-semibold">
              MODE: {sessionDetails.session_type}
            </span>
          )}
        </div>

        <AntigravityCatToggle className="shrink-0" />

        {/* Play/Pause controls */}
        <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto max-w-full w-full md:w-auto pb-1 md:pb-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 font-mono text-[10px] px-2.5 sm:px-3.5 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-agy-cyan hover:text-white transition-all shrink-0 cursor-pointer"
          >
            <Layers className="w-3 h-3 text-agy-cyan" />
            <span>DASHBOARD</span>
          </Link>

          <button
            type="button"
            aria-label="Run tests"
            onClick={handleRunTests}
            disabled={isRunning || isEvaluating}
            className={`flex items-center gap-1.5 font-mono text-[10px] px-2.5 sm:px-3 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer disabled:opacity-40 ${
              testPanel.status === "passed"
                ? "border border-slate-700 hover:bg-slate-800 text-text-muted animate-none"
                : "bg-agy-cyan hover:bg-agy-cyan/90 text-bg-dark font-bold shadow-[0_0_15px_rgba(0,240,255,0.25)] hover:shadow-[0_0_25px_rgba(0,240,255,0.45)]"
            }`}
          >
            <RefreshCw className={`w-3 h-3 ${isRunning ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">RUN TESTS</span>
          </button>

          <button
            type="button"
            aria-label="Evaluate and finish"
            onClick={handleFinishAndEvaluate}
            disabled={isRunning || isEvaluating || testPanel.status !== "passed"}
            className={`flex items-center gap-1.5 font-mono text-[10px] px-2.5 sm:px-4 py-1.5 rounded-lg transition-all shrink-0 cursor-pointer ${
              testPanel.status === "passed"
                ? "bg-agy-cyan hover:bg-agy-cyan/90 text-bg-dark font-bold shadow-[0_0_15px_rgba(0,240,255,0.25)] hover:shadow-[0_0_25px_rgba(0,240,255,0.45)] disabled:opacity-40"
                : "border border-slate-800 bg-slate-900/20 text-text-muted/40 cursor-not-allowed"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isEvaluating ? "SUBMITTING..." : "SUBMIT"}</span>
          </button>
        </div>
      </header>

      {/* Main Split Grid */}
      <div ref={containerRef} className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 relative">

        {/* Left Side: IDE & Terminal (60% width) */}
        <div ref={leftPanelRef} style={{ width: isDesktop ? `${leftWidth}%` : undefined }} className="w-full h-[55%] lg:h-full border-b lg:border-b-0 flex flex-col overflow-hidden">

          {/* Active Physical IDE (Top Panel 35% height) */}
          <div style={{ height: `${editorHeight}%` }} className="flex flex-col bg-bg-dark/40 overflow-hidden shrink-0">
            {/* File explorer tabs */}
            <div className="h-9 border-b border-slate-800/80 bg-bg-panel/40 flex items-center gap-2 px-3 sm:px-4 text-xs font-mono text-text-muted shrink-0 overflow-x-auto overflow-y-hidden">
              <div className="hidden sm:flex items-center gap-1 shrink-0">
                <Folder className="w-3.5 h-3.5 text-text-muted" />
                <span>workspace_sand/</span>
                <span className="text-text-muted/60">({problemSlug})</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 sm:pl-4">
                {openTabs.filter(filePath => files[filePath] !== undefined).map((filePath) => {
                  const isSelected = activeTab === filePath;
                  const basename = getBasename(filePath);
                  const isReadOnly = isReadOnlyFile(filePath);
                  return (
                    <div
                      key={filePath}
                      className={`group h-7 px-3 py-1.5 border-r border-l border-slate-800 flex items-center gap-1.5 relative cursor-pointer text-[11px] ${
                        isSelected ? "bg-bg-dark text-white font-semibold" : "text-text-muted hover:text-white"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => handleTabChange(filePath)}
                        aria-pressed={isSelected}
                        aria-label={`Open file ${filePath}`}
                        className="flex min-w-0 items-center gap-1.5 text-left"
                      >
                        {isReadOnly ? (
                          <Lock className={`w-3 h-3 shrink-0 ${isSelected ? "text-agy-violet animate-pulse" : "text-text-muted/60"}`} />
                        ) : (
                          <FileCode className={`w-3 h-3 shrink-0 ${isSelected ? "text-agy-green" : "text-text-muted"}`} />
                        )}
                        <span className="truncate max-w-[120px]" title={filePath}>{basename}</span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Close file ${filePath}`}
                        onClick={(event) => handleCloseTab(filePath, event)}
                        className={`ml-1 grid h-4 w-4 place-items-center rounded border border-transparent transition-colors ${
                          isSelected
                            ? "text-text-muted hover:border-slate-700 hover:bg-slate-900 hover:text-white"
                            : "text-text-muted/60 hover:border-slate-700 hover:bg-slate-900 hover:text-white"
                        }`}
                        title="Close tab"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      {isSelected && (
                        <div className={`absolute bottom-0 inset-x-0 h-[2px] ${isReadOnly ? "bg-agy-violet shadow-[0_0_8px_rgba(200,80,255,0.6)]" : "bg-agy-green shadow-[0_0_8px_rgba(0,255,100,0.6)]"}`} />
                      )}
                    </div>
                  );
                })}
                {openTabs.filter(filePath => files[filePath] !== undefined).length === 0 && (
                  <span className="px-2 py-1 text-[10px] text-text-muted/60 uppercase tracking-widest">
                    No file open
                  </span>
                )}
              </div>
            </div>

            {/* Code canvas viewport with hierarchical explorer sidebar & active overlapping highlighter editor */}
            <div className="flex-1 flex overflow-hidden">
              
              {/* Hierarchical vertical files explorer sidebar */}
              <div style={{ width: `${sidebarWidth}px` }} className="shrink-0 bg-bg-panel/10 flex flex-col h-full overflow-hidden select-none">
                <div className="h-8 border-b border-slate-800/80 bg-bg-panel/20 flex items-center px-3 font-mono text-[10px] text-text-muted shrink-0 uppercase tracking-widest font-bold">
                  <span>Files Explorer</span>
                </div>
                <div className="flex-1 overflow-auto p-2 scrollbar-thin scrollbar-thumb-slate-800/50">
                  {renderFileTree(buildFileTree(Object.keys(files)))}
                </div>
              </div>

              {/* Drag-to-resize handle for Sidebar explorer */}
              <div
                onPointerDown={handleSidebarResize}
                className="w-[3px] bg-slate-800 hover:bg-agy-cyan/80 cursor-col-resize transition-colors relative z-40 group select-none shrink-0 flex items-center justify-center"
                title="Drag to resize explorer"
              >
                <div className="absolute inset-y-0 -left-[6px] -right-[6px] bg-transparent group-hover:bg-agy-cyan/5 blur-sm pointer-events-none" />
                <div className="w-[1px] h-6 bg-slate-700 group-hover:bg-agy-cyan/50" />
              </div>

              {/* Main overlapping editor canvas */}
              <div className="flex-1 flex overflow-hidden font-mono text-xs text-text-main relative bg-bg-dark/20 h-full">
                
                {/* Scroll-synchronized line numbers */}
                <div
                  ref={lineNumbersRef}
                  className="w-12 border-r border-slate-800/40 py-5 select-none text-right pr-3 font-mono text-text-muted/30 leading-[21px] flex flex-col shrink-0 overflow-hidden bg-bg-dark/10 h-full"
                >
                  {Array.from({ length: Math.max(20, (code || "").split("\n").length) }).map((_, i) => (
                    <div key={i} className="h-[21px] shrink-0">{i + 1}</div>
                  ))}
                </div>

                {/* Overlapping Code input & display layers */}
                <div className="flex-1 h-full relative overflow-hidden">
                  
                  {/* Syntax highlighting display layer */}
                  <pre
                    ref={preRef}
                    className="absolute inset-0 p-5 m-0 border-0 leading-[21px] font-mono text-xs pointer-events-none whitespace-pre overflow-hidden text-text-main"
                    dangerouslySetInnerHTML={{ __html: getHighlighter(code || "", activeTab) }}
                  />

                  {/* Translucent overlay editing input */}
                  <textarea
                    ref={textareaRef}
                    aria-label={`Editor for ${activeTab || "workspace file"}`}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onScroll={handleScroll}
                    spellCheck="false"
                    disabled={!activeTab || isRunning || isEvaluating}
                    className="absolute inset-0 w-full h-full p-5 m-0 border-0 leading-[21px] font-mono text-xs bg-transparent text-transparent caret-white resize-none overflow-auto outline-none focus:ring-0 focus:outline-none"
                    style={{ tabSize: 4 }}
                  />

                  {!activeTab && (
                    <div className="absolute inset-0 grid place-items-center bg-bg-dark/50 font-mono text-[10px] uppercase tracking-widest text-text-muted/60">
                      Select a file from the explorer
                    </div>
                  )}

                  {isSaving && (
                    <div className="absolute right-4 top-4 font-mono text-[9px] text-agy-green animate-pulse flex items-center gap-1.5 bg-bg-dark/80 px-2 py-1 rounded border border-agy-green/20 z-10">
                      <Database className="w-3.5 h-3.5" />
                      <span>AUTO-SAVING...</span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* Drag-to-resize handle for Editor/Terminal splits */}
          <div
            onPointerDown={handleEditorTerminalResize}
            className="h-[3px] bg-slate-800 hover:bg-agy-green/80 cursor-row-resize transition-colors relative z-40 group select-none shrink-0 flex items-center justify-center"
            title="Drag to resize editor & terminal"
          >
            <div className="absolute inset-x-0 -top-[6px] -bottom-[6px] bg-transparent group-hover:bg-agy-green/5 blur-sm pointer-events-none" />
            <div className="h-[1px] w-6 bg-slate-700 group-hover:bg-agy-green/50" />
          </div>

          {/* Physically Working Terminal CLI Console (Bottom Panel 65% height) */}
          <div className="flex flex-col bg-bg-dark overflow-hidden flex-1 min-h-0">
            <div className="h-8 border-b border-slate-800/80 bg-bg-panel/30 flex items-center px-4 justify-between font-mono text-[10px] text-text-muted shrink-0">
              <span className="flex items-center gap-1.5">
                <TerminalIcon className="w-3.5 h-3.5 text-agy-cyan animate-pulse" />
                VIRTUAL TERMINAL CLI (Isolated Environment){terminalCwd ? ` - /${terminalCwd}` : " - /"}
              </span>
              <span className="text-agy-green">ONLINE: UTC-8</span>
            </div>

            {/* Logs Area */}
            <div
              ref={terminalViewportRef}
              onScroll={handleTerminalViewportScroll}
              className="flex-1 overflow-auto scroll-smooth p-4 font-mono text-[11px] leading-relaxed space-y-1.5 select-text"
            >
              {terminalLogs.map((log, i) => {
                const isUserPrompt = log.includes("agy 🧠") && log.includes(">>");
                const isAgentCall = log.includes("[antigravity sdk]") || log.includes("antigravity agent calling") || log.includes("[antigravity agent]");
                const isAgentThought = log.includes("[THINKING]") || log.includes("antigravity agent:");
                const isPassed = log.includes("PASSED") || log.includes("SUCCESS");
                const isSystemError = log.includes("ERROR") || log.includes("Error") || log.includes("WARNING");

                let logClass = "text-text-muted";
                if (isUserPrompt) logClass = "text-agy-cyan font-semibold";
                else if (isAgentCall) logClass = "text-agy-violet";
                else if (isAgentThought) logClass = "text-agy-green";
                else if (isPassed) logClass = "text-text-green font-bold";
                else if (isSystemError) logClass = "text-text-red font-semibold";

                return (
                  <div key={i} className={logClass}>
                    {isUserPrompt ? (
                      (() => {
                        const parts = log.split(">>");
                        const promptPrefix = parts[0] + ">>";
                        const promptText = parts.slice(1).join(">>");
                        return (
                          <>
                            <span className="text-agy-cyan font-semibold mr-1.5">{promptPrefix}</span>
                            <span className="text-white font-semibold">{promptText}</span>
                          </>
                        );
                      })()
                    ) : log}
                  </div>
                );
              })}
              <div ref={terminalEndRef} />
            </div>

            {/* Command form field */}
            <form onSubmit={handleTerminalSubmit} className="h-10 border-t border-slate-800/80 bg-bg-panel/20 flex items-center px-4 font-mono text-xs">
              <span className="text-agy-cyan font-semibold mr-2 shrink-0">agy 🧠 {terminalCwd ? `(/${terminalCwd})` : "(/)"} &gt;&gt;</span>
              <input
                type="text"
                aria-label="Terminal command"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                onKeyDown={handleTerminalKeyDown}
                disabled={isRunning || isEvaluating}
                placeholder="Ask or prompt the agent directly..."
                className="flex-1 bg-transparent text-white outline-none border-none caret-agy-cyan focus:ring-0"
              />
            </form>
          </div>

        </div>

        {/* Drag-to-resize handle for Left/Right panels */}
        {isDesktop && (
          <div
            onPointerDown={handleLeftRightResize}
            className="hidden lg:flex w-[3px] bg-slate-800 hover:bg-agy-cyan/80 cursor-col-resize transition-colors relative z-40 group select-none shrink-0 items-center justify-center"
            title="Drag to resize panels"
          >
            <div className="absolute inset-y-0 -left-[6px] -right-[6px] bg-transparent group-hover:bg-agy-cyan/5 blur-sm pointer-events-none" />
            <div className="w-[1px] h-6 bg-slate-700 group-hover:bg-agy-cyan/50" />
          </div>
        )}

        {/* Right Side: Telemetry Metrics & Participant Panel (40% width) */}
        <div style={{ width: isDesktop ? `${100 - leftWidth}%` : undefined }} className="w-full h-[45%] lg:h-full bg-bg-panel/25 flex flex-col overflow-hidden">



          {isInterviewer && (
            <div className="mx-5 mt-4 p-4 rounded-xl border border-agy-violet/40 bg-agy-violet/5 space-y-4 shadow-[0_0_15px_rgba(157,78,221,0.1)] relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-agy-violet/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between border-b border-agy-violet/20 pb-2 shrink-0">
                <h4 className="font-mono text-[10px] font-bold tracking-widest text-agy-violet uppercase flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 animate-pulse" />
                  INTERVIEWER SYSTEM CONTROL DECK
                </h4>
                <span className="font-mono text-[8px] bg-agy-violet/20 text-agy-violet border border-agy-violet/30 px-1.5 py-0.5 rounded uppercase font-semibold">
                  ESCALATED PRIVILEGES
                </span>
              </div>

              {/* Grid controls */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  aria-pressed={showSolution}
                  onClick={() => setShowSolution(!showSolution)}
                  className={`py-2 px-2 rounded-lg border font-mono text-[9px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    showSolution
                      ? "bg-agy-violet text-white border-agy-violet shadow-[0_0_12px_rgba(157,78,221,0.3)]"
                      : "bg-bg-dark/60 text-agy-violet border-agy-violet/30 hover:bg-agy-violet/10 hover:border-agy-violet/50"
                  }`}
                >
                  <Eye className="w-3 h-3" />
                  <span>{showSolution ? "HIDE CHEATSHEET" : "REVEAL SOLUTIONS"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setInjectedStrain(true);
                    setThoughtsLog(prev => [
                      ...prev,
                      `[INTERVIEWER OVERRIDE] --- INJECTING COGNITIVE STRESS-TEST ---`,
                      `[ALERT] Direct adversarial prompt load injected into context loop.`,
                      `[THINKING] COMPLIANCE WARNING: Dynamic context limit reached. Adjusting temperature parameters to 0.8 to escape lock...`,
                      `[ACTION] Re-routing backup semantic agents...`
                    ]);
                    setTerminalLogs(prev => appendTerminalLogs(prev, [
                      `[WARNING] --- ESCALATED ANOMALY STRAIN LOADED ---`,
                      `[VM CLUSTER] Dynamic network delay increased by 150ms.`,
                    ], terminalCwd));
                  }}
                  disabled={injectedStrain}
                  className="py-2 px-2 rounded-lg border border-text-red/30 bg-text-red/5 text-text-red hover:bg-text-red/10 font-mono text-[9px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-40"
                >
                  <AlertTriangle className="w-3 h-3 animate-bounce" />
                  <span>{injectedStrain ? "ANOMALY ACTIVE" : "INJECT STRESS"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setVmPatched(true);
                    setTerminalLogs(prev => appendTerminalLogs(prev, [
                      terminalCommandLine(terminalCwd, "antigravity sys --patch-vm"),
                      `[system] Initiating VM kernel hot-patch...`,
                      `[system] Flush file cache: SUCCESS`,
                      `[system] Recalibrating VPC firewall parameters...`,
                      `[system] Core sandbox fully synchronized and refreshed!`,
                    ], terminalCwd));
                  }}
                  disabled={vmPatched}
                  className="py-2 px-2 rounded-lg border border-agy-cyan/30 bg-agy-cyan/5 text-agy-cyan hover:bg-agy-cyan/10 font-mono text-[9px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-40"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{vmPatched ? "VM PATCHED" : "HOT-PATCH VM"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCompletionProgress(100);
                    setTerminalLogs(prev => appendTerminalLogs(prev, [
                      terminalCommandLine(terminalCwd, "antigravity bypass-tests --force-pass"),
                      `[system] Initiating test bypass sequence...`,
                      `[system] Override local unit-test results...`,
                      `[system] 3/3 secret validation cases passed (FORCED BY INTERVIEWER)`,
                    ], terminalCwd));
                  }}
                  className="py-2 px-2 rounded-lg border border-agy-green/30 bg-agy-green/5 text-agy-green hover:bg-agy-green/10 font-mono text-[9px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <CheckCircle className="w-3 h-3" />
                  <span>FORCE PASS SUITE</span>
                </button>
              </div>

              {/* Show Solution Section */}
              <AnimatePresence>
                {showSolution && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border border-agy-violet/25 bg-bg-dark/85 rounded-lg p-3.5 font-mono text-[9px] leading-relaxed text-text-muted space-y-2.5 relative overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]"
                  >
                    <div className="font-semibold text-agy-violet uppercase border-b border-agy-violet/20 pb-1.5 flex justify-between">
                      <span>REFERENCE ARCHITECTURE GUIDE</span>
                    </div>
                    {problemSlug === "agentic-matrix-optimizer" ? (
                      <div className="space-y-1.5">
                        <p className="text-white font-semibold">Latency Cleanup:</p>
                        <p>1. Remove the artificial sleep from the hot path.</p>
                        <p>2. Return the direct np.matmul result without changing the function contract.</p>
                        <p className="text-agy-green">Cheat snippet: <code className="bg-bg-dark border border-slate-800 px-1 rounded text-[8.5px]">return np.matmul(matrix_a, matrix_b)</code></p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <p className="text-white font-semibold">Security Pattern Match:</p>
                        <p>1. Block any direct evaluations of user execution paths.</p>
                        <p>2. Enforce sanitization using Pydantic schema validation structures.</p>
                        <p className="text-agy-green">Cheat snippet: <code className="bg-bg-dark border border-slate-800 px-1 rounded text-[8.5px]">validator.clean_pydantic_schema(input_data)</code></p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Interactive manual weight tuning sliders */}
              <div className="space-y-3 bg-bg-dark/40 border border-slate-800/40 p-4 rounded-xl font-mono text-[9px]">
                <div className="text-text-muted uppercase font-bold tracking-wider mb-2 text-[8px] flex justify-between items-center">
                  <span>METRIC EVALUATION WEIGHTS</span>
                  <span className={`${
                    Math.abs(rubrics.reduce((acc, r) => acc + r.weight, 0) - 1.00) < 0.001
                      ? "text-agy-green font-bold"
                      : "text-text-red font-bold animate-pulse"
                  }`}>
                    TOTAL: {(rubrics.reduce((acc, r) => acc + r.weight, 0) * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="space-y-3">
                  {rubrics.map((rubric, idx) => (
                    <div key={rubric.metric_key || idx}>
                      <div className="flex justify-between text-[8px] text-text-muted mb-1">
                        <span className="truncate max-w-[150px]" title={rubric.metric_label}>{rubric.metric_label}</span>
                        <span className="text-white font-semibold">{(rubric.weight * 100).toFixed(0)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="range" min="0" max="100" step="5"
                          aria-label={`${rubric.metric_label} weight`}
                          value={Math.round(rubric.weight * 100)}
                          onChange={(e) => {
                            const newWeight = parseInt(e.target.value) / 100;
                            setRubrics(prev => prev.map((r, i) => i === idx ? { ...r, weight: newWeight } : r));
                          }}
                          className="flex-1 accent-agy-violet bg-bg-dark h-1 rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  ))}
                  {Math.abs(rubrics.reduce((acc, r) => acc + r.weight, 0) - 1.00) >= 0.001 && (
                    <div className="text-[8px] text-text-red font-semibold bg-text-red/10 border border-text-red/20 px-2 py-1.5 rounded flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-text-red shrink-0" />
                      <span>Warning: Weights must sum to exactly 100% before evaluating.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Live Telemetry Ticker Console */}
          <div className="flex-1 p-5 overflow-hidden flex flex-col space-y-4">
            <h4 className="font-mono text-[10px] font-bold tracking-widest text-text-muted uppercase flex items-center gap-1.5 shrink-0">
              <TrendingUp className="w-3.5 h-3.5 text-agy-cyan" />
              INTELLIGENT RUN TELEMETRY
            </h4>

            {/* Top parameters tickers */}
            <div className="grid grid-cols-3 gap-2.5 shrink-0">
              <div className="bg-bg-dark/40 border border-slate-800/50 p-2.5 rounded-xl text-center space-y-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
                <span className="font-mono text-[8px] text-text-muted uppercase tracking-wider block">TOKENS</span>
                <span className="text-base font-bold font-mono tracking-tight text-white block">
                  {totalTokens.toLocaleString()}
                </span>
                <span className="font-mono text-[8px] text-text-muted block uppercase">
                  P: {(sessionDetails?.total_input_tokens || 0).toLocaleString()} | R: {(sessionDetails?.total_output_tokens || 0).toLocaleString()}
                </span>
              </div>
              <div className="bg-bg-dark/40 border border-slate-800/50 p-2.5 rounded-xl text-center space-y-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
                <span className="font-mono text-[8px] text-text-muted uppercase tracking-wider block">REASONING</span>
                <span className="text-base font-bold font-mono tracking-tight text-agy-violet block animate-pulse">
                  {reasoningTokens.toLocaleString()}
                </span>
                <span className="font-mono text-[8px] text-agy-green block uppercase">THINKING CORES</span>
              </div>
              <div className="bg-bg-dark/40 border border-slate-800/50 p-2.5 rounded-xl text-center space-y-1 shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]">
                <span className="font-mono text-[8px] text-text-muted uppercase tracking-wider block">COST</span>
                <span className="text-base font-bold font-mono tracking-tight text-agy-cyan block">
                  ${totalCost.toFixed(4)}
                </span>
                <span className="font-mono text-[8px] text-text-muted block uppercase">BUDGET: $5.00</span>
              </div>
            </div>

            {/* Pipeline progress bar */}
            <div className="bg-bg-panel/40 border border-slate-800 p-4 rounded-xl space-y-2 shrink-0">
              <div className="flex justify-between font-mono text-[10px]">
                <span className="text-text-muted uppercase tracking-wider">PIPELINE MILESTONE STATUS</span>
                <span className="text-white font-bold">{completionProgress}%</span>
              </div>
              <div className="w-full h-2 bg-bg-dark rounded-full overflow-hidden border border-slate-800/80">
                <motion.div
                  className="h-full bg-gradient-to-r from-agy-cyan via-agy-green to-agy-green-bright"
                  animate={{ width: `${completionProgress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Validation test results */}
            <div className="flex-1 bg-bg-dark border border-slate-800/60 rounded-xl p-4 flex flex-col overflow-hidden min-h-0 relative">
              <div className="absolute inset-0 bg-cyber-grid bg-[size:20px_20px] opacity-[0.03] pointer-events-none" />

              <div className="font-mono text-[10px] text-text-muted pb-2 border-b border-slate-800/80 uppercase tracking-widest shrink-0 flex items-center gap-1.5 relative z-10">
                <CheckCircle className={`w-3.5 h-3.5 ${
                  testPanel.status === "failed" || testPanel.status === "error"
                    ? "text-text-red"
                    : "text-agy-green"
                }`} />
                Validation Test Results
              </div>

              <div className="flex-1 overflow-auto mt-3 font-mono text-[10px] leading-relaxed space-y-3 select-text pr-1 relative z-10">
                {testPanel.status === "idle" ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-text-muted/60 uppercase">
                    <CheckCircle className="w-6 h-6 text-slate-800 mb-2" />
                    <span>Run tests to populate validation results.</span>
                  </div>
                ) : testPanel.status === "running" ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-agy-cyan uppercase">
                    <RefreshCw className="w-6 h-6 animate-spin mb-2" />
                    <span>{testPanel.summary}</span>
                  </div>
                ) : (
                  <>
                    <div className={`rounded-xl border p-4 ${
                      testPanel.status === "passed"
                        ? "border-agy-green/25 bg-agy-green/5"
                        : "border-text-red/25 bg-text-red/5"
                    }`}>
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <span className="text-[8px] uppercase tracking-widest text-text-muted block">Tests Passed</span>
                          <span className="text-3xl font-extrabold text-white tracking-tight">
                            {testPanel.passed}/{testPanel.total}
                          </span>
                        </div>
                        <span className={`text-[9px] uppercase font-bold px-2 py-1 rounded border ${
                          testPanel.status === "passed"
                            ? "text-agy-green border-agy-green/25 bg-agy-green/10"
                            : "text-text-red border-text-red/25 bg-text-red/10"
                        }`}>
                          {testPanel.status === "passed" ? "PASSING" : "ATTENTION"}
                        </span>
                      </div>
                      <p className="mt-3 text-text-muted leading-relaxed">{testPanel.summary}</p>
                    </div>

                    <div className="rounded-xl border border-slate-800/80 bg-bg-panel/30 p-3">
                      <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 mb-2">
                        <span className="text-[8px] uppercase tracking-widest text-text-muted">Failed Tests</span>
                        <span className="text-[8px] text-text-muted/70 uppercase">
                          {testPanel.failedTests.length} item{testPanel.failedTests.length === 1 ? "" : "s"}
                        </span>
                      </div>
                      {testPanel.failedTests.length === 0 ? (
                        <div className="flex items-center gap-2 text-agy-green py-2">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>All listed tests passed.</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {testPanel.failedTests.map((testName, index) => (
                            <div key={`${testName}-${index}`} className="whitespace-pre-wrap rounded-lg border border-text-red/20 bg-bg-dark/70 p-2.5 text-text-red leading-relaxed">
                              {testName}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

import { Suspense } from "react";

export default function WorkspacePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-dark text-white flex flex-col items-center justify-center font-mono text-xs uppercase tracking-wider gap-3">
        <Activity className="w-8 h-8 text-agy-green animate-pulse" />
        <span>Initializing Workspace Secure Node...</span>
      </div>
    }>
      <WorkspaceCockpit />
    </Suspense>
  );
}
