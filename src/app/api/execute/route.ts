import { NextRequest, NextResponse } from "next/server";
import { spawn, spawnSync } from "child_process";
import path from "path";
import fs from "fs";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { refreshOutdatedStarterFiles } from "@/lib/workspace/starter-repairs";

const SANDBOX_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "candidate_workspace");
const TEMPLATES_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "candidate_workspace_templates");
const BIN_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "bin");
const HIDDEN_TESTS_ROOT = path.join(/*turbopackIgnore: true*/ process.cwd(), "candidate_workspace_hidden_tests");
const SDK_RUNNER = path.join(/*turbopackIgnore: true*/ process.cwd(), "scripts/antigravity_sdk_runner.py");
const SDK_PYTHON_BIN = process.env.ANTIGRAVITY_SDK_PYTHON || process.env.PYTHON_BIN || "python3";
const MAX_OUTPUT_BYTES = 120_000;
const COMMAND_TIMEOUT_MS = 120_000;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isPathInside(parentDir: string, targetPath: string) {
  const relative = path.relative(parentDir, targetPath);
  return relative === "" || (!!relative && !relative.startsWith("..") && !path.isAbsolute(relative));
}

function tokenizeCommand(command: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let quote: "'" | "\"" | null = null;
  let escaping = false;

  for (const char of command.trim()) {
    if (escaping) {
      current += char;
      escaping = false;
      continue;
    }

    if (char === "\\") {
      escaping = true;
      continue;
    }

    if (quote) {
      if (char === quote) {
        quote = null;
      } else {
        current += char;
      }
      continue;
    }

    if (char === "'" || char === "\"") {
      quote = char;
      continue;
    }

    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      continue;
    }

    current += char;
  }

  if (quote) {
    throw new Error("Unterminated quoted string in command.");
  }
  if (escaping) {
    current += "\\";
  }
  if (current) {
    tokens.push(current);
  }
  return tokens;
}

function normalizeCommand(tokens: string[]): string[] {
  if (tokens.length === 0) return tokens;

  // Direct alias support
  if (tokens[0] === "agy" || tokens[0] === "gy") {
    tokens[0] = "antigravity";
  }

  // Prepend antigravity if starting with direct shortcuts
  if (["prompt", "ask", "test", "status", "run", "ci"].includes(tokens[0])) {
    tokens.unshift("antigravity");
  }

  if (tokens.length >= 2 && /^python(\d+(\.\d+)?)?$/.test(tokens[0]) && tokens[1] === "run_tests.py") {
    return ["antigravity", "test"];
  }
  return tokens;
}

function validateCommand(tokens: string[]) {
  if (tokens.length === 0) {
    throw new Error("Empty command.");
  }

  const executable = path.basename(tokens[0]);
  if (tokens[0].startsWith("/")) {
    throw new Error("Slash commands are not supported in this agy terminal.");
  }

  if (executable === "antigravity") {
    const subcommand = tokens[1] || "help";
    if (!["prompt", "ask", "run", "test", "status", "help", "ci"].includes(subcommand)) {
      throw new Error(`Unsupported agy command: ${subcommand}`);
    }
  }

  if (["env", "printenv", "export"].includes(executable)) {
    throw new Error("Environment inspection is disabled in the interview sandbox.");
  }

  if (executable.startsWith("python") && tokens.includes("-c")) {
    throw new Error("Inline Python execution is disabled to protect hidden test fixtures.");
  }

  const joined = tokens.join(" ");
  const forbiddenPatterns = [
    /(^|[\/\s])run_tests\.py($|[\s])/,
    /(^|[\/\s])validator\.py($|[\s])/,
    /\.hidden_tests/,
    /candidate_workspace_hidden_tests/,
    /AGY_TEST_RUNNER/,
    /GEMINI_API_KEY/,
    /\.\./
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(joined)) {
      throw new Error("Command blocked: hidden evaluation fixtures and parent-directory traversal are not readable.");
    }
  }
}

function buildExecutableTokens(tokens: string[], sandboxDir: string, problemSlug: string): string[] {
  const executable = path.basename(tokens[0]);
  if (executable !== "antigravity") return tokens;

  const subcommand = tokens[1] || "help";
  if (subcommand === "prompt" || subcommand === "ask") {
    return [
      SDK_PYTHON_BIN,
      SDK_RUNNER,
      "--workspace",
      sandboxDir,
      "--problem",
      problemSlug,
      "--mode",
      subcommand,
      "--prompt",
      tokens.slice(2).join(" ")
    ];
  }

  if (subcommand === "run") {
    const prompt = tokens.slice(2).join(" ");
    const sdkTokens = [
      SDK_PYTHON_BIN,
      SDK_RUNNER,
      "--workspace",
      sandboxDir,
      "--problem",
      problemSlug,
      "--mode",
      "run"
    ];
    return prompt ? [...sdkTokens, "--prompt", prompt] : sdkTokens;
  }

  if (subcommand === "status") {
    return [
      SDK_PYTHON_BIN,
      SDK_RUNNER,
      "--workspace",
      sandboxDir,
      "--problem",
      problemSlug,
      "--mode",
      "status"
    ];
  }

  return tokens;
}

function buildExecutionEnv(tokens: string[], sandboxDir: string, problemSlug: string): NodeJS.ProcessEnv {
  const systemPath = process.env.PATH || "";
  const customPath = `${BIN_ROOT}${path.delimiter}${systemPath}`;
  const executable = path.basename(tokens[0]);
  const isAntigravity = executable === "antigravity";
  const subcommand = tokens[1] || "help";
  const hiddenRunner = path.join(HIDDEN_TESTS_ROOT, problemSlug, "run_tests.py");

  const execEnv: NodeJS.ProcessEnv = {
    PATH: customPath,
    HOME: sandboxDir,
    NODE_ENV: process.env.NODE_ENV || "development",
    TERM: "xterm-256color",
    LANG: process.env.LANG || "en_US.UTF-8",
    PYTHONUNBUFFERED: "1",
    PYTHONPATH: sandboxDir
  };

  if (isAntigravity && fs.existsSync(hiddenRunner)) {
    execEnv.AGY_TEST_RUNNER = hiddenRunner;
  }
  if (isAntigravity && subcommand === "test") {
    if (process.env.ANTICODE_ENABLE_LIVE_LLM_TESTS === "1") {
      execEnv.ANTICODE_LIVE_LLM_TEST_BUDGET = "1";
    } else {
      execEnv.ANTICODE_DISABLE_LIVE_LLM_TESTS = "1";
    }
  }

  const canUseSensitiveRuntime = isAntigravity && ["prompt", "ask", "run", "test", "status", "ci"].includes(subcommand);
  if (canUseSensitiveRuntime) {
    if (process.env.GEMINI_API_KEY) execEnv.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (process.env.AGY_SDK_MODEL) execEnv.AGY_SDK_MODEL = process.env.AGY_SDK_MODEL;
    if (process.env.GEMINI_CASE_MODEL) execEnv.GEMINI_CASE_MODEL = process.env.GEMINI_CASE_MODEL;
  }

  return execEnv;
}

function syncHiddenTestRunner(problemSlug: string) {
  const templateRunner = path.join(TEMPLATES_ROOT, problemSlug, "run_tests.py");
  if (!fs.existsSync(templateRunner)) return;

  const hiddenDir = path.join(HIDDEN_TESTS_ROOT, problemSlug);
  fs.mkdirSync(hiddenDir, { recursive: true });
  fs.copyFileSync(templateRunner, path.join(hiddenDir, "run_tests.py"));
}

function sanitizeOutput(text: string, problemSlug: string): string {
  const hiddenDir = path.join(HIDDEN_TESTS_ROOT, problemSlug);
  return text
    .replaceAll(path.join(hiddenDir, "run_tests.py"), "[hidden-tests]/run_tests.py")
    .replaceAll(path.join(hiddenDir, "validator.py"), "[hidden-tests]/validator.py")
    .replaceAll(hiddenDir, "[hidden-tests]")
    .replaceAll(HIDDEN_TESTS_ROOT, "[hidden-tests-root]");
}

interface CommandResult {
  stdout: string;
  stderr: string;
  code: number;
  success: boolean;
}

function runCommand(
  tokens: string[],
  sandboxDir: string,
  execEnv: NodeJS.ProcessEnv,
  problemSlug: string
): Promise<CommandResult> {
  return new Promise<CommandResult>((resolve) => {
    const child = spawn(tokens[0], tokens.slice(1), {
      cwd: sandboxDir,
      env: execEnv,
      shell: false
    });

    let stdout = "";
    let stderr = "";
    let completed = false;

    const appendOutput = (target: "stdout" | "stderr", chunk: Buffer) => {
      const text = chunk.toString("utf-8");
      if (target === "stdout") {
        stdout = (stdout + text).slice(-MAX_OUTPUT_BYTES);
      } else {
        stderr = (stderr + text).slice(-MAX_OUTPUT_BYTES);
      }
    };

    const timeout = setTimeout(() => {
      if (!completed) {
        stderr += `\nCommand timed out after ${COMMAND_TIMEOUT_MS / 1000}s.`;
        child.kill("SIGTERM");
      }
    }, COMMAND_TIMEOUT_MS);

    child.stdout.on("data", (chunk: Buffer) => appendOutput("stdout", chunk));
    child.stderr.on("data", (chunk: Buffer) => appendOutput("stderr", chunk));

    child.on("error", (error) => {
      completed = true;
      clearTimeout(timeout);
      resolve({
        stdout: sanitizeOutput(stdout, problemSlug),
        stderr: sanitizeOutput(`${stderr}${stderr ? "\n" : ""}${error.message}`, problemSlug),
        code: 127,
        success: false
      });
    });

    child.on("close", (code) => {
      completed = true;
      clearTimeout(timeout);
      const exitCode = code ?? 1;
      resolve({
        stdout: sanitizeOutput(stdout, problemSlug),
        stderr: sanitizeOutput(stderr, problemSlug),
        code: exitCode,
        success: exitCode === 0
      });
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { problemSlug, command, sessionId, cwd: clientCwd } = body;

    if (!problemSlug || !command) {
      return NextResponse.json({ error: "Missing problemSlug or command" }, { status: 400 });
    }

    const baseSandboxDir = path.join(SANDBOX_ROOT, problemSlug);
    if (!fs.existsSync(baseSandboxDir)) {
      return NextResponse.json({ error: "Sandbox directory not initialized. Load workspace first." }, { status: 400 });
    }

    refreshOutdatedStarterFiles(problemSlug, path.join(TEMPLATES_ROOT, problemSlug), baseSandboxDir);
    const tokens = normalizeCommand(tokenizeCommand(command));
    if (tokens[0] === "antigravity" && (tokens[1] || "") === "test") {
      syncHiddenTestRunner(problemSlug);
    }

    // Handle stateful directory traversal (cd) in-process
    if (tokens[0] === "cd") {
      const targetPath = tokens[1] || "";
      let targetDir: string;

      if (targetPath === "" || targetPath === "~") {
        targetDir = baseSandboxDir;
      } else {
        const currentDirContext = clientCwd ? path.join(baseSandboxDir, clientCwd) : baseSandboxDir;
        targetDir = path.resolve(currentDirContext, targetPath);
      }

      // Security Check: enforce sandbox boundaries
      if (!isPathInside(baseSandboxDir, targetDir)) {
        return NextResponse.json({
          stdout: "",
          stderr: "cd: Permission denied (cannot escape sandbox bounds)",
          code: 1,
          success: false
        });
      }

      // Stat Check: ensure directory exists
      if (!fs.existsSync(targetDir) || !fs.statSync(targetDir).isDirectory()) {
        return NextResponse.json({
          stdout: "",
          stderr: `cd: no such file or directory: ${targetPath || "~"}`,
          code: 1,
          success: false
        });
      }

      // Compute relative CWD from base sandbox root to return to client
      const newRelativeCwd = path.relative(baseSandboxDir, targetDir);
      return NextResponse.json({
        stdout: "",
        stderr: "",
        code: 0,
        success: true,
        newCwd: newRelativeCwd
      });
    }

    // Resolve execution sandbox subdirectory safely
    let sandboxDir = baseSandboxDir;
    if (clientCwd) {
      const resolvedDir = path.resolve(baseSandboxDir, clientCwd);
      if (isPathInside(baseSandboxDir, resolvedDir) && fs.existsSync(resolvedDir)) {
        sandboxDir = resolvedDir;
      }
    }

    validateCommand(tokens);
    const execEnv = buildExecutionEnv(tokens, sandboxDir, problemSlug);
    const executableTokens = buildExecutableTokens(tokens, sandboxDir, problemSlug);

    const result = await runCommand(executableTokens, sandboxDir, execEnv, problemSlug);

    // Calculate workspace tokens if this is a skill verification or prompt engineering task
    let workspaceTokens: number | undefined = undefined;
    const isSkillOrPromptTask = problemSlug.startsWith("skill-") || problemSlug.startsWith("prompt-");

    if (isSkillOrPromptTask) {
      try {
        const countResult = spawnSync(SDK_PYTHON_BIN, [
          SDK_RUNNER,
          "--workspace",
          path.join(SANDBOX_ROOT, problemSlug),
          "--problem",
          problemSlug,
          "--mode",
          "count_tokens"
        ], { encoding: "utf-8" });

        if (countResult.status === 0) {
          workspaceTokens = parseInt(countResult.stdout.trim()) || 0;
        }
      } catch (tokenErr) {
        console.error("Token counting command failed:", tokenErr);
      }
    }

    // If sessionId is present, parse metrics and update database
    if (sessionId) {
      try {
        const supabaseServer = getSupabaseServerClient();
        const metricsMatch = result.stdout.match(/\[METRICS\] prompt_tokens=(\d+) candidates_tokens=(\d+) total_tokens=(\d+) cost_usd=([\d\.]+)/);
        
        // Fetch current values
        const { data: session } = await supabaseServer
          .from("interview_sessions")
          .select("agent_deploy_count, test_run_count, total_llm_calls, total_input_tokens, total_output_tokens, cost_usd")
          .eq("id", sessionId)
          .single();

        if (session) {
          let agentDeployCount = session.agent_deploy_count || 0;
          let testRunCount = session.test_run_count || 0;
          let totalLlmCalls = session.total_llm_calls || 0;
          let totalInputTokens = session.total_input_tokens || 0;
          let totalOutputTokens = session.total_output_tokens || 0;
          let costUsd = parseFloat(session.cost_usd || "0");

          // Determine command type from normalized tokens
          const subcommand = tokens[1] || "";
          const isAntigravity = tokens[0] === "antigravity";
          if (isAntigravity && ["run", "prompt", "ask"].includes(subcommand)) {
            agentDeployCount += 1;
          } else if (isAntigravity && subcommand === "test") {
            testRunCount += 1;
          }

          if (isSkillOrPromptTask && workspaceTokens !== undefined) {
            totalInputTokens = workspaceTokens;
            costUsd = (totalInputTokens * 0.00000015) + (totalOutputTokens * 0.00000060);
          } else if (metricsMatch) {
            totalInputTokens += parseInt(metricsMatch[1]);
            totalOutputTokens += parseInt(metricsMatch[2]);
            totalLlmCalls += 1;
            costUsd += parseFloat(metricsMatch[4]);
          }

          await supabaseServer
            .from("interview_sessions")
            .update({
              agent_deploy_count: agentDeployCount,
              test_run_count: testRunCount,
              total_llm_calls: totalLlmCalls,
              total_input_tokens: totalInputTokens,
              total_output_tokens: totalOutputTokens,
              cost_usd: costUsd
            })
            .eq("id", sessionId);
        }
      } catch (dbErr) {
        console.error("Telemetry database sync failed:", dbErr);
      }
    }

    return NextResponse.json({
      ...result,
      workspaceTokens
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}
