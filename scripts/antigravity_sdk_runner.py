#!/usr/bin/env python3
"""AntiCode bridge for the official Google Antigravity SDK.

This script intentionally does not contain challenge-specific solution
heuristics. It either runs the official SDK against the requested workspace or
fails clearly without modifying files.
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import os
import pathlib
import subprocess
import sys
import textwrap
from importlib import metadata


SKIP_DIRS = {"__pycache__", ".git", ".hg", ".svn", ".antigravity", ".antigravitycli"}
MAX_VISIBLE_TEXT = 900


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the official Antigravity SDK in an AntiCode workspace.")
    parser.add_argument("--workspace", required=True, help="Absolute candidate workspace path.")
    parser.add_argument("--problem", required=True, help="Problem slug for prompt context.")
    parser.add_argument("--mode", choices=["prompt", "run", "ask", "status"], default="prompt")
    parser.add_argument("--prompt", default="", help="Candidate prompt. Required for prompt/ask mode.")
    return parser.parse_args()


def safe_print(line: str) -> None:
    print(line, flush=True)


def sdk_version() -> str:
    try:
        return metadata.version("google-antigravity")
    except metadata.PackageNotFoundError:
        return "not-installed"


def selected_model() -> str:
    return os.environ.get("AGY_SDK_MODEL") or os.environ.get("GEMINI_CASE_MODEL") or "gemini-3.5-flash"


def estimate_embedding_tokens(text: str) -> int:
    if not text:
        return 0
    try:
        import tiktoken
        encoding = tiktoken.get_encoding("cl100k_base")
        return len(encoding.encode(text))
    except Exception:
        import re
        tokens_count = 0
        pattern = re.compile(r"([a-zA-Z0-9]+|\n|[^\w\s]|\s+)")
        matches = pattern.findall(text)
        for match in matches:
            if not match:
                continue
            if match == "\n":
                tokens_count += 1
            elif match.isspace():
                tokens_count += max(1, len(match) // 4)
            elif match.isalnum():
                tokens_count += max(1, (len(match) + 3) // 4)
            else:
                tokens_count += len(match)
        return tokens_count


def validate_sdk_available() -> bool:
    try:
        import google.antigravity  # noqa: F401
    except Exception as exc:
        safe_print(f"[antigravity sdk] ERROR: official SDK import failed: {exc}")
        return False
    return True


def iter_visible_files(workspace: pathlib.Path) -> list[pathlib.Path]:
    files: list[pathlib.Path] = []
    for root, dirs, filenames in os.walk(workspace):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for filename in filenames:
            if filename == ".DS_Store":
                continue
            full_path = pathlib.Path(root) / filename
            if full_path.is_file():
                files.append(full_path)
    return sorted(files)


def snapshot_workspace(workspace: pathlib.Path) -> dict[str, str]:
    snapshot: dict[str, str] = {}
    for full_path in iter_visible_files(workspace):
        rel_path = full_path.relative_to(workspace).as_posix()
        try:
            digest = hashlib.sha256(full_path.read_bytes()).hexdigest()
        except OSError:
            continue
        snapshot[rel_path] = digest
    return snapshot


def describe_changes(before: dict[str, str], after: dict[str, str]) -> list[str]:
    changed: list[str] = []
    for rel_path, digest in after.items():
        if before.get(rel_path) != digest:
            changed.append(rel_path)
    for rel_path in before:
        if rel_path not in after:
            changed.append(rel_path)
    return sorted(changed)


def default_run_prompt(problem: str) -> str:
    return (
        "Read challenge.md and the visible project files, then make the smallest "
        "safe code edits needed for this demo challenge. Keep the solution simple, "
        "do not invent hidden test results, and summarize the changed files."
    )


def build_prompt(problem: str, mode: str, user_prompt: str) -> str:
    prompt = user_prompt.strip()
    if mode == "run" and not prompt:
        prompt = default_run_prompt(problem)

    return textwrap.dedent(
        f"""
        AntiCode problem slug: {problem}

        Candidate request:
        {prompt}

        Constraints:
        - Use only visible workspace files.
        - Keep edits minimal and demo-friendly.
        - Do not inspect, mention, or recreate hidden tests.
        - Do not claim tests passed unless a separate test command actually runs.
        - If this is not a coding request, do not modify files.
        """
    ).strip()


def print_status(workspace: pathlib.Path, problem: str) -> int:
    available = validate_sdk_available()
    api_key_configured = bool(os.environ.get("GEMINI_API_KEY"))
    safe_print(f"[antigravity sdk] package google-antigravity=={sdk_version()}")
    safe_print(f"[antigravity sdk] model={selected_model()}")
    safe_print(f"[antigravity sdk] gemini_api_key={'configured' if api_key_configured else 'missing'}")
    safe_print(f"[antigravity sdk] workspace={workspace}")
    safe_print(f"[antigravity sdk] problem={problem}")
    safe_print(f"[antigravity sdk] file tools={'ready' if available else 'unavailable'}")
    safe_print(f"[antigravity sdk] live gemini chat={'ready' if available and api_key_configured else 'unavailable'}")
    return 0


def run_bundled_cli_fallback(workspace: pathlib.Path, mode: str, prompt: str, reason: str) -> int:
    repo_root = pathlib.Path(__file__).resolve().parents[1]
    bundled_cli = repo_root / "bin" / "antigravity"
    if not bundled_cli.exists():
        safe_print(f"[antigravity sdk] ERROR: SDK unavailable and bundled fallback is missing: {bundled_cli}")
        return 2

    safe_print(f"[antigravity sdk] {reason} Switching to bundled demo-safe Antigravity agent fallback.")
    command = "run" if mode == "run" else mode
    args = [sys.executable, str(bundled_cli), command]
    if prompt.strip():
        args.append(prompt.strip())

    env = os.environ.copy()
    env["ANTICODE_AGENT_FALLBACK_ACTIVE"] = "1"
    completed = subprocess.run(args, cwd=workspace, env=env)
    return completed.returncode


def shorten(value: object) -> str:
    text = str(value).replace("\n", " ").strip()
    if len(text) > MAX_VISIBLE_TEXT:
        return text[:MAX_VISIBLE_TEXT] + " ..."
    return text


async def run_sdk_agent(workspace: pathlib.Path, problem: str, mode: str, prompt: str) -> int:
    if not validate_sdk_available():
        return run_bundled_cli_fallback(workspace, mode, prompt, "Official SDK import failed.")

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return run_bundled_cli_fallback(workspace, mode, prompt, "GEMINI_API_KEY is not configured.")

    from google.antigravity import Agent, LocalAgentConfig, types
    from google.antigravity.hooks import policy

    workspace = workspace.resolve()
    save_dir = workspace / ".antigravity" / "sdk-save"
    app_data_dir = workspace / ".antigravity" / "sdk-data"
    save_dir.mkdir(parents=True, exist_ok=True)
    app_data_dir.mkdir(parents=True, exist_ok=True)

    before = snapshot_workspace(workspace)
    model = selected_model()
    safe_print(f"[antigravity sdk] Official SDK active: google-antigravity=={sdk_version()}")
    safe_print(f"[antigravity sdk] Model: {model}")
    safe_print(f"[antigravity sdk] Workspace file tools are scoped to {workspace}")

    capabilities = types.CapabilitiesConfig(
        enable_subagents=False,
        enabled_tools=[
            types.BuiltinTools.LIST_DIR,
            types.BuiltinTools.SEARCH_DIR,
            types.BuiltinTools.FIND_FILE,
            types.BuiltinTools.VIEW_FILE,
            types.BuiltinTools.CREATE_FILE,
            types.BuiltinTools.EDIT_FILE,
            types.BuiltinTools.FINISH,
        ],
    )

    config = LocalAgentConfig(
        system_instructions=(
            "You are the official Google Antigravity SDK coding agent running "
            "inside an AntiCode interview sandbox. Prefer tiny, obvious Python "
            "edits for a live demo. Never fabricate validation results."
        ),
        model=model,
        api_key=api_key,
        capabilities=capabilities,
        policies=[policy.allow_all()],
        workspaces=[str(workspace)],
        save_dir=str(save_dir),
        app_data_dir=str(app_data_dir),
    )

    try:
        async with Agent(config) as agent:
            prompt_text = build_prompt(problem, mode, prompt)
            response = await agent.chat(prompt_text)
            final_text: list[str] = []
            async for chunk in response.chunks:
                if isinstance(chunk, types.Thought):
                    text = shorten(chunk.text)
                    if text:
                        safe_print(f"[antigravity sdk] [THINKING] {text}")
                elif isinstance(chunk, types.ToolCall):
                    target = chunk.canonical_path or chunk.args.get("path") or chunk.args.get("file_path") or ""
                    safe_print(f"[antigravity sdk] [ACTION] {chunk.name}: {shorten(target)}")
                elif isinstance(chunk, types.Text):
                    final_text.append(chunk.text)

            response_text = shorten("".join(final_text).strip())
            if response_text:
                safe_print(f"[antigravity sdk] [RESULT] {response_text}")

            usage = response.usage_metadata
            # Recalculate prompt tokens with tiktoken
            prompt_tokens = estimate_embedding_tokens(prompt_text)
            output_tokens = usage.candidates_token_count if usage and usage.candidates_token_count else 0
            thoughts_tokens = usage.thoughts_token_count if usage and usage.thoughts_token_count else 0
            total_tokens = prompt_tokens + output_tokens + thoughts_tokens
            cost_usd = (prompt_tokens * 0.00000015) + (output_tokens * 0.00000060)
    except Exception as exc:
        return run_bundled_cli_fallback(workspace, mode, prompt, f"Official SDK run failed: {shorten(exc)}.")

    after = snapshot_workspace(workspace)
    changed = describe_changes(before, after)
    if changed:
        safe_print(f"[antigravity sdk] [ACTION] Changed files: {', '.join(changed)}")
    else:
        safe_print("[antigravity sdk] [ACTION] No file changes were made.")

    safe_print(
        f"[METRICS] prompt_tokens={prompt_tokens} candidates_tokens={output_tokens} "
        f"total_tokens={total_tokens} cost_usd={cost_usd:.6f}"
    )
    return 0


async def async_main() -> int:
    args = parse_args()
    workspace = pathlib.Path(args.workspace).expanduser().resolve()
    if not workspace.exists() or not workspace.is_dir():
        safe_print(f"[antigravity sdk] ERROR: workspace does not exist: {workspace}")
        return 2

    if args.mode == "status":
        return print_status(workspace, args.problem)

    if args.mode in {"prompt", "ask"} and not args.prompt.strip():
        safe_print("[antigravity sdk] ERROR: prompt is empty. No files were modified.")
        return 2

    if args.prompt.strip().startswith("/"):
        safe_print("[antigravity sdk] Slash commands are not coding prompts. No files were modified.")
        return 2

    return await run_sdk_agent(workspace, args.problem, args.mode, args.prompt)


def main() -> None:
    raise SystemExit(asyncio.run(async_main()))


if __name__ == "__main__":
    main()
