import { NextRequest, NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

const SANDBOX_ROOT = path.resolve(process.cwd(), "candidate_workspace");
const BIN_ROOT = path.resolve(process.cwd(), "bin");
const HIDDEN_TESTS_ROOT = path.resolve(process.cwd(), "candidate_workspace_hidden_tests");
const MAX_OUTPUT_BYTES = 120_000;
const COMMAND_TIMEOUT_MS = 120_000;

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
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
  if (["env", "printenv", "export"].includes(executable)) {
    throw new Error("Environment inspection is disabled in the interview sandbox.");
  }

  if (executable.startsWith("python") && tokens.includes("-c")) {
    throw new Error("Inline Python execution is disabled to protect hidden test fixtures.");
  }

  const joined = tokens.join(" ");
  const forbiddenPatterns = [
    /(^|[\/\s])run_tests\.py($|[\s])/,
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

function buildExecutionEnv(tokens: string[], sandboxDir: string, problemSlug: string): NodeJS.ProcessEnv {
  const systemPath = process.env.PATH || "";
  const customPath = `${BIN_ROOT}${path.delimiter}${systemPath}`;
  const executable = path.basename(tokens[0]);
  const subcommand = tokens[1] || "";
  const isAntigravity = executable === "antigravity";
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

  if (isAntigravity && ["run", "prompt", "ask"].includes(subcommand)) {
    if (process.env.GEMINI_API_KEY) execEnv.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (process.env.GEMINI_CASE_MODEL) execEnv.GEMINI_CASE_MODEL = process.env.GEMINI_CASE_MODEL;
  }

  return execEnv;
}

function sanitizeOutput(text: string, problemSlug: string): string {
  const hiddenDir = path.join(HIDDEN_TESTS_ROOT, problemSlug);
  return text
    .replaceAll(path.join(hiddenDir, "run_tests.py"), "[hidden-tests]/run_tests.py")
    .replaceAll(hiddenDir, "[hidden-tests]")
    .replaceAll(HIDDEN_TESTS_ROOT, "[hidden-tests-root]");
}

function runCommand(tokens: string[], sandboxDir: string, execEnv: NodeJS.ProcessEnv, problemSlug: string) {
  return new Promise<NextResponse>((resolve) => {
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
      resolve(
        NextResponse.json({
          stdout: sanitizeOutput(stdout, problemSlug),
          stderr: sanitizeOutput(`${stderr}${stderr ? "\n" : ""}${error.message}`, problemSlug),
          code: 127,
          success: false
        })
      );
    });

    child.on("close", (code) => {
      completed = true;
      clearTimeout(timeout);
      const exitCode = code ?? 1;
      resolve(
        NextResponse.json({
          stdout: sanitizeOutput(stdout, problemSlug),
          stderr: sanitizeOutput(stderr, problemSlug),
          code: exitCode,
          success: exitCode === 0
        })
      );
    });
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { problemSlug, command } = body;

    if (!problemSlug || !command) {
      return NextResponse.json({ error: "Missing problemSlug or command" }, { status: 400 });
    }

    const sandboxDir = path.join(SANDBOX_ROOT, problemSlug);
    if (!fs.existsSync(sandboxDir)) {
      return NextResponse.json({ error: "Sandbox directory not initialized. Load workspace first." }, { status: 400 });
    }

    const tokens = normalizeCommand(tokenizeCommand(command));
    validateCommand(tokens);
    const execEnv = buildExecutionEnv(tokens, sandboxDir, problemSlug);

    return runCommand(tokens, sandboxDir, execEnv, problemSlug);
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 400 });
  }
}
