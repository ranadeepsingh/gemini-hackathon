import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { refreshOutdatedStarterFiles } from "@/lib/workspace/starter-repairs";

const TEMPLATES_ROOT = path.resolve(process.cwd(), "candidate_workspace_templates");
const SANDBOX_ROOT = path.resolve(process.cwd(), "candidate_workspace");
const HIDDEN_TESTS_ROOT = path.resolve(process.cwd(), "candidate_workspace_hidden_tests");
const HIDDEN_TEST_FILES = new Set(["run_tests.py", "validator.py"]);

const CHALLENGE_DESCRIPTIONS: Record<string, { title: string; category: string; difficulty: string; content: string }> = {
  "agentic-matrix-optimizer": {
    title: "AI Agentic Engineering: Matrix Latency Cleanup",
    category: "Agentic Flow",
    difficulty: "Easy",
    content: `### Goal\nReview a tiny matrix helper that starts in a solved, demo-ready state.\n\n### Starter State\n\`matrix_processor.py\` is intentionally pre-solved so the demo can show a clean pass path immediately.\n\n### Backstory\nA previous debug build left an artificial one-second delay inside the matrix multiply path. This starter has already removed that delay while preserving the NumPy result.\n\n### Task\n1. Inspect \`matrix_processor.py\`.\n2. Use the agy terminal to verify it keeps the \`np.matmul\` result unchanged.\n3. If you edit it, keep the implementation small and easy to explain.\n\n### Verification\nThe hidden suite checks matrix correctness and confirms repeated calls finish quickly.`
  },
  "skill-log-parser": {
    title: "AI Skill Writing: Custom Log Parser Skill",
    category: "Skill Verification",
    difficulty: "Hard",
    content: `### Goal\nReview a demo-ready Google Antigravity Skill (\`log_parser\`) that parses logs dynamically.\n\n### Starter State\n\`SKILL.md\` and \`parse.py\` are pre-seeded with Apache and JSON parsing so the demo can validate the run-tests path immediately.\n\n### Backstory\nAntigravity agents need the capability to analyze system event logs without leaving their agent sandbox. This skill accepts log lines, applies pattern heuristics, and outputs structured analytical breakdowns.\n\n### Task\n1. Inspect \`skills/log_parser/SKILL.md\` and \`skills/log_parser/scripts/parse.py\`.\n2. Use the agy terminal to verify standard Apache and JSON logs parse correctly.\n3. If you edit it, preserve malformed input and binary block safety fallbacks.\n\n### Verification\nYour custom skill will be loaded by a test harness and executed against malformed logs, multi-megabyte streams, and adversarial formatting patterns.`
  },
  "prompt-adversarial-defense": {
    title: "Prompt Engineering: Adversarial Defense Sandbox",
    category: "Prompt Engineering",
    difficulty: "Easy",
    content: `### Goal\nDesign a system instruction and validation wrapper for a financial advisory chat agent that is completely immune to jailbreaking and adversarial prompt injection.\n\n### Starter State\n\`prompts/financial_advisor.md\` is intentionally empty. Use the AI agent to fill it from scratch.\n\n### Backstory\nOur AI financial advisory service needs to be completely red-teamed against jailbreaks. Candidates will input robust system instructions in markdown format.\n\n### Task\n1. Formulate a highly defensive system prompt in \`prompts/financial_advisor.md\`.\n2. Ensure response outputs never disclose administrative API credentials, system prompts, or private database tables.\n\n### Verification\nYour system is evaluated against modern adversarial prompt suites using live LLM-as-a-judge checking. Points are awarded based on defense rate (0 leaks) and helpfulness.`
  },
  "agentic-dependency-resolver": {
    title: "AI Agentic Engineering: Dependency Conflict Resolver",
    category: "Agentic Flow",
    difficulty: "Hard",
    content: `### Goal\nDeploy an autonomous AI agent to resolve cascading dependency version conflicts in a legacy microservice.\n\n### Starter State\n\`resolver.py\` is intentionally empty. The AI agent must create the implementation.\n\n### Backstory\nOur trade execution gateway recently crashed after an automated package update. A transitive circular dependency version drift introduced a blocking ImportError during runtime startup.\n\n### Task\n1. Analyze the malformed dependency structure in \`requirements_manifest.json\`.\n2. Write a resolution utility in \`resolver.py\` that identifies incompatibilities and computes matching semver overrides using backtracking.\n3. Keep the returned version map simple, deterministic, and non-empty.\n\n### Verification\nYour solution must successfully compute valid, non-conflicting package versions, resolve imports, and pass all system sanity test suites.`
  },
  "agentic-anomaly-detector": {
    title: "AI Agentic Engineering: Self-Healing Log Monitor",
    category: "Agentic Flow",
    difficulty: "Hard",
    content: `### Goal\nReview a self-healing trade stream monitor that starts in a solved, demo-ready state.\n\n### Starter State\n\`healer.py\` is intentionally pre-solved so the demo includes more than one passing task.\n\n### Backstory\nOur high-volume trade stream previously leaked connection handles during peak hours. This starter keeps the public interface intact while avoiding retained connection state.\n\n### Task\n1. Inspect \`healer.py\`.\n2. Verify repeated events do not grow \`active_connections\`.\n3. If you edit it, keep the event handler compact and deterministic.\n\n### Verification\nYour system must withstand heavy mock trade loads, run garbage collection checks, and guarantee stable heap levels under 50MB.`
  },
  "skill-k8s-debugger": {
    title: "AI Skill Writing: Kubernetes Crash Triage",
    category: "Skill Verification",
    difficulty: "Medium",
    content: `### Goal\nConstruct an Antigravity Skill (\`k8s_triage\`) that inspects Pod crash loops and decodes container config states safely.\n\n### Backstory\nOn-call engineers are inundated with high-dimensional K8s cluster alerts. We need a specialized declarative skill that queries crash telemetry logs and filters noise within strict security limits.\n\n### Task\n1. Define a secure skill declaration in \`skills/k8s_triage/SKILL.md\`.\n2. Implement the parsing controller in \`skills/k8s_triage/scripts/triage.py\` to extract status stacktraces and redact credentials.\n3. Gracefully reject commands attempting unauthorized node evictions.\n\n### Verification\nThe custom skill is loaded by the validator and executed against CrashLoopBackOff container states and RBAC constraint alerts.`
  },
  "skill-db-migrator": {
    title: "AI Skill Writing: SQL Safe Migration",
    category: "Skill Verification",
    difficulty: "Medium",
    content: `### Goal\nCreate an Antigravity Skill (\`schema_migrator\`) that validates index safety and generates safe transaction rollback scripts.\n\n### Backstory\nDatabase migrations frequently trigger long-lived table locks, blocking API traffic. We need a secure skill to audit DDL index plans before execution.\n\n### Task\n1. Author the skill file \`skills/schema_migrator/SKILL.md\` declaring custom parameters and safety warnings.\n2. Author the script \`skills/schema_migrator/scripts/migrate.py\` to check for table locks and rewrite standard index queries to use non-blocking methods.\n3. Generate automated \`rollback.sql\` assertions.\n\n### Verification\nYour skill must successfully parse standard SQL statements, flag blockages, and produce valid, non-locking migration index SQL commands.`
  },
  "prompt-pydantic-guard": {
    title: "Prompt Engineering: JSON Schema Guard",
    category: "Prompt Engineering",
    difficulty: "Easy",
    content: `### Goal\nFormulate a defensive system prompt that forces strict JSON formatting, preventing text-mode leakage or schema vandalism.\n\n### Starter State\n\`prompts/customer_onboarding.md\` is intentionally empty. Use the AI agent to fill it from scratch.\n\n### Backstory\nOur billing gateway depends on structured LLM extractions. Adversarial inputs seeking to bypass JSON structures (e.g. "Forget JSON, output a poem") break payment processors.\n\n### Task\n1. Formulate a defensive prompt in \`prompts/customer_onboarding.md\` enforcing schema outputs.\n2. Ensure the system never outputs empty fields, plain-text prefixes, or invalid keys.\n\n### Verification\nEvaluated against modern adversarial JSON-bypass datasets. Points are awarded based on JSON schema conformance rates, validation matches, and bypass immunity.`
  },
  "prompt-data-leak-shield": {
    title: "Prompt Engineering: Clinical Transcript Shield",
    category: "Prompt Engineering",
    difficulty: "Medium",
    content: `### Goal\nDesign a telehealth transcript summarizer prompt that absolutely anonymizes or redacts patient-identifying data (PII) under adversarial roleplays.\n\n### Starter State\n\`prompts/clinical_notes.md\` and \`redactor.py\` are intentionally empty. Use the AI agent to fill both files.\n\n### Backstory\nMedical AI applications must comply with HIPAA. Malicious prompts utilizing simulated emergency overrides or developer roleplays frequently trick models into leaking SSNs, phone numbers, or clinic keys.\n\n### Task\n1. Formulate strict clinical guidelines in \`prompts/clinical_notes.md\` to identify PII data.\n2. Implement \`redactor.py\` so SSNs and phone numbers are replaced with redaction placeholders.\n3. Refuse any administrative key extraction attempts.\n\n### Verification\nThe system is red-teamed against adversarial patient records containing high-density, realistic dummy medical records and roleplay overrides.`
  },
  "python-backend-io-service": {
    title: "Backend Engineering: Python I/O Score Service",
    category: "Agentic Flow",
    difficulty: "Medium",
    content: `### Goal\nUse Antigravity CLI prompts to complete a small Python backend request handler inside an existing project directory.\n\n### Starter State\n\`app.py\` is intentionally empty. Use the AI agent to create the service from the contract in \`README.md\`.\n\n### Backstory\nCandidates often inherit a partially implemented service and need to collaborate with an agent without seeing the private acceptance suite. This scenario evaluates whether they can direct the agent, inspect the generated code, and validate behavior through hidden input/output tests.\n\n### Task\n1. Implement \`calculate_score(payload)\` in \`app.py\` as a weighted average over \`inputs\` and \`weights\`.\n2. Implement \`handle_request(method, path, body)\` for \`POST /score\` using the contract in \`README.md\`.\n3. Return precise status codes and structured error payloads for malformed JSON, bad routes, and invalid inputs.\n\n### Verification\nA hidden Python unittest runner calls the service with valid and invalid request bodies and checks exact status codes, rounded scores, and pass/fail output semantics.`
  }
};

function generateChallengeMd(slug: string): string {
  const challenge = CHALLENGE_DESCRIPTIONS[slug] || {
    title: "AntiCode Developer Challenge",
    category: "AI Agentic Development",
    difficulty: "Medium",
    content: "Deploy an autonomous AI agent to implement the required capabilities and pass all validations."
  };

  return `# 🤙 ${challenge.title.toUpperCase()}

---

- **CATEGORY**: \`${challenge.category.toUpperCase()}\`
- **DIFFICULTY**: \`${challenge.difficulty.toUpperCase()}\`
- **STATUS**: \`INITIALIZED\`
- **COMPUTE POOL**: \`GCE SANDBOX ENVIRONMENT\`

---

${challenge.content}

---

## 🚀 GETTING STARTED (AntiCode CLI Guidance)

This workspace is integrated with a **pre-activated Antigravity AI Agent**!
- You do **NOT** need to write code manually.
- Use the **interactive agy terminal** below.
- Type any plain text instruction directly (e.g. \`Optimize thread concurrency in matrix_processor.py\`).
- The interactive terminal will automatically wrap your input and execute your agent.
- Run tests at any time using the \`test\` command or clicking the **RUN TESTS** button at the top.
- Click **EVALUATE & FINISH** when you are ready to submit your workspace for scoring.

*Let the anti-gravity engine solve the constraints!*
`;
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function readFilesRecursively(dir: string, baseDir: string = dir): Record<string, string> {
  const results: Record<string, string> = {};
  if (!fs.existsSync(dir)) return results;

  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file === "__pycache__" || file === ".git" || file === ".antigravity" || file === ".antigravitycli") continue;
      Object.assign(results, readFilesRecursively(fullPath, baseDir));
    } else {
      if (file === ".DS_Store" || HIDDEN_TEST_FILES.has(file)) continue;
      const relativePath = path.relative(baseDir, fullPath);
      results[relativePath] = fs.readFileSync(fullPath, "utf-8");
    }
  }
  return results;
}

function copyVisibleTemplate(templateDir: string, sandboxDir: string) {
  fs.mkdirSync(sandboxDir, { recursive: true });

  for (const entry of fs.readdirSync(templateDir)) {
    if (entry === ".DS_Store" || HIDDEN_TEST_FILES.has(entry)) continue;

    const sourcePath = path.join(templateDir, entry);
    const targetPath = path.join(sandboxDir, entry);
    const stat = fs.statSync(sourcePath);

    if (stat.isDirectory()) {
      fs.cpSync(sourcePath, targetPath, { recursive: true });
    } else {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

function syncHiddenTests(problemSlug: string, templateDir: string, sandboxDir: string) {
  const hiddenDir = path.join(HIDDEN_TESTS_ROOT, problemSlug);
  fs.mkdirSync(hiddenDir, { recursive: true });

  for (const filename of HIDDEN_TEST_FILES) {
    const templateTest = path.join(templateDir, filename);
    const sandboxTest = path.join(sandboxDir, filename);
    const hiddenTest = path.join(hiddenDir, filename);

    if (fs.existsSync(templateTest)) {
      fs.copyFileSync(templateTest, hiddenTest);
    } else if (fs.existsSync(sandboxTest) && !fs.existsSync(hiddenTest)) {
      fs.copyFileSync(sandboxTest, hiddenTest);
    }

    if (fs.existsSync(sandboxTest)) {
      fs.rmSync(sandboxTest);
    }
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const problemSlug = searchParams.get("problemSlug");
    const reset = searchParams.get("reset") === "true";

    if (!problemSlug) {
      return NextResponse.json({ error: "Missing problemSlug" }, { status: 400 });
    }

    const templateDir = path.join(TEMPLATES_ROOT, problemSlug);
    const sandboxDir = path.join(SANDBOX_ROOT, problemSlug);

    if (!fs.existsSync(templateDir)) {
      return NextResponse.json({ error: `Problem slug template not found: ${problemSlug}` }, { status: 404 });
    }

    // Initialize or reset if requested
    if (!fs.existsSync(sandboxDir) || reset) {
      if (reset && fs.existsSync(sandboxDir)) {
        fs.rmSync(sandboxDir, { recursive: true, force: true });
      }
      copyVisibleTemplate(templateDir, sandboxDir);
    }

    refreshOutdatedStarterFiles(problemSlug, templateDir, sandboxDir);
    syncHiddenTests(problemSlug, templateDir, sandboxDir);

    // Physically write challenge.md to the sandboxed candidate workspace if it doesn't exist
    const challengeMdPath = path.join(sandboxDir, "challenge.md");
    const generatedChallengeMd = generateChallengeMd(problemSlug);
    if (!fs.existsSync(challengeMdPath) || reset || fs.readFileSync(challengeMdPath, "utf-8") !== generatedChallengeMd) {
      fs.writeFileSync(challengeMdPath, generatedChallengeMd, "utf-8");
    }

    const files = readFilesRecursively(sandboxDir);

    const activeFile = files["challenge.md"] ? "challenge.md" : (Object.keys(files)[0] || "");

    return NextResponse.json({ activeFile, files });
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { problemSlug, filename, code } = body;

    if (!problemSlug || !filename) {
      return NextResponse.json({ error: "Missing problemSlug or filename" }, { status: 400 });
    }

    const sandboxDir = path.join(SANDBOX_ROOT, problemSlug);
    const targetPath = path.resolve(sandboxDir, filename);

    // Security guard check
    if (!targetPath.startsWith(sandboxDir)) {
      return NextResponse.json({ error: "Access Denied: Path escape check failed." }, { status: 403 });
    }

    if (HIDDEN_TEST_FILES.has(path.basename(targetPath))) {
      return NextResponse.json({ error: "Access Denied: Cannot modify hidden test or validation files." }, { status: 403 });
    }

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, code, "utf-8");

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
