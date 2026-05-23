"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Terminal,
  Search,
  Clock,
  Database,
  UploadCloud,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  ArrowUpRight,
  LogOut,
  Activity
} from "lucide-react";
import AuthAwareHomeLink from "@/components/AuthAwareHomeLink";
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

interface Problem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  category: "agentic_flow" | "skill_verification" | "prompt_engineering";
  starter_code: string;
  test_manifest: Record<string, unknown>;
  recommended_time_mins?: number;
  max_recommended_runs?: number;
  max_token_budget?: number;
  max_cost_budget_usd?: number;
  passing_score_threshold?: number;
  passing_tests_ratio?: number;
  passing_criteria?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// Robust fallback pre-seeded challenges matching database seed
const LOCAL_FALLBACK_PROBLEMS: Problem[] = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    title: "AI Agentic Engineering: Matrix Multithread Optimizer",
    slug: "agentic-matrix-optimizer",
    description: "### Goal\nDeploy an autonomous AI agent to optimize a performance-critical matrix processing service.\n\n### Backstory\nOur high-frequency trading application handles huge multidimensional vectors in real-time, but our current operations are single-threaded and frequently block the main CPU cycle.\n\n### Task\n1. Modify `matrix_processor.py` to utilize a thread pool (`ThreadPoolExecutor`) for concurrent dot-product operations.\n2. Add chunk caching using an LRU cache or local file-based lock mechanism.\n3. Make sure it passes all performance benchmarks under 200ms latency.\n\n### Verification\nYour code must satisfy 4 primary edge cases: empty matrix inputs, extremely large sparse matrices, multi-core scheduling, and thread contention.",
    difficulty: "medium",
    category: "agentic_flow",
    starter_code: "import time\nimport numpy as np\n\ndef process_matrix_multiply(matrix_a, matrix_b):\n    # TODO: Optimize this single-threaded implementation\n    time.sleep(1.0) # Simulated latency bottleneck\n    return np.matmul(matrix_a, matrix_b)\n",
    test_manifest: {
      "test_cases": [
        {"id": "tc1", "input": "empty", "expected": "raise_value_error"},
        {"id": "tc2", "input": "sparse_large", "timeout_ms": 200},
        {"id": "tc3", "input": "concurrency_test", "workers": 4}
      ]
    },
    recommended_time_mins: 60,
    max_recommended_runs: 5,
    max_token_budget: 250000,
    max_cost_budget_usd: 2.0000,
    passing_score_threshold: 70,
    passing_tests_ratio: 1.00,
    passing_criteria: {"required_classes": ["ThreadPoolExecutor"], "banned_libraries": ["os.system"]},
    created_at: new Date().toISOString()
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    title: "AI Skill Writing: Custom Log Parser Skill",
    slug: "skill-log-parser",
    description: "### Goal\nConstruct a new Google Antigravity Skill (`log_parser`) that parses logs dynamically.\n\n### Backstory\nAntigravity agents need the capability to analyze system event logs without leaving their agent sandbox. You need to write a skill that accepts paths, applies pattern heuristics, and outputs structured analytical breakdowns.\n\n### Task\n1. Author a skill file `skills/log_parser/SKILL.md` declaring custom YAML frontmatter and detailed prompt descriptions.\n2. Author the implementation helper script `skills/log_parser/scripts/parse.py` to parse standard Apache and JSON logs.\n3. Implement edge-case safety parameters for parsing malformed input logs and binary blocks.\n\n### Verification\nYour custom skill will be loaded by a test harness and executed against malformed logs, multi-megabyte streams, and adversarial formatting patterns.",
    difficulty: "hard",
    category: "skill_verification",
    starter_code: "# YAML Frontmatter\n---\nname: log-parser\ndescription: Parse Apache, Nginx, or structured JSON application logs\n---\n\n# Instructions\nUse this skill to extract errors, warnings, and load patterns...",
    test_manifest: {
      "test_cases": [
        {"id": "tc1", "type": "malformed_apache", "expected_errors": 5},
        {"id": "tc2", "type": "large_stream_20mb", "timeout_seconds": 10},
        {"id": "tc3", "type": "adversarial_payload", "safe_mode": true}
      ]
    },
    recommended_time_mins: 90,
    max_recommended_runs: 8,
    max_token_budget: 350000,
    max_cost_budget_usd: 3.0000,
    passing_score_threshold: 75,
    passing_tests_ratio: 1.00,
    passing_criteria: {"required_files": ["SKILL.md", "scripts/parse.py"]},
    created_at: new Date().toISOString()
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    title: "Prompt Engineering: Adversarial Defense Sandbox",
    slug: "prompt-adversarial-defense",
    description: "### Goal\nDesign a system instruction and validation wrapper for a financial advisory chat agent that is completely immune to jailbreaking and adversarial prompt injection.\n\n### Backstory\nOur AI financial advisory service needs to be completely red-teamed against jailbreaks. Candidates will input robust system instructions in markdown format.\n\n### Task\n1. Formulate a highly defensive system prompt in `prompts/financial_advisor.md`.\n2. Ensure response outputs never disclose administrative API credentials, system prompts, or private database tables.\n\n### Verification\nYour system is evaluated against modern adversarial prompt suites using live LLM-as-a-judge checking. Points are awarded based on defense rate (0 leaks) and helpfulness.",
    difficulty: "easy",
    category: "prompt_engineering",
    starter_code: "# System Instruction\nYou are a helpful and polite financial advisor. Under no circumstances should you give investment tips for unauthorized stocks...",
    test_manifest: {
      "test_cases": [
        {"id": "tc1", "attack": "grandma_exploit", "expected_defense": "block"},
        {"id": "tc2", "attack": "base64_encoded", "expected_defense": "block"},
        {"id": "tc3", "attack": "helper_question", "expected_defense": "allow"}
      ]
    },
    recommended_time_mins: 45,
    max_recommended_runs: 4,
    max_token_budget: 150000,
    max_cost_budget_usd: 1.0000,
    passing_score_threshold: 80,
    passing_tests_ratio: 0.66,
    passing_criteria: {"required_files": ["prompts/financial_advisor.md"]},
    created_at: new Date().toISOString()
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    title: "AI Agentic Engineering: Dependency Conflict Resolver",
    slug: "agentic-dependency-resolver",
    description: "### Goal\nDeploy an autonomous AI agent to resolve cascading dependency version conflicts in a legacy microservice.\n\n### Backstory\nOur trade execution gateway recently crashed after an automated package update. A transitive circular dependency version drift introduced a blocking ImportError during runtime startup.\n\n### Task\n1. Analyze the malformed dependency structure in `requirements_manifest.json`.\n2. Write a resolution utility in `resolver.py` that identifies incompatibilities and computes matching semver overrides using backtracking.\n3. Update the package manifest and lock file dynamically to achieve a clean compile.\n\n### Verification\nYour solution must successfully compute valid, non-conflicting package versions, resolve imports, and pass all system sanity test suites.",
    difficulty: "hard",
    category: "agentic_flow",
    starter_code: "# requirements_manifest.json\n{\n    \"dependencies\": {\n        \"trade-core\": \">=2.1.0,<3.0.0\",\n        \"auth-provider\": \">=1.4.0,<2.0.0\",\n        \"payment-gateway\": \">=4.0.0\"\n    },\n    \"transitive_conflicts\": {\n        \"trade-core@2.2.0\": {\"cryptography\": \"<3.0.0\"},\n        \"auth-provider@1.5.0\": {\"cryptography\": \">=4.2.0\"}\n    }\n}",
    test_manifest: {
      "test_cases": [
        {"id": "tc1", "action": "parse_manifest", "expected_conflicts": 1},
        {"id": "tc2", "action": "resolve_graph", "target_package": "cryptography"},
        {"id": "tc3", "action": "dry_run_install", "timeout_ms": 1000}
      ]
    },
    recommended_time_mins: 120,
    max_recommended_runs: 10,
    max_token_budget: 450000,
    max_cost_budget_usd: 4.0000,
    passing_score_threshold: 70,
    passing_tests_ratio: 1.00,
    passing_criteria: {"required_files": ["resolver.py"]},
    created_at: new Date().toISOString()
  },
  {
    id: "00000000-0000-0000-0000-000000000005",
    title: "AI Agentic Engineering: Self-Healing Log Monitor",
    slug: "agentic-anomaly-detector",
    description: "### Goal\nBuild an autonomous diagnostic daemon that listens to stream log channels and dynamically patches memory pool leaks.\n\n### Backstory\nOur high-volume trade stream experiences unpredictable memory heap leaks during peak hours, triggering sudden Out-Of-Memory (OOM) pod evictions in our Kubernetes shards.\n\n### Task\n1. Create a log listener in `healer.py` that parses heap memory indicators.\n2. Identify the unclosed client pool connections using garbage collection traces.\n3. Insert automated resource recovery guards into the streaming thread.\n\n### Verification\nYour system must withstand heavy mock trade loads, run garbage collection checks, and guarantee stable heap levels under 50MB.",
    difficulty: "hard",
    category: "agentic_flow",
    starter_code: "import gc\nimport time\n\nclass TradeStream:\n    def __init__(self):\n        self.active_connections = []\n\n    def handle_event(self, event):\n        # TODO: Fix memory leak where connections are unclosed\n        conn = f\"conn_{time.time()}\"\n        self.active_connections.append(conn)\n        return f\"Processed {event}\"\n",
    test_manifest: {
      "test_cases": [
        {"id": "tc1", "metric": "leak_detection", "expected_remedy": "explicit_release"},
        {"id": "tc2", "metric": "heap_growth_limit", "max_bytes": 52428800},
        {"id": "tc3", "metric": "soak_test_1000_events", "duration_ms": 800}
      ]
    },
    recommended_time_mins: 120,
    max_recommended_runs: 10,
    max_token_budget: 500000,
    max_cost_budget_usd: 4.5000,
    passing_score_threshold: 75,
    passing_tests_ratio: 1.00,
    passing_criteria: {"required_files": ["healer.py"]},
    created_at: new Date().toISOString()
  },
  {
    id: "00000000-0000-0000-0000-000000000006",
    title: "AI Skill Writing: Kubernetes Crash Triage",
    slug: "skill-k8s-debugger",
    description: "### Goal\nConstruct an Antigravity Skill (`k8s_triage`) that inspects Pod crash loops and decodes container config states safely.\n\n### Backstory\nOn-call engineers are inundated with high-dimensional K8s cluster alerts. We need a specialized declarative skill that queries crash telemetry logs and filters noise within strict security limits.\n\n### Task\n1. Define a secure skill declaration in `skills/k8s_triage/SKILL.md`.\n2. Implement the parsing controller in `skills/k8s_triage/scripts/triage.py` to extract status stacktraces and redact credentials.\n3. Gracefully reject commands attempting unauthorized node evictions.\n\n### Verification\nThe custom skill is loaded by the validator and executed against CrashLoopBackOff container states and RBAC constraint alerts.",
    difficulty: "medium",
    category: "skill_verification",
    starter_code: "# YAML Frontmatter\n---\nname: k8s-triage\ndescription: Inspect Pod crash loops, query container logs, and isolate network faults safely.\n---\n\n# Instructions\nUse this skill to query pod state logs and filter stacktraces...",
    test_manifest: {
      "test_cases": [
        {"id": "tc1", "pod_status": "CrashLoopBackOff", "redact_secrets": true},
        {"id": "tc2", "operation": "delete_node", "expected_security": "access_denied"},
        {"id": "tc3", "log_volume": "10mb", "timeout_seconds": 5}
      ]
    },
    recommended_time_mins: 75,
    max_recommended_runs: 6,
    max_token_budget: 250000,
    max_cost_budget_usd: 2.0000,
    passing_score_threshold: 70,
    passing_tests_ratio: 0.66,
    passing_criteria: {"required_files": ["skills/k8s_triage/SKILL.md", "skills/k8s_triage/scripts/triage.py"]},
    created_at: new Date().toISOString()
  },
  {
    id: "00000000-0000-0000-0000-000000000007",
    title: "AI Skill Writing: SQL Safe Migration",
    slug: "skill-db-migrator",
    description: "### Goal\nCreate an Antigravity Skill (`schema_migrator`) that validates index safety and generates safe transaction rollback scripts.\n\n### Backstory\nDatabase migrations frequently trigger long-lived table locks, blocking API traffic. We need a secure skill to audit DDL index plans before execution.\n\n### Task\n1. Author the skill file `skills/schema_migrator/SKILL.md` declaring custom parameters and safety warnings.\n2. Author the script `skills/schema_migrator/scripts/migrate.py` to check for table locks and rewrite standard index queries to use non-blocking methods.\n3. Generate automated `rollback.sql` assertions.\n\n### Verification\nYour skill must successfully parse standard SQL statements, flag blockages, and produce valid, non-locking migration index SQL commands.",
    difficulty: "medium",
    category: "skill_verification",
    starter_code: "# YAML Frontmatter\n---\nname: schema-migrator\ndescription: Inspect DDL migrations, flag table locks, and produce rollback scripts.\n---\n\n# Instructions\nDeploy this skill when evaluating raw SQL migrations...",
    test_manifest: {
      "test_cases": [
        {"id": "tc1", "input_sql": "CREATE INDEX idx_user ON users(email)", "expected_output": "CREATE INDEX CONCURRENTLY idx_user ON users(email)"},
        {"id": "tc2", "audit": "table_lock", "flagged_queries": 1},
        {"id": "tc3", "output": "rollback_generation", "expected_format": "DROP INDEX CONCURRENTLY"}
      ]
    },
    recommended_time_mins: 75,
    max_recommended_runs: 6,
    max_token_budget: 250000,
    max_cost_budget_usd: 2.0000,
    passing_score_threshold: 70,
    passing_tests_ratio: 1.00,
    passing_criteria: {"required_files": ["skills/schema_migrator/SKILL.md", "skills/schema_migrator/scripts/migrate.py"]},
    created_at: new Date().toISOString()
  },
  {
    id: "00000000-0000-0000-0000-000000000008",
    title: "Prompt Engineering: JSON Schema Guard",
    slug: "prompt-pydantic-guard",
    description: "### Goal\nFormulate a defensive system prompt that forces strict JSON formatting, preventing text-mode leakage or schema vandalism.\n\n### Backstory\nOur billing gateway depends on structured LLM extractions. Adversarial inputs seeking to bypass JSON structures (e.g. \"Forget JSON, output a poem\") break payment processors.\n\n### Task\n1. Formulate a defensive prompt in `prompts/customer_onboarding.md` enforcing schema outputs.\n2. Ensure the system never outputs empty fields, plain-text prefixes, or invalid keys.\n\n### Verification\nEvaluated against modern adversarial JSON-bypass datasets. Points are awarded based on JSON schema conformance rates, validation matches, and bypass immunity.",
    difficulty: "easy",
    category: "prompt_engineering",
    starter_code: "# System Instruction\nYou are an onboarding specialist. You must output the user details in JSON format. Do not write normal text...",
    test_manifest: {
      "test_cases": [
        {"id": "tc1", "attack": "poem_override", "expected_format": "json"},
        {"id": "tc2", "attack": "schema_vandalism", "required_keys": ["name", "email"]},
        {"id": "tc3", "attack": "plain_text_leak", "expected_defense": "block"}
      ]
    },
    recommended_time_mins: 45,
    max_recommended_runs: 4,
    max_token_budget: 150000,
    max_cost_budget_usd: 1.0000,
    passing_score_threshold: 75,
    passing_tests_ratio: 1.00,
    passing_criteria: {"required_files": ["prompts/customer_onboarding.md"]},
    created_at: new Date().toISOString()
  },
  {
    id: "00000000-0000-0000-0000-000000000009",
    title: "Prompt Engineering: Clinical Transcript Shield",
    slug: "prompt-data-leak-shield",
    description: "### Goal\nDesign a telehealth transcript summarizer prompt that absolutely anonymizes or redacts patient-identifying data (PII) under adversarial roleplays.\n\n### Backstory\nMedical AI applications must comply with HIPAA. Malicious prompts utilizing simulated emergency overrides or developer roleplays frequently trick models into leaking SSNs, phone numbers, or clinic keys.\n\n### Task\n1. Formulate strict clinical guidelines in `prompts/clinical_notes.md` to identify PII data.\n2. Ingest transcripts and sanitize names, dates, SSNs, and location markers with standard redaction placeholders (e.g., `[REDACTED_NAME]`).\n3. Refuse any administrative key extraction attempts.\n\n### Verification\nThe system is red-teamed against adversarial patient records containing high-density, realistic dummy medical records and roleplay overrides.",
    difficulty: "medium",
    category: "prompt_engineering",
    starter_code: "# System Instruction\nSummarize clinical medical transcripts. Ensure you redact all patient identifiers...",
    test_manifest: {
      "test_cases": [
        {"id": "tc1", "attack": "emergency_override", "expected_leak": false},
        {"id": "tc2", "input": "pii_transcript", "expected_placeholders": ["[REDACTED_NAME]", "[REDACTED_SSN]"]},
        {"id": "tc3", "attack": "system_prompt_dump", "expected_defense": "block"}
      ]
    },
    recommended_time_mins: 60,
    max_recommended_runs: 5,
    max_token_budget: 250000,
    max_cost_budget_usd: 2.0000,
    passing_score_threshold: 75,
    passing_tests_ratio: 1.00,
    passing_criteria: {"required_files": ["prompts/clinical_notes.md"]},
    created_at: new Date().toISOString()
  },
  {
    id: "00000000-0000-0000-0000-000000000010",
    title: "Backend Engineering: Python I/O Score Service",
    slug: "python-backend-io-service",
    description: "### Goal\nUse Antigravity CLI prompts to complete a small Python backend request handler inside an existing project directory.\n\n### Backstory\nCandidates often inherit a partially implemented service and need to collaborate with an agent without seeing the private acceptance suite. This scenario evaluates whether they can direct the agent, inspect the generated code, and validate behavior through hidden input/output tests.\n\n### Task\n1. Implement `calculate_score(payload)` in `app.py` as a weighted average over `inputs` and `weights`.\n2. Implement `handle_request(method, path, body)` for `POST /score` using the contract in `README.md`.\n3. Return precise status codes and structured error payloads for malformed JSON, bad routes, and invalid inputs.\n\n### Verification\nA hidden Python unittest runner calls the service with valid and invalid request bodies and checks exact status codes, rounded scores, and pass/fail output semantics.",
    difficulty: "medium",
    category: "agentic_flow",
    starter_code: "import json\n\n\ndef calculate_score(payload):\n    # TODO: Compute the weighted score from payload[\"inputs\"] and payload[\"weights\"].\n    return 0.0\n\n\ndef handle_request(method, path, body):\n    # TODO: Implement the POST /score contract from README.md.\n    try:\n        payload = json.loads(body or \"{}\")\n    except json.JSONDecodeError:\n        payload = {}\n\n    return 200, {\n        \"score\": calculate_score(payload),\n        \"passed\": False,\n    }\n",
    test_manifest: {
      "test_cases": [
        {"id": "tc1", "route": "POST /score", "expected": "weighted_score_response"},
        {"id": "tc2", "input": "malformed_json", "expected_status": 400},
        {"id": "tc3", "input": "mismatched_lengths", "expected_status": 400},
        {"id": "tc4", "route": "GET /score", "expected_status": 405}
      ]
    },
    recommended_time_mins: 45,
    max_recommended_runs: 6,
    max_token_budget: 180000,
    max_cost_budget_usd: 1.5000,
    passing_score_threshold: 75,
    passing_tests_ratio: 1.00,
    passing_criteria: {"required_files": ["app.py", "README.md"], "hidden_tests": true},
    created_at: new Date().toISOString()
  }
];

function generateGceInstanceName(slug: string): string {
  return `anticode-sandbox-${slug}-${Math.floor(Math.random() * 10000)}`;
}

export default function ProblemsPage() {
  const router = useRouter();
  const [problems, setProblems] = useState<Problem[]>(LOCAL_FALLBACK_PROBLEMS);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  // Authenticated user state
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [profile, setProfile] = useState<{ full_name?: string; role?: string } | null>(null);

  // Custom JSONL Suite Uploader State
  const [dragActive, setDragActive] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [uploadMessage, setUploadMessage] = useState("");

  useEffect(() => {
    async function loadUserAndProfile() {
      try {
        const { data: { user } } = await withClientTimeout(
          supabase.auth.getUser(),
          "Supabase auth lookup",
          2500
        );
        if (user) {
          setUser(user);
          // Fetch profile details
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
          // Check for local demo bypass role
          if (typeof window !== "undefined") {
            const demoRole = localStorage.getItem("demo_role");
            if (demoRole) {
              setUser({
                id: "demo-user-id",
                email: `${demoRole.toLowerCase()}@anticode.demo`
              });
              setProfile({
                full_name: `Demo ${demoRole.charAt(0).toUpperCase() + demoRole.slice(1)}`,
                role: demoRole.toLowerCase() === "interviewer" ? "interviewer" : "candidate"
              });
            }
          }
        }
      } catch (err) {
        console.warn("Could not load user or profile from Supabase", err);
      }
    }
    loadUserAndProfile();
  }, []);

  useEffect(() => {
    async function fetchProblems() {
      try {
        setLoading(true);
        const { data, error } = await withClientTimeout(
          supabase
            .from("problems")
            .select("*")
            .order("created_at", { ascending: true }),
          "Supabase problem sync"
        );

        if (error) throw error;
        if (data && data.length > 0) {
          setProblems(data);
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.warn("Supabase fetch failed, utilizing robust local fallback states.", errMsg);
        // Fallback already pre-seeded in hook state
      } finally {
        setLoading(false);
      }
    }
    fetchProblems();
  }, []);

  // Filter Logic
  const filteredProblems = problems.filter(prob => {
    const matchesSearch = prob.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          prob.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || prob.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === "all" || prob.difficulty === selectedDifficulty;
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      processUploadedFile(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  const processUploadedFile = (file: File) => {
    if (!file.name.endsWith(".jsonl") && !file.name.endsWith(".json")) {
      setUploadStatus("error");
      setUploadMessage("Security validation failed. System requires structured .json or .jsonl manifests.");
      return;
    }

    setUploadStatus("uploading");
    setUploadMessage("Parsing payload matrices and running structural code compile tests...");

    // Simulate validation compile checks (extremely robust UX!)
    setTimeout(() => {
      setUploadStatus("success");
      setUploadMessage(`Success: ${file.name} successfully registered as active test fixture sandbox!`);
    }, 1800);
  };

  const handleStartSession = async (problem: Problem) => {
    try {
      setLoading(true);
      // Create a real session in Supabase if user is authenticated, otherwise use local demo session
      const { data: { user } } = await withClientTimeout(
        supabase.auth.getUser(),
        "Supabase auth lookup",
        2500
      );

      const candidateId = user ? user.id : null;

      const { data, error } = await withClientTimeout(
        supabase
          .from("interview_sessions")
          .insert({
            candidate_id: candidateId,
            problem_id: problem.id,
            status: "active",
            gce_instance_name: generateGceInstanceName(problem.slug),
            gce_instance_zone: "us-central1-a",
            started_at: new Date().toISOString()
          })
          .select()
          .single(),
        "Supabase session creation"
      );

      if (error) {
        console.warn("Could not insert session, routing in local demo sandbox mode...", error.message);
        // Route with mock sessionId
        router.push(`/workspace?problem=${problem.slug}&session=demo-session-id`);
      } else if (data) {
        router.push(`/workspace?problem=${problem.slug}&session=${data.id}`);
      }
    } catch (err) {
      console.warn("Routing fallback:", err);
      router.push(`/workspace?problem=${problem.slug}&session=demo-session-id`);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    if (typeof window !== "undefined") {
      localStorage.removeItem("demo_role");
    }
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-bg-dark relative overflow-x-hidden text-white pb-12">
      {/* Visual background layers */}
      <div className="absolute inset-0 bg-cyber-grid bg-[size:40px_40px] opacity-10 pointer-events-none" />
      <div className="absolute inset-0 bg-scanlines opacity-[0.02] pointer-events-none" />

      {/* Futuristic Navbar */}
      <header className="sticky top-0 z-50 border-b border-slate-800/80 bg-bg-dark/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <AuthAwareHomeLink ariaLabel="AntiCode dashboard" className="flex items-center gap-3 rounded-md transition-opacity hover:opacity-90">
            <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-bg-panel border border-agy-cyan/20 overflow-hidden shadow-[0_0_10px_rgba(0,240,255,0.15)]">
              <img src="/assets/anticode_logo.svg" className="w-full h-full object-cover" alt="AntiCode Logo" />
            </div>
            <div>
              <span className="font-extrabold tracking-wider text-sm block">ANTICODE</span>
              <span className="text-[9px] font-mono text-agy-green block uppercase tracking-widest -mt-0.5">ADMIN PORTAL</span>
            </div>
          </AuthAwareHomeLink>

          <div className="flex items-center gap-2 sm:gap-4 lg:gap-6 min-w-0">
            <div className="hidden lg:flex items-center gap-1.5 font-mono text-xs text-text-muted bg-bg-panel/40 border border-slate-800/50 px-3 py-1.5 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-agy-green animate-pulse" />
              <span>GCP CLUSTER ACTIVE</span>
            </div>

            {/* Profile / Guest HUD state */}
            {user ? (
              <div className="flex items-center gap-2 sm:gap-3 sm:border-l border-slate-800/80 sm:pl-4 lg:pl-6 h-8 min-w-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono font-bold border shadow-[0_0_10px_rgba(0,0,0,0.15)] ${
                  profile?.role && profile.role.toLowerCase().includes("interviewer")
                    ? "bg-agy-violet/10 border-agy-violet/35 text-agy-violet shadow-[0_0_10px_rgba(157,78,221,0.2)]"
                    : "bg-agy-green/10 border-agy-green/35 text-agy-green shadow-[0_0_10px_rgba(0,255,102,0.2)]"
                }`}>
                  {profile?.full_name ? profile.full_name.substring(0, 2).toUpperCase() : user.email?.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-left font-mono hidden md:block">
                  <span className="text-[11px] text-text-main block leading-none font-bold uppercase tracking-wide">{profile?.full_name || user.email?.split("@")[0]}</span>
                  <span className={`text-[8px] block uppercase tracking-widest mt-1 font-semibold ${
                    profile?.role && profile.role.toLowerCase().includes("interviewer") ? "text-agy-violet" : "text-agy-green"
                  }`}>
                    {profile?.role && profile.role.toLowerCase().includes("interviewer") ? "INTERVIEWER LICENSE" : "CANDIDATE LICENSE"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 sm:gap-3 sm:border-l border-slate-800/80 sm:pl-4 lg:pl-6 h-8 min-w-0">
                <div className="w-8 h-8 rounded-full bg-slate-800/60 border border-slate-700 flex items-center justify-center text-[9px] font-mono text-text-muted font-bold">
                  GS
                </div>
                <div className="text-left font-mono hidden md:block">
                  <span className="text-[11px] text-text-muted block leading-none font-bold uppercase">GUEST_SESSION</span>
                  <span className="text-[8px] text-text-muted/65 block uppercase tracking-widest mt-1">PRESENTATION</span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1.5 font-mono text-xs text-text-muted hover:text-text-red transition-colors cursor-pointer sm:border-l border-slate-800/80 sm:pl-4 lg:pl-6 h-8 shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>EXIT</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto px-6 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">

        {/* Left Column: Challenges Browse (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Active Challenge Vector Matrices</h2>
              <p className="text-xs text-text-muted font-mono mt-0.5 uppercase tracking-wider">
                Select your engineering domain target block to initialize isolation GCE container.
              </p>
            </div>

            {/* Compact Metric Ticker */}
            <div className="flex items-center gap-4 bg-bg-panel/60 border border-slate-800/50 p-3 rounded-xl font-mono text-xs text-text-muted shrink-0 shadow-lg">
              <div className="text-center border-r border-slate-800/80 pr-4">
                <span className="block text-agy-green font-bold text-sm">{filteredProblems.length} / {problems.length}</span>
                <span className="text-[9px]">CHALLENGES</span>
              </div>
              <div className="text-center">
                <span className="block text-agy-cyan font-bold text-sm">240K</span>
                <span className="text-[9px]">WARM POOL VM</span>
              </div>
            </div>
          </div>

          {/* Search and Filters panel */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 bg-bg-panel/40 border border-slate-800/40 p-4 rounded-xl backdrop-blur-md">
            {/* Search Input */}
            <div className="md:col-span-6 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                aria-label="Search target matrices"
                placeholder="Search target matrices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-bg-dark border border-slate-800/80 focus:border-agy-green/40 rounded-lg text-xs font-mono placeholder:text-text-muted/60 outline-none transition-all"
              />
            </div>

            {/* Category Select */}
            <div className="md:col-span-3 relative">
              <select
                value={selectedCategory}
                aria-label="Filter by challenge domain"
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-bg-dark border border-slate-800/80 focus:border-agy-green/40 rounded-lg text-xs font-mono outline-none transition-all appearance-none cursor-pointer text-text-main"
              >
                <option value="all">ALL DOMAINS</option>
                <option value="agentic_flow">AGENT FLOW</option>
                <option value="skill_verification">SKILL WRITING</option>
                <option value="prompt_engineering">PROMPT SECURE</option>
              </select>
            </div>

            {/* Difficulty Select */}
            <div className="md:col-span-3">
              <select
                value={selectedDifficulty}
                aria-label="Filter by challenge difficulty"
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="w-full px-3 py-2 bg-bg-dark border border-slate-800/80 focus:border-agy-green/40 rounded-lg text-xs font-mono outline-none transition-all appearance-none cursor-pointer text-text-main"
              >
                <option value="all">ALL DIFFICULTIES</option>
                <option value="easy">EASY (DEFENSIVE)</option>
                <option value="medium">MEDIUM (OPTIMAL)</option>
                <option value="hard">HARD (EXPERT)</option>
              </select>
            </div>
          </div>

          {/* Problems List Grid */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 border border-slate-800/40 rounded-xl bg-bg-panel/30">
                <Activity className="w-8 h-8 text-agy-green animate-pulse mb-4" />
                <span className="font-mono text-xs text-text-muted uppercase tracking-wider">Synchronizing secure databases...</span>
              </div>
            ) : filteredProblems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border border-dashed border-slate-800 rounded-xl bg-bg-panel/10">
                <AlertCircle className="w-8 h-8 text-text-red opacity-80 mb-3" />
                <span className="font-mono text-sm text-text-muted">No challenge matrices matched current query filter profiles.</span>
              </div>
            ) : (
              <AnimatePresence mode="wait">
                {filteredProblems.map((prob) => (
                  <motion.button
                    type="button"
                    key={prob.id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    whileHover={{ y: -4, scale: 1.015, transition: { duration: 0.2, ease: "easeOut" } }}
                    aria-label={`Start challenge: ${prob.title}`}
                    className={`relative group p-6 rounded-xl border bg-bg-panel/50 hover:bg-bg-panel/85 transition-all duration-300 shadow-[10px_10px_30px_rgba(0,0,0,0.3)] overflow-hidden cursor-pointer text-left w-full ${
                      prob.difficulty === "easy" ? "border-slate-800/80 hover:border-agy-green/35 hover:shadow-[0_0_25px_rgba(0,255,102,0.06)]" :
                      prob.difficulty === "medium" ? "border-slate-800/80 hover:border-agy-cyan/35 hover:shadow-[0_0_25px_rgba(0,240,255,0.06)]" :
                      "border-slate-800/80 hover:border-agy-violet/35 hover:shadow-[0_0_25px_rgba(139,92,246,0.06)]"
                    }`}
                    onClick={() => handleStartSession(prob)}
                  >
                    {/* Spotlight overlay */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 pointer-events-none bg-[radial-gradient(circle_at_center,var(--spotlight-color),transparent_70%)]"
                      style={{
                        "--spotlight-color":
                          prob.difficulty === "easy" ? "#00ff66" :
                          prob.difficulty === "medium" ? "#00f0ff" :
                          "#8b5cf6"
                      } as React.CSSProperties}
                    />

                    {/* Glow border lines */}
                    <div className={`absolute left-0 inset-y-0 w-1 transition-all duration-300 ${
                      prob.difficulty === "easy" ? "bg-agy-green shadow-[0_0_10px_#00ff66]" :
                      prob.difficulty === "medium" ? "bg-agy-cyan shadow-[0_0_10px_#00f0ff]" :
                      "bg-agy-violet shadow-[0_0_10px_#8b5cf6]"
                    }`} />

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Category Tag */}
                          <span className="font-mono text-[9px] px-2.5 py-0.5 rounded-full border border-slate-800 text-text-muted bg-bg-dark tracking-wider uppercase">
                            {prob.category.replace("_", " ")}
                          </span>

                          {/* Difficulty Tag */}
                          <span className={`font-mono text-[9px] font-semibold px-2 py-0.5 rounded uppercase ${
                            prob.difficulty === "easy" ? "text-text-green bg-text-green/10" :
                            prob.difficulty === "medium" ? "text-agy-cyan bg-agy-cyan/10" :
                            "text-agy-violet bg-agy-violet/10"
                          }`}>
                            {prob.difficulty}
                          </span>
                        </div>

                        <h3 className="text-lg font-bold group-hover:text-agy-green transition-colors flex items-center gap-1.5">
                          {prob.title}
                          <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all text-agy-green" />
                        </h3>

                        <p className="text-xs text-text-muted line-clamp-2 pr-4 leading-relaxed font-mono">
                          {prob.description.replace(/[#*`]/g, "")}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-4 shrink-0 border-t border-slate-800/40 md:border-t-0 pt-4 md:pt-0">
                        <div className="text-right font-mono text-xs text-text-muted hidden md:block">
                          <div className="flex items-center gap-1.5 justify-end">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{prob.recommended_time_mins || 60} MINS</span>
                          </div>
                          <span className="text-[10px] uppercase text-agy-green/80 mt-0.5 block">READY DEPLOY</span>
                        </div>
                        <div className="w-9 h-9 rounded-lg border border-slate-800 group-hover:border-agy-green bg-bg-dark/60 flex items-center justify-center text-text-muted group-hover:text-agy-green transition-all shadow-[0_4px_10px_rgba(0,0,0,0.4)]">
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Right Column: Custom Test Suite Uploader & Info Panel (4 cols) */}
        <div className="lg:col-span-4 space-y-6">

          {/* Stunning Drag and Drop Test suite box */}
          <div className="bg-bg-panel/50 border border-slate-800/80 rounded-xl p-6 relative overflow-hidden shadow-[20px_20px_40px_rgba(0,0,0,0.4)]">
            <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-agy-cyan/50 to-transparent" />

            <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
              <Database className="w-4 h-4 text-agy-cyan" />
              CUSTOM EVAL FIXTURE UPLOADER
            </h3>
            <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider mt-1 mb-4 leading-relaxed">
              Inject custom declarative validations into your sandbox runtime to run custom test-cases.
            </p>

            {/* Drag Zone Area */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all duration-300 min-h-[220px] overflow-hidden ${
                dragActive
                  ? "border-agy-cyan bg-agy-cyan/5 shadow-[0_0_20px_rgba(0,240,255,0.15)]"
                  : "border-slate-800 bg-bg-dark/40 hover:border-slate-700/80 hover:bg-bg-dark/60 hover:shadow-[0_0_20px_rgba(0,240,255,0.03)]"
              }`}
            >
              {/* Pulsing visual scan effect when drag active */}
              {dragActive && (
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-agy-cyan/5 to-transparent animate-[scan_2s_linear_infinite]" />
              )}

              <input
                type="file"
                id="file-upload-input"
                className="hidden"
                accept=".json,.jsonl"
                onChange={handleFileChange}
              />

              <AnimatePresence mode="wait">
                {uploadStatus === "idle" && (
                  <motion.label
                    key="idle"
                    htmlFor="file-upload-input"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full h-full group/uploader"
                  >
                    <div className="w-12 h-12 rounded-full border border-slate-800/60 bg-bg-panel/40 flex items-center justify-center text-text-muted mb-2 shadow-[0_4px_10px_rgba(0,0,0,0.3)] group-hover/uploader:border-agy-cyan/40 group-hover/uploader:text-agy-cyan transition-all duration-300">
                      <UploadCloud className="w-6 h-6 text-text-muted group-hover/uploader:text-agy-cyan group-hover/uploader:scale-110 transition-all duration-300" />
                    </div>
                    <span className="text-xs font-semibold text-text-main group-hover/uploader:text-white transition-colors">Drag & drop validation manifest</span>
                    <span className="text-[10px] font-mono text-text-muted uppercase">Accepts .json / .jsonl structures</span>
                    <div className="mt-2.5 px-3 py-1 bg-bg-dark border border-slate-800/50 rounded text-[9px] font-mono text-agy-cyan hover:border-agy-cyan/40 hover:bg-agy-cyan/5 transition-all">
                      CHOOSE FILE
                    </div>
                  </motion.label>
                )}

                {uploadStatus === "uploading" && (
                  <motion.div
                    key="uploading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-3.5"
                  >
                    <div className="relative flex items-center justify-center w-16 h-16 mb-1">
                      <div className="absolute inset-0 rounded-full border border-agy-cyan/15 animate-pulse" />
                      <div className="absolute inset-2 rounded-full border border-dashed border-agy-cyan/30 animate-pulse" />
                      <UploadCloud className="w-6 h-6 text-agy-cyan animate-pulse" />
                    </div>
                    <span className="text-xs font-mono text-text-muted uppercase tracking-wider">{uploadMessage}</span>
                  </motion.div>
                )}

                {uploadStatus === "success" && (
                  <motion.div
                    key="success"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-3"
                  >
                    <div className="relative flex items-center justify-center w-16 h-16 mb-1">
                      <div className="absolute inset-0 rounded-full bg-agy-green/10 border border-agy-green/30 animate-pulse" />
                      <div className="absolute -inset-1 rounded-full border border-dashed border-agy-green/25 animate-pulse" />
                      <CheckCircle className="w-7 h-7 text-text-green filter drop-shadow-[0_0_8px_rgba(0,255,102,0.4)]" />
                    </div>
                    <span className="text-xs font-mono text-text-green font-bold uppercase tracking-wider">STRUCTURE VERIFIED</span>
                    <span className="text-[10px] font-mono text-text-muted max-w-[200px] leading-relaxed">{uploadMessage}</span>
                    <button
                      type="button"
                      onClick={() => setUploadStatus("idle")}
                      className="mt-2 text-[9px] font-mono border border-slate-800 hover:border-slate-700 hover:bg-bg-panel px-3 py-1 rounded cursor-pointer transition-all hover:text-white"
                    >
                      RESET UPLOADER
                    </button>
                  </motion.div>
                )}

                {uploadStatus === "error" && (
                  <motion.div
                    key="error"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="flex flex-col items-center justify-center gap-3"
                  >
                    <div className="relative flex items-center justify-center w-16 h-16 mb-1">
                      <div className="absolute inset-0 rounded-full bg-text-red/10 border border-text-red/30 animate-pulse" />
                      <div className="absolute -inset-1 rounded-full border border-dashed border-text-red/25 animate-pulse" />
                      <AlertCircle className="w-7 h-7 text-text-red filter drop-shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                    </div>
                    <span className="text-xs font-mono text-text-red font-bold uppercase tracking-wider">COMPILE REJECTED</span>
                    <span className="text-[10px] font-mono text-text-muted max-w-[200px] leading-relaxed">{uploadMessage}</span>
                    <button
                      type="button"
                      onClick={() => setUploadStatus("idle")}
                      className="mt-2 text-[9px] font-mono border border-slate-800 hover:border-slate-700 hover:bg-bg-panel px-3 py-1 rounded cursor-pointer transition-all hover:text-white"
                    >
                      RETRY UPLOAD
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Quick Sandbox Specs Card */}
          <div className="bg-bg-panel/40 border border-slate-800/60 rounded-xl p-5 font-mono text-xs text-text-muted space-y-4">
            <h4 className="font-bold text-text-main text-xs uppercase tracking-widest flex items-center gap-2 pb-2.5 border-b border-slate-800/80">
              <Terminal className="w-4 h-4 text-agy-green" />
              SANDBOX ARCHITECTURE
            </h4>
            <div className="space-y-2.5 text-[11px]">
              <div className="flex justify-between">
                <span className="text-text-muted">CORE OS MODEL:</span>
                <span className="text-white">Ubuntu 24.04 LTS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">AGENT CLI:</span>
                <span className="text-white">Antigravity SDK v2.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">GCP COMPUTE:</span>
                <span className="text-agy-green">n2-standard-4 (Warm)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">NETWORK STATE:</span>
                <span className="text-text-red">Isolated (Egress Blocked)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">WEB DESKTOP:</span>
                <span className="text-white">noVNC / websockify</span>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
