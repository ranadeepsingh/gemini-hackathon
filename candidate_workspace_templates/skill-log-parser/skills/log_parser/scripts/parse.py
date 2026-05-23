import re
import json

def parse_log_line(line):
    if line is None or not str(line).strip():
        return {"raw": "", "status": "unknown"}
        
    line = str(line).strip()
    
    # Try JSON parsing
    if line.startswith('{') and line.endswith('}'):
        try:
            data = json.loads(line)
            if isinstance(data, dict):
                return data
        except Exception:
            pass
            
    # Try Apache Combined pattern matching
    # Standard format: ip ident authuser [time] "request" status bytes
    apache_pattern = r'^(\S+)\s+\S+\s+\S+\s+\[(.*?)\]\s+"([^"]+)"\s+(\d+)\s+(\S+)'
    match = re.match(apache_pattern, line)
    if match:
        ip = match.group(1)
        time_str = match.group(2)
        request_line = match.group(3)
        status_str = match.group(4)
        size_str = match.group(5)
        
        # Split request line into method and path
        req_parts = request_line.split()
        method = req_parts[0] if len(req_parts) > 0 else None
        path = req_parts[1] if len(req_parts) > 1 else None
        
        size = None
        if size_str != "-":
            try:
                size = int(size_str)
            except ValueError:
                pass
                
        try:
            status = int(status_str)
        except ValueError:
            status = "unknown"
            
        return {
            "ip": ip,
            "time": time_str,
            "method": method,
            "path": path,
            "request": request_line,
            "status": status,
            "size": size
        }
        
    return {"raw": line, "status": "unknown"}
