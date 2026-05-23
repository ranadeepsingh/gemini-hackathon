import json

def is_conforming_json(response):
    if not response or not isinstance(response, str):
        return False
    try:
        # Strip potential markdown fences if returned
        clean_text = response.strip()
        if clean_text.startswith("```"):
            lines = clean_text.splitlines()
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            clean_text = "\n".join(lines).strip()
            
        data = json.loads(clean_text)
        if not isinstance(data, dict):
            return False
        # required schema keys 'name' and 'email' must be populated
        if "name" not in data or "email" not in data:
            return False
        if not data["name"] or not data["email"]:
            return False
        return True
    except Exception:
        return False
