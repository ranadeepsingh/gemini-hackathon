import json
import re


_APACHE_LOG_PATTERN = re.compile(
    r'^(?P<ip>\S+) \S+ \S+ \[(?P<time>[^\]]+)\] '
    r'"(?P<method>\S+)\s+(?P<path>\S+)(?:\s+(?P<protocol>HTTP/[0-9.]+))?" '
    r'(?P<status>\d{3}) (?P<size>\d+|-)'
    r'(?: "(?P<referer>[^"]*)" "(?P<user_agent>[^"]*)")?'
)


def parse_log_line(line):
    if line is None:
        return {"raw": "", "status": "unknown"}

    if isinstance(line, bytes):
        text = line.decode("utf-8", errors="replace").strip()
    else:
        text = str(line).strip()

    if not text:
        return {"raw": "", "status": "unknown"}

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        parsed = None

    if isinstance(parsed, dict):
        return parsed

    match = _APACHE_LOG_PATTERN.match(text)
    if match:
        groups = match.groupdict()
        result = {
            "ip": groups["ip"],
            "time": groups["time"],
            "method": groups["method"],
            "path": groups["path"],
            "request": " ".join(
                part for part in (groups["method"], groups["path"], groups.get("protocol")) if part
            ),
            "status": int(groups["status"]),
            "size": None if groups["size"] == "-" else int(groups["size"]),
        }
        if groups.get("referer") is not None:
            result["referer"] = groups["referer"]
        if groups.get("user_agent") is not None:
            result["user_agent"] = groups["user_agent"]
        return result

    return {"raw": text, "status": "unknown"}
