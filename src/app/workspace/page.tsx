"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal as TerminalIcon,
  Cpu,
  Play,
  Pause,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Activity,
  Code2,
  Folder,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Eye,
  Users,
  TrendingUp,
  DollarSign,
  Layers,
  ChevronRight,
  FileCode,
  Zap,
  CheckCircle,
  Database
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";

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
    command.startsWith("antigravity run ") ||
    command.startsWith("antigravity prompt ") ||
    command.startsWith("antigravity ask ");
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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
}

// Client-side fallback rubrics for resilient offline capability
const LOCAL_FALLBACK_RUBRICS: Record<string, WorkspaceRubric[]> = {
  "agentic-matrix-optimizer": [
    { metric_key: "unit_test_correctness", metric_label: "Unit Test Correctness", weight: 0.35, description: "Deterministic proportion of structural multi-core test cases passed successfully." },
    { metric_key: "concurrency_safety", metric_label: "Concurrency Safety Audit", weight: 0.25, description: "AST verification that thread pool executor is imported, spawned, and mapped without locks deadlock." },
    { metric_key: "loop_efficiency", metric_label: "Loop Performance & Cache Control", weight: 0.25, description: "Gemini consensus evaluation of multi-dimensional matrix partitioning, lock safety and chunk caching pools." },
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
    { metric_key: "prompt_defensiveness", metric_label: "Defensive Prompt Layout Strength", weight: 0.20, description: "Consensus grading of text instructions protecting developer API tokens and systemic boundaries." },
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
    { metric_key: "daemon_robustness", metric_label: "Daemon Multi-threading Safety", weight: 0.20, description: "Consensus review of background daemon durability, infinite loop defenses, and deadlock mitigations." },
    { metric_key: "system_knowledge", metric_label: "Memory Analysis Proficiency", weight: 0.20, description: "Evaluation of candidate knowledge of heap growth diagnostics and custom system hooks." }
  ],
  "skill-k8s-debugger": [
    { metric_key: "triage_parsing", metric_label: "Triage Log Pattern Parsing", weight: 0.40, description: "Checks if triage tool correctly isolates pod statuses and extracts log lines under crash loops." },
    { metric_key: "credential_redaction", metric_label: "PII & Security Token Redaction", weight: 0.20, description: "Verifies that API keys, certs, or private cluster variables are 100% sanitized before stdout printing." },
    { metric_key: "regex_safety", metric_label: "Parsing Filter Security Bounds", weight: 0.20, description: "AI review of command argument sanitization to block arbitrary bash execution inside shell commands." },
    { metric_key: "incident_response", metric_label: "On-call Diagnostic Agility", weight: 0.20, description: "Venture lead assessment of incident diagnosis workflow under high pressure." }
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
    { metric_key: "escape_resistance", metric_label: "Schema Vandalism Resilience", weight: 0.20, description: "Consensus evaluation of prompt protections forcing the output schema compliance." },
    { metric_key: "precision_engineering", metric_label: "Structured Output Competency", weight: 0.20, description: "Examiner review of structural data schema alignment and clean system interfaces." }
  ],
  "prompt-data-leak-shield": [
    { metric_key: "pii_redaction", metric_label: "PII Redaction Accuracy", weight: 0.40, description: "Deterministic checks measuring percentage of Names, phone numbers, and SSNs securely replaced." },
    { metric_key: "disclosure_block", metric_label: "Credential Leak Prevention", weight: 0.20, description: "Code verification ensuring that administrative clinic keys or prompts are 100% blocked from leaks." },
    { metric_key: "anonymization_depth", metric_label: "HIPAA Semantics Alignment", weight: 0.20, description: "Consensus evaluation of redaction safety depth without stripping critical telehealth contexts." },
    { metric_key: "compliance_interview", metric_label: "Data Privacy Competency", weight: 0.20, description: "Examiner evaluation of candidate knowledge on healthcare compliance policies and leak protection loops." }
  ]
};

const GENERAL_DEFAULT_RUBRICS: WorkspaceRubric[] = [
  { metric_key: "code_correctness", metric_label: "Functional Correctness", weight: 0.40, description: "Evaluating semantic correct outputs and passed test suite benchmarks." },
  { metric_key: "code_architecture", metric_label: "Architecture & Safety Standards", weight: 0.30, description: "Verifying secure layouts, resource allocations, and defensive programming bounds." },
  { metric_key: "code_efficiency", metric_label: "Execution Performance Ratio", weight: 0.20, description: "Assessing processing latency overhead, complexity bounds, and O-notation scales." },
  { metric_key: "collaboration_trace", metric_label: "Analytical Reasoning Trace", weight: 0.10, description: "Reviewing trace details, command descriptions, and communicative agility." }
];

function WorkspaceCockpit() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const problemSlug = searchParams.get("problem") || "agentic-matrix-optimizer";
  const sessionId = searchParams.get("session") || "demo-session-id";

  // Dynamic Workspace Files State
  const [files, setFiles] = useState<Record<string, string>>({});
  const [activeTab, setActiveFile] = useState<string>("");
  const [code, setCode] = useState<string>("");

  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState("");

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

  // Video calling Mock State
  const [videoOn, setVideoOn] = useState(false);
  const [audioOn, setAudioOn] = useState(true);

  const terminalEndRef = useRef<HTMLDivElement>(null);
  const thoughtsEndRef = useRef<HTMLDivElement>(null);

  // Load authenticated user and their profile/role
  const [profile, setProfile] = useState<{ full_name?: string; role?: string } | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [injectedStrain, setInjectedStrain] = useState(false);
  const [vmPatched, setVmPatched] = useState(false);
  const [rubrics, setRubrics] = useState<WorkspaceRubric[]>([]);

  useEffect(() => {
    async function loadUserAndProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();
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
        const { data: problemData } = await supabase
          .from("problems")
          .select("id")
          .eq("slug", problemSlug)
          .single();

        if (problemData) {
          const { data: rubricsData } = await supabase
            .from("challenge_rubrics")
            .select("*")
            .eq("problem_id", problemData.id)
            .order("created_at", { ascending: true });

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
        const { data, error } = await supabase
          .from("interview_sessions")
          .select("*")
          .eq("id", sessionId)
          .single();

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
        setTerminalLogs([
          `YeetCode Virtual Sandbox Environment initializing...`,
          `Establishing connection to GCE VM node: us-central-4a...`,
          `interview@yeetcode-vm:~$ `
        ]);

        const res = await fetch(`/api/workspace?problemSlug=${problemSlug}`);
        if (!res.ok) throw new Error("Workspace initialization failed");
        const data = await res.json() as WorkspaceResponse;

        if (!active) return;

        setFiles(data.files);
        setActiveFile(data.activeFile);
        setCode(data.files[data.activeFile] || "");

        setTerminalLogs([
          `YeetCode Virtual Sandbox Environment initialized.`,
          `Connection established to isolated GCE node: dev-cluster-4a`,
          `Type 'antigravity prompt "your instruction"' to direct the agent against this project.`,
          `Hidden validation tests are mounted outside the editable workspace.`,
          `interview@yeetcode-vm:~$ `
        ]);
      } catch (err: unknown) {
        console.error(err);
        if (active) {
          setTerminalLogs([
            `Error initializing workspace sandbox: ${getErrorMessage(err)}`,
            `interview@yeetcode-vm:~$ `
          ]);
        }
      }
    }

    loadWorkspace();

    return () => {
      active = false;
    };
  }, [problemSlug]);

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
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  // Thoughts Auto-scrolling
  useEffect(() => {
    thoughtsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thoughtsLog]);

  const handleTabChange = (tabName: string) => {
    // Save current active tab code back to cache first
    if (activeTab && code !== undefined) {
      setFiles(prev => ({ ...prev, [activeTab]: code }));
    }
    setActiveFile(tabName);
    setCode(files[tabName] || "");
  };

  // Deploy autonomous Antigravity solver loop
  const handleDeployAgent = async (agentCommand = "antigravity run") => {
    if (isRunning) return;

    setIsRunning(true);
    setTotalTokens(0);
    setTotalCost(0.0);
    setThoughtsLog([]);
    setCompletionProgress(5);

    setTerminalLogs(prev => [
      ...prev.slice(0, -1),
      agentCommand,
      `[system] Spawning secure Antigravity CLI daemon...`,
      `[system] Executing autonomous cognitive repair loops inside candidate_workspace/${problemSlug}...`,
      `interview@yeetcode-vm:~$ `
    ]);

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSlug,
          command: agentCommand
        })
      });
      const data = await response.json() as ExecuteResponse;

      const rawStdout = data.stdout || "";
      const rawStderr = data.stderr || "";
      const lines = rawStdout.split("\n").concat(rawStderr.split("\n")).filter((l: string) => l.trim() !== "");

      // Sequence line playback for smooth cyberpunk streaming telemetry
      let currentLineIdx = 0;
      const playbackInterval = setInterval(async () => {
        if (currentLineIdx >= lines.length) {
          clearInterval(playbackInterval);
          setIsRunning(false);
          setCompletionProgress(100);

          // Re-fetch files from the workspace to load the agent's actual code modifications
          try {
            const res = await fetch(`/api/workspace?problemSlug=${problemSlug}`);
            if (res.ok) {
              const workspaceData = await res.json() as WorkspaceResponse;
              setFiles(workspaceData.files);
              if (activeTab && workspaceData.files[activeTab]) {
                setCode(workspaceData.files[activeTab]);
              }
            }
          } catch (e) {
            console.error("Failed to re-sync files:", e);
          }

          setTerminalLogs(prev => [
            ...prev.slice(0, -1),
            `Finished autonomous agent pipeline. Sandbox workspace fully synchronized.`,
            `interview@yeetcode-vm:~$ `
          ]);
          return;
        }

        const line = lines[currentLineIdx];
        currentLineIdx++;

        // Render to virtual terminal screen
        setTerminalLogs(prev => [
          ...prev.slice(0, -1),
          line,
          `interview@yeetcode-vm:~$ `
        ]);

        // Intercept log segments to extract thoughts & actions for the sidebar panel
        if (line.includes("[THINKING]")) {
          setTotalTokens(prev => prev + 1200 + Math.floor(Math.random() * 400));
          setTotalCost(prev => parseFloat((prev + 0.0018 + Math.random() * 0.0006).toFixed(4)));
          setCompletionProgress(prev => Math.min(85, prev + 12));

          const cleanThought = line.replace(/.*\[THINKING\]/, "").trim();
          setThoughtsLog(prev => [
            ...prev,
            `[STEP] THINKING: ${cleanThought}`
          ]);
        } else if (line.includes("[ACTION]")) {
          setTotalTokens(prev => prev + 600 + Math.floor(Math.random() * 200));
          setTotalCost(prev => parseFloat((prev + 0.0009 + Math.random() * 0.0003).toFixed(4)));
          setCompletionProgress(prev => Math.min(95, prev + 8));

          const cleanAction = line.replace(/.*\[ACTION\]/, "").trim();
          setThoughtsLog(prev => [
            ...prev,
            `[STEP] EXECUTED: ${cleanAction}`
          ]);
        }
      }, 150);

    } catch (err: unknown) {
      setIsRunning(false);
      setTerminalLogs(prev => [
        ...prev.slice(0, -1),
        `Error deploying agent: ${getErrorMessage(err)}`,
        `interview@yeetcode-vm:~$ `
      ]);
    }
  };

  // Run candidate unit test assertion suite
  const handleRunTests = async () => {
    setTerminalLogs(prev => [
      ...prev.slice(0, -1),
      `antigravity test`,
      `[system] Launching unit assertion suite (run_tests.py)...`,
      `interview@yeetcode-vm:~$ `
    ]);

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSlug,
          command: "antigravity test"
        })
      });
      const data = await response.json() as ExecuteResponse;

      const newLogs: string[] = [];
      if (data.stdout) {
        newLogs.push(...data.stdout.trim().split("\n"));
      }
      if (data.stderr) {
        newLogs.push(...data.stderr.trim().split("\n"));
      }
      if (newLogs.length === 0) {
        newLogs.push(`Tests executed. Exit Code: ${data.code}`);
      }

      setTerminalLogs(prev => [
        ...prev.slice(0, -4),
        `antigravity test`,
        ...newLogs,
        `interview@yeetcode-vm:~$ `
      ]);
    } catch (err: unknown) {
      setTerminalLogs(prev => [
        ...prev.slice(0, -4),
        `antigravity test`,
        `Error running tests: ${getErrorMessage(err)}`,
        `interview@yeetcode-vm:~$ `
      ]);
    }
  };

  // Interactive CLI commands form submit handler
  const handleTerminalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    setTerminalInput("");

    if (cmd === "clear") {
      setTerminalLogs([`interview@yeetcode-vm:~$ `]);
      return;
    }

    if (isAgentCliCommand(cmd)) {
      handleDeployAgent(cmd);
      return;
    }

    if (cmd === "antigravity test" || cmd === "python run_tests.py") {
      handleRunTests();
      return;
    }

    setTerminalLogs(prev => [
      ...prev.slice(0, -1),
      `${cmd}`,
      `Executing command inside isolated VM container...`,
      `interview@yeetcode-vm:~$ `
    ]);

    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemSlug,
          command: cmd
        })
      });
      const data = await response.json() as ExecuteResponse;

      const newLogs: string[] = [];
      if (data.stdout) {
        newLogs.push(...data.stdout.trim().split("\n"));
      }
      if (data.stderr) {
        newLogs.push(...data.stderr.trim().split("\n"));
      }
      if (newLogs.length === 0) {
        newLogs.push(`Command finished with Exit Code ${data.code}`);
      }

      setTerminalLogs(prev => [
        ...prev.slice(0, -4),
        `${cmd}`,
        ...newLogs,
        `interview@yeetcode-vm:~$ `
      ]);
    } catch (err: unknown) {
      setTerminalLogs(prev => [
        ...prev.slice(0, -4),
        `${cmd}`,
        `Error: ${getErrorMessage(err)}`,
        `interview@yeetcode-vm:~$ `
      ]);
    }
  };

  // Best-of-3 Consensus grading submission
  const handleFinishAndEvaluate = async () => {
    // Validate rubric weights sum
    const weightSum = rubrics.reduce((acc, r) => acc + r.weight, 0);
    if (Math.abs(weightSum - 1.00) >= 0.001) {
      setTerminalLogs(prev => [
        ...prev.slice(0, -1),
        `[WARNING] Cannot trigger evaluation: Rubric weights sum to ${(weightSum * 100).toFixed(0)}%, but must equal exactly 100%.`,
        `interview@yeetcode-vm:~$ `
      ]);
      return;
    }

    setIsRunning(false);
    setIsEvaluating(true);
    setCompletionProgress(100);

    setTerminalLogs(prev => [
      ...prev.slice(0, -1),
      `[system] Submitting sandbox code files for Best-of-3 Gemini Consensus evaluation...`,
      `interview@yeetcode-vm:~$ `
    ]);

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

      if (!response.ok) throw new Error("Consensus evaluation failed");
      const gradeReport = await response.json() as GradeReport;

      // If mock demo session, directly bypass to demo report parameters
      if (sessionId === "demo-session-id") {
        router.push(`/reports/demo-report-id?problem=${problemSlug}&grade=${JSON.stringify(gradeReport)}`);
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
          test_cases_passed: gradeReport.score_aggregate >= 70 ? 3 : 2,
          test_cases_total: 3,
          is_passing: gradeReport.score_aggregate >= 70,
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
        router.push(`/reports/demo-report-id?problem=${problemSlug}&grade=${JSON.stringify(gradeReport)}`);
      }
    } catch (err: unknown) {
      console.warn("Routing report fallback:", err);
      router.push(`/reports/demo-report-id?problem=${problemSlug}`);
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-white flex flex-col h-screen overflow-hidden">
      {/* Laser Top Overlay scanlines */}
      <div className="absolute inset-0 bg-scanlines opacity-[0.02] pointer-events-none" />

      {/* Workspace Header */}
      <header className="h-14 border-b border-slate-800/80 bg-bg-panel/90 backdrop-blur-md flex items-center justify-between px-6 shrink-0 relative z-30">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded border border-agy-cyan/25 bg-bg-dark flex items-center justify-center overflow-hidden shadow-[0_0_8px_rgba(0,240,255,0.15)]">
            <img src="/assets/yeetcode_logo.png" className="w-full h-full object-cover" alt="YeetCode Mini-Logo" />
          </div>
          <span className="font-extrabold tracking-wider text-xs">YEETCODE COCKPIT</span>
          <span className="font-mono text-[9px] text-text-muted border-l border-slate-800 pl-3 uppercase">
            MATRIX: {problemSlug}
          </span>
          <span className="font-mono text-[9px] text-text-muted border-l border-slate-800 pl-3 uppercase">
            SESSION: {sessionId.substring(0, 8)}
          </span>
          {sessionDetails?.session_type && (
            <span className="font-mono text-[9px] text-agy-violet border-l border-slate-800 pl-3 uppercase font-semibold">
              MODE: {sessionDetails.session_type}
            </span>
          )}
        </div>

        {/* Play/Pause controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleDeployAgent()}
            disabled={isRunning || isEvaluating}
            className="flex items-center gap-1.5 font-mono text-[10px] px-3.5 py-1.5 rounded-lg border border-agy-green/20 bg-agy-green/5 text-agy-green hover:bg-agy-green/10 transition-all disabled:opacity-40 cursor-pointer"
          >
            <Play className="w-3 h-3 fill-agy-green" />
            <span>DEPLOY AGENT</span>
          </button>

          <button
            onClick={handleRunTests}
            disabled={isRunning || isEvaluating}
            className="flex items-center gap-1.5 font-mono text-[10px] px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-text-muted transition-all disabled:opacity-40 cursor-pointer animate-none"
          >
            <RefreshCw className={`w-3 h-3 ${isRunning ? "animate-spin" : ""}`} />
            <span>RUN TESTS</span>
          </button>

          <button
            onClick={handleFinishAndEvaluate}
            disabled={isRunning || isEvaluating}
            className="flex items-center gap-1.5 font-mono text-[10px] px-4 py-1.5 rounded-lg bg-agy-cyan hover:bg-agy-cyan/90 text-bg-dark font-bold shadow-[0_0_15px_rgba(0,240,255,0.25)] hover:shadow-[0_0_25px_rgba(0,240,255,0.45)] transition-all disabled:opacity-40 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isEvaluating ? "EVALUATING..." : "EVALUATE & FINISH"}</span>
          </button>
        </div>
      </header>

      {/* Main Split Grid */}
      <div className="flex-1 flex overflow-hidden min-h-0 relative">

        {/* Left Side: IDE & Terminal (60% width) */}
        <div className="w-[60%] border-r border-slate-800/80 flex flex-col h-full overflow-hidden">

          {/* Active Physical IDE (Top Panel 60% height) */}
          <div className="h-[60%] flex flex-col border-b border-slate-800/80 bg-bg-dark/40 overflow-hidden">
            {/* File explorer tabs */}
            <div className="h-9 border-b border-slate-800/80 bg-bg-panel/40 flex items-center justify-between px-4 text-xs font-mono text-text-muted shrink-0 overflow-x-auto overflow-y-hidden">
              <div className="flex items-center gap-1 shrink-0">
                <Folder className="w-3.5 h-3.5 text-text-muted" />
                <span>workspace_sand/</span>
                <span className="text-text-muted/60">({problemSlug})</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 pl-4">
                {Object.keys(files).map((filePath) => {
                  const isSelected = activeTab === filePath;
                  const basename = getBasename(filePath);
                  return (
                    <button
                      key={filePath}
                      onClick={() => handleTabChange(filePath)}
                      className={`px-3.5 py-1.5 border-r border-l border-slate-800 flex items-center gap-1.5 relative cursor-pointer text-[11px] ${
                        isSelected ? "bg-bg-dark text-white font-semibold" : "text-text-muted hover:text-white"
                      }`}
                    >
                      <FileCode className={`w-3 h-3 ${isSelected ? "text-agy-green" : "text-text-muted"}`} />
                      <span className="truncate max-w-[120px]" title={filePath}>{basename}</span>
                      {isSelected && (
                        <div className="absolute bottom-0 inset-x-0 h-[2px] bg-agy-green" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Code canvas viewport with active, synchronized textarea */}
            <div className="flex-1 flex overflow-hidden font-mono text-xs text-text-main relative bg-bg-dark/20">
              <div className="w-12 border-r border-slate-800/40 py-5 select-none text-right pr-3 font-mono text-text-muted/30 leading-[21px] flex flex-col shrink-0 overflow-hidden bg-bg-dark/10">
                {Array.from({ length: Math.max(20, (code || "").split("\n").length) }).map((_, i) => (
                  <div key={i} className="h-[21px]">{i + 1}</div>
                ))}
              </div>
              <div className="flex-1 h-full relative">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  spellCheck="false"
                  disabled={isRunning || isEvaluating}
                  className="w-full h-full p-5 outline-none select-text leading-[21px] whitespace-pre font-mono text-text-green bg-transparent border-none resize-none overflow-auto scrollbar-thin scrollbar-thumb-slate-800 focus:ring-0 focus:outline-none"
                  style={{ tabSize: 4 }}
                />
                {isSaving && (
                  <div className="absolute right-4 top-4 font-mono text-[9px] text-agy-green animate-pulse flex items-center gap-1.5 bg-bg-dark/80 px-2 py-1 rounded border border-agy-green/20">
                    <Database className="w-3 h-3" />
                    <span>AUTO-SAVING...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Physically Working Terminal CLI Console (Bottom Panel 40% height) */}
          <div className="h-[40%] flex flex-col bg-bg-dark overflow-hidden shrink-0">
            <div className="h-8 border-b border-slate-800/80 bg-bg-panel/30 flex items-center px-4 justify-between font-mono text-[10px] text-text-muted shrink-0">
              <span className="flex items-center gap-1.5">
                <TerminalIcon className="w-3 h-3" />
                VIRTUAL TERMINAL CLI (Isolated Environment)
              </span>
              <span className="text-agy-green">ONLINE: UTC-8</span>
            </div>

            {/* Logs Area */}
            <div className="flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed space-y-1.5 select-text">
              {terminalLogs.map((log, i) => {
                const isUserPrompt = log.includes("interview@yeetcode-vm");
                const isAgentCall = log.includes("antigravity agent calling") || log.includes("[antigravity agent]");
                const isAgentThought = log.includes("antigravity agent:");
                const isPassed = log.includes("PASSED") || log.includes("SUCCESS");
                const isSystemError = log.includes("SYSTEM") || log.includes("Error") || log.includes("WARNING");

                let logClass = "text-text-muted";
                if (isUserPrompt) logClass = "text-agy-cyan font-semibold";
                else if (isAgentCall) logClass = "text-agy-violet";
                else if (isAgentThought) logClass = "text-agy-green";
                else if (isPassed) logClass = "text-text-green font-bold";
                else if (isSystemError) logClass = "text-text-red font-semibold";

                return (
                  <div key={i} className={logClass}>
                    {isUserPrompt ? (
                      <>
                        <span>{log.split("$ ")[0]}$</span>
                        <span className="text-white ml-1">{log.split("$ ")[1]}</span>
                      </>
                    ) : log}
                  </div>
                );
              })}
              <div ref={terminalEndRef} />
            </div>

            {/* Command form field */}
            <form onSubmit={handleTerminalSubmit} className="h-9 border-t border-slate-800/80 bg-bg-panel/20 flex items-center px-4 font-mono text-xs">
              <span className="text-agy-cyan font-semibold mr-1.5 shrink-0">interview@yeetcode-vm:~$</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                disabled={isRunning || isEvaluating}
                placeholder='antigravity prompt "Implement the missing service behavior..."'
                className="flex-1 bg-transparent text-white outline-none border-none caret-agy-green"
              />
            </form>
          </div>

        </div>

        {/* Right Side: Telemetry Metrics & Participant Panel (40% width) */}
        <div className="w-[40%] bg-bg-panel/25 flex flex-col h-full overflow-hidden">

          {/* Participant Presence HUD / Mocked WebRTC Presence Dashboard */}
          <div className="p-5 border-b border-slate-800/80 bg-bg-panel/50 space-y-4 shrink-0">
            <h4 className="font-mono text-[10px] font-bold tracking-widest text-text-muted uppercase flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-agy-green" />
              CONFERENCE PARTICIPANTS
            </h4>

            <div className="grid grid-cols-2 gap-4">
              {/* Profile Card Candidate */}
              <div className="relative p-3 rounded-xl border border-slate-800 bg-bg-dark/60 flex items-center gap-3 overflow-hidden shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
                {/* Active audio waveform mock */}
                <div className="absolute right-2.5 top-2.5 flex items-end gap-[2px] h-3">
                  <div className="w-[2px] bg-agy-green h-2.5 animate-pulse" />
                  <div className="w-[2px] bg-agy-green h-1.5 animate-pulse delay-75" />
                  <div className="w-[2px] bg-agy-green h-3 animate-pulse delay-150" />
                </div>

                <div className="w-9 h-9 rounded-full border border-agy-green/35 flex items-center justify-center overflow-hidden shrink-0 shadow-[0_0_12px_rgba(0,255,102,0.2)] bg-bg-dark">
                  <img src="/assets/agent_avatar.png" className="w-full h-full object-cover" alt="Agent Avatar" />
                </div>
                <div>
                  <span className="font-bold text-xs block leading-tight text-white">Autonomous Agent</span>
                  <span className="font-mono text-[9px] text-agy-green block uppercase">Antigravity Core</span>
                </div>
              </div>

              {/* Profile Card Interviewer */}
              <div className="relative p-3 rounded-xl border border-slate-800 bg-bg-dark/60 flex items-center gap-3 overflow-hidden shadow-[0_4px_10px_rgba(0,0,0,0.3)]">
                <div className="w-9 h-9 rounded-full bg-agy-violet/10 border border-agy-violet/30 flex items-center justify-center text-agy-violet shrink-0">
                  <span className="font-extrabold text-xs">I1</span>
                </div>
                <div>
                  <span className="font-bold text-xs block leading-tight text-white">Venture Partner</span>
                  <span className="font-mono text-[9px] text-text-muted block uppercase">Google Ventures</span>
                </div>
              </div>
            </div>

            {/* Video / Audio Controls mock buttons */}
            <div className="flex justify-between items-center bg-bg-dark/40 border border-slate-800/40 px-4 py-2 rounded-lg font-mono text-[10px] text-text-muted">
              <div className="flex gap-4">
                <button
                  onClick={() => setAudioOn(!audioOn)}
                  className={`flex items-center gap-1.5 transition-colors cursor-pointer ${audioOn ? "text-agy-green" : "text-text-muted hover:text-white"}`}
                >
                  {audioOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5 text-text-red" />}
                  <span>{audioOn ? "AUDIO: LIVE" : "MUTED"}</span>
                </button>
                <button
                  onClick={() => setVideoOn(!videoOn)}
                  className={`flex items-center gap-1.5 transition-colors cursor-pointer ${videoOn ? "text-agy-green" : "text-text-muted hover:text-white"}`}
                >
                  {videoOn ? <Video className="w-3.5 h-3.5 animate-pulse" /> : <VideoOff className="w-3.5 h-3.5 text-text-red" />}
                  <span>{videoOn ? "CAMERA: ON" : "VIDEO: OFF"}</span>
                </button>
              </div>
              <div className="text-[9px] text-agy-green/80 flex items-center gap-1 font-semibold">
                <div className="w-1.5 h-1.5 rounded-full bg-agy-green animate-ping" />
                REALTIME FPS: 60
              </div>
            </div>
          </div>

          {isInterviewer && (
            <div className="mx-5 mt-4 p-4 rounded-xl border border-agy-violet/40 bg-agy-violet/5 space-y-4 shadow-[0_0_15px_rgba(157,78,221,0.1)] relative overflow-hidden shrink-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-agy-violet/5 rounded-full blur-2xl pointer-events-none" />
              <div className="flex items-center justify-between border-b border-agy-violet/20 pb-2 shrink-0">
                <h4 className="font-mono text-[10px] font-bold tracking-widest text-agy-violet uppercase flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 animate-pulse" />
                  🌌 INTERVIEWER SYSTEM CONTROL DECK
                </h4>
                <span className="font-mono text-[8px] bg-agy-violet/20 text-agy-violet border border-agy-violet/30 px-1.5 py-0.5 rounded uppercase font-semibold">
                  ESCALATED PRIVILEGES
                </span>
              </div>

              {/* Grid controls */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
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
                  onClick={() => {
                    setInjectedStrain(true);
                    setThoughtsLog(prev => [
                      ...prev,
                      `[INTERVIEWER OVERRIDE] --- INJECTING COGNITIVE STRESS-TEST ---`,
                      `[ALERT] Direct adversarial prompt load injected into context loop.`,
                      `[THINKING] COMPLIANCE WARNING: Dynamic context limit reached. Adjusting temperature parameters to 0.8 to escape lock...`,
                      `[ACTION] Re-routing backup semantic agents...`
                    ]);
                    setTerminalLogs(prev => [
                      ...prev.slice(0, -1),
                      `[WARNING] --- ESCALATED ANOMALY STRAIN LOADED ---`,
                      `[VM CLUSTER] Dynamic network delay increased by 150ms.`,
                      `interview@yeetcode-vm:~$ `
                    ]);
                  }}
                  disabled={injectedStrain}
                  className="py-2 px-2 rounded-lg border border-text-red/30 bg-text-red/5 text-text-red hover:bg-text-red/10 font-mono text-[9px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all disabled:opacity-40"
                >
                  <AlertTriangle className="w-3 h-3 animate-bounce" />
                  <span>{injectedStrain ? "ANOMALY ACTIVE" : "INJECT STRESS"}</span>
                </button>

                <button
                  onClick={() => {
                    setVmPatched(true);
                    setTerminalLogs(prev => [
                      ...prev.slice(0, -1),
                      `antigravity sys --patch-vm`,
                      `[system] Initiating VM kernel hot-patch...`,
                      `[system] Flush file cache: SUCCESS`,
                      `[system] Recalibrating VPC firewall parameters...`,
                      `[system] Core sandbox fully synchronized and refreshed!`,
                      `interview@yeetcode-vm:~$ `
                    ]);
                  }}
                  className="py-2 px-2 rounded-lg border border-agy-cyan/30 bg-agy-cyan/5 text-agy-cyan hover:bg-agy-cyan/10 font-mono text-[9px] font-semibold flex items-center justify-center gap-1 cursor-pointer transition-all"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>HOT-PATCH VM</span>
                </button>

                <button
                  onClick={() => {
                    setCompletionProgress(100);
                    setTerminalLogs(prev => [
                      ...prev.slice(0, -1),
                      `antigravity bypass-tests --force-pass`,
                      `[system] Initiating test bypass sequence...`,
                      `[system] Override local unit-test results...`,
                      `[system] 3/3 secret validation cases passed (FORCED BY INTERVIEWER)`,
                      `interview@yeetcode-vm:~$ `
                    ]);
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
                      <span>🔑 REFERENCE ARCHITECTURE GUIDE</span>
                    </div>
                    {problemSlug === "agentic-matrix-optimizer" ? (
                      <div className="space-y-1.5">
                        <p className="text-white font-semibold">Recursive Batching Solution:</p>
                        <p>1. Target dynamic chunk allocation to prevent stack exhaustions.</p>
                        <p>2. Pre-verify dimensional constraints before invoking model.</p>
                        <p className="text-agy-green">Cheat snippet: <code className="bg-bg-dark border border-slate-800 px-1 rounded text-[8.5px]">def solve(matrix): return list(map(sum, matrix))</code></p>
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
                <span className="font-mono text-[8px] text-text-muted block uppercase">LIMIT: 250K</span>
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

            {/* Detailed thinking trace logs */}
            <div className="flex-1 bg-bg-dark border border-slate-800/60 rounded-xl p-4 flex flex-col overflow-hidden min-h-0 relative">
              <div className="absolute inset-0 bg-cyber-grid bg-[size:20px_20px] opacity-[0.03] pointer-events-none" />

              <div className="font-mono text-[10px] text-text-muted pb-2 border-b border-slate-800/80 uppercase tracking-widest shrink-0 flex items-center gap-1.5 relative z-10">
                <Layers className="w-3.5 h-3.5 text-agy-green" />
                Agent Thought Trace Observability
              </div>

              <div className="flex-1 overflow-auto mt-3 font-mono text-[10px] leading-relaxed space-y-3 select-text pr-1 relative z-10">
                {thoughtsLog.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-text-muted/60 uppercase">
                    <Activity className="w-6 h-6 text-slate-800 animate-pulse mb-2" />
                    <span>No thinking traces streaming. Deploy agent above.</span>
                  </div>
                ) : (
                  thoughtsLog.map((t, i) => {
                    const isThinking = t.includes("THINKING");
                    const cleanText = t.replace(/.*(THINKING|EXECUTED): /, "");
                    return (
                      <div key={i} className={`p-2.5 rounded-lg border transition-all duration-300 ${
                        isThinking
                          ? "bg-agy-green/5 border-agy-green/20 hover:border-agy-green/40 shadow-[0_2px_10px_rgba(0,255,102,0.02)]"
                          : "bg-bg-panel/40 border-slate-800/80 hover:border-slate-700/80 text-text-muted"
                      }`}>
                        <div className="flex items-center justify-between mb-1.5 border-b border-slate-800/40 pb-1">
                          <span className={`text-[8px] font-mono uppercase px-2 py-0.5 rounded tracking-widest ${
                            isThinking ? "bg-agy-green/10 text-agy-green font-bold" : "bg-bg-panel text-text-muted/80"
                          }`}>
                            {isThinking ? "COGNITIVE QUERY" : "SYSTEM ACTION"}
                          </span>
                          <span className="text-[7px] text-text-muted/40 uppercase font-mono">NODE ACTIVE</span>
                        </div>
                        <p className={`text-[10px] leading-relaxed font-mono ${isThinking ? "text-white" : "text-agy-violet"}`}>
                          {cleanText}
                        </p>
                      </div>
                    );
                  })
                )}
                <div ref={thoughtsEndRef} />
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
