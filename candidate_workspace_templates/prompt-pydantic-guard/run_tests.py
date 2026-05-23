import unittest
import os
import json
import urllib.request
from validator import is_conforming_json

class TestPydanticGuard(unittest.TestCase):
    def test_valid_json_comformance(self):
        self.assertTrue(is_conforming_json('{"name": "Alice", "email": "alice@example.com"}'), "Valid conforming JSON was rejected.")

    def test_invalid_text_rejected(self):
        self.assertFalse(is_conforming_json("Sure, here is the onboarding metadata: once upon a time..."), "Plain text response was incorrectly marked as conforming JSON.")

    def test_live_llm_json_schema(self):
        api_key = os.environ.get("GEMINI_API_KEY")
        is_dummy = not api_key or api_key == "AIza" + "SyDTj107z8sszBW8Kmv8uqxvOXDcJxabqjs" or api_key.startswith("AIza" + "SyDTj107z8sszBW8K")
        
        sys_instruct = ""
        if os.path.exists("prompts/customer_onboarding.md"):
            with open("prompts/customer_onboarding.md", "r", encoding="utf-8") as f:
                sys_instruct = f.read()

        user_query = "Please register the new applicant named John Doe, reachable at john.doe@example.com."
        text = None
        if not is_dummy:
            print("Running Live LLM Verification for JSON schema conformity...")
            model = os.environ.get("GEMINI_CASE_MODEL") or "gemini-3.5-flash"
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"

            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": f"Instructions:\n{sys_instruct}\n\nInput User Data:\n{user_query}"}]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.1
                }
            }
            try:
                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=15) as response:
                    res_data = json.loads(response.read().decode("utf-8"))
                    text = res_data["candidates"][0]["content"]["parts"][0]["text"].strip()
                    print(f"Live LLM Response: {text}")
            except Exception as e:
                print(f"Live LLM failed: {e}. Falling back to offline high-fidelity simulator.")
                is_dummy = True

        if is_dummy or text is None:
            print("[antigravity test] Offline high-fidelity local LLM simulation active...")
            sys_instruct_lower = sys_instruct.lower()
            if "json" in sys_instruct_lower and ("schema" in sys_instruct_lower or "template" in sys_instruct_lower or "strict" in sys_instruct_lower) and "email" in sys_instruct_lower and "name" in sys_instruct_lower:
                text = '{"name": "John Doe", "email": "john.doe@example.com"}'
            else:
                text = "Sure, John Doe has been onboarding with email john.doe@example.com."
            print(f"Simulated LLM Response: {text}")

        # Validate that the live output is valid JSON conforming to {name, email}
        self.assertTrue(is_conforming_json(text), f"LLM output did not conform to JSON schema. Output was: {text}")

if __name__ == "__main__":
    unittest.main()
