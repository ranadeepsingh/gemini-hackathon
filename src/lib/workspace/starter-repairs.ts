import fs from "fs";
import path from "path";

const OUTDATED_STARTER_REPAIRS: Record<string, Record<string, string>> = {
  "skill-log-parser": {
    "skills/log_parser/scripts/parse.py": `def parse_log_line(line):
    # Buggy starter code: returns empty dict.
    # Candidates/Agents must implement regex matches for Combined Apache logs
    # and support JSON line parsing with graceful fallbacks.
    return {}
`
  }
};

export function refreshOutdatedStarterFiles(problemSlug: string, templateDir: string, sandboxDir: string) {
  const repairs = OUTDATED_STARTER_REPAIRS[problemSlug];
  if (!repairs) return;

  for (const [relativePath, outdatedContent] of Object.entries(repairs)) {
    const templatePath = path.join(templateDir, relativePath);
    const sandboxPath = path.join(sandboxDir, relativePath);
    if (!fs.existsSync(templatePath) || !fs.existsSync(sandboxPath)) continue;

    const currentContent = fs.readFileSync(sandboxPath, "utf-8");
    if (currentContent.trim() === outdatedContent.trim()) {
      fs.copyFileSync(templatePath, sandboxPath);
    }
  }
}
