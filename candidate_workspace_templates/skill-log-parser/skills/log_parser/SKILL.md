---
name: log_parser
description: Parse system Apache/JSON application logs dynamically
---

# 🌌 Custom Log Parser Skill

Initialize this skill when evaluating server log trace stacks.

This skill equips the autonomous agent with the critical capability to parse, structure, and sanitize incoming raw application and server event logs inside isolated developer environments.

---

## 🛰️ Architectural Specifications

The parser resides in `skills/log_parser/scripts/parse.py` and must expose a single primary function: `parse_log_line(line)`.

### 1. Combined Apache Log Format
For lines matching standard Combined Apache patterns, extract the following fields:
*   `ip`: Client remote address (e.g., `127.0.0.1`)
*   `time`: Bracketed timestamp (e.g., `23/May/2026:12:00:00 -0700`)
*   `method`: HTTP Request method (e.g., `GET`, `POST`)
*   `path`: Requested URL pathway (e.g., `/index.html`)
*   `request`: Synthesized request line (e.g., `GET /index.html HTTP/1.1`)
*   `status`: Numerical HTTP response status (e.g., `200`)
*   `size`: File payload size in bytes, or `None` if placeholder `-` (e.g., `1024` or `None`)

### 2. Structured JSON Format
If the log line is formatted as a JSON string, dynamically parse it as a dictionary. Return the full parsed dictionary object directly if valid.

### 3. Graceful Fallbacks
*   If the input line is empty, whitespace-only, or `None`, return `{"raw": "", "status": "unknown"}`.
*   If the input is raw text that cannot be parsed as JSON or standard Apache formats, return `{"raw": text, "status": "unknown"}`.
