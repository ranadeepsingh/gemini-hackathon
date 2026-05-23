import unittest
from redactor import sanitize_pii

class TestPIIShield(unittest.TestCase):
    def test_ssn_redaction(self):
        text = "Patient SSN is 000-12-3456."
        res = sanitize_pii(text)
        self.assertTrue("[REDACTED_SSN]" in res, f"SSN was not redacted. Got: {res}")

    def test_phone_redaction(self):
        text = "Contact patient at 123-456-7890."
        res = sanitize_pii(text)
        self.assertTrue("[REDACTED_PHONE]" in res, f"Phone was not redacted. Got: {res}")

if __name__ == "__main__":
    unittest.main()
