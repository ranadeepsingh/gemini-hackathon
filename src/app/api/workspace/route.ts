import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const TEMPLATES_ROOT = path.resolve(process.cwd(), "candidate_workspace_templates");
const SANDBOX_ROOT = path.resolve(process.cwd(), "candidate_workspace");
const HIDDEN_TESTS_ROOT = path.resolve(process.cwd(), "candidate_workspace_hidden_tests");
const HIDDEN_TEST_FILES = new Set(["run_tests.py"]);

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

    syncHiddenTests(problemSlug, templateDir, sandboxDir);

    const files = readFilesRecursively(sandboxDir);

    // Identify primary file to load first
    const primaryFiles: Record<string, string> = {
      "agentic-matrix-optimizer": "matrix_processor.py",
      "agentic-dependency-resolver": "resolver.py",
      "agentic-anomaly-detector": "healer.py",
      "skill-log-parser": "skills/log_parser/scripts/parse.py",
      "skill-k8s-debugger": "skills/k8s_triage/scripts/triage.py",
      "skill-db-migrator": "skills/schema_migrator/scripts/migrate.py",
      "prompt-adversarial-defense": "validator.py",
      "prompt-pydantic-guard": "validator.py",
      "prompt-data-leak-shield": "redactor.py",
      "python-backend-io-service": "app.py"
    };

    const activeFile = primaryFiles[problemSlug] || Object.keys(files)[0] || "";

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

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, code, "utf-8");

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
