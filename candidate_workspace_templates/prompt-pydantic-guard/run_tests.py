import unittest
from validator import is_conforming_json

class TestPydanticGuard(unittest.TestCase):
    def test_valid_json_comformance(self):
        self.assertTrue(is_conforming_json('{"name": "Alice", "email": "alice@example.com"}'), "Valid conforming JSON was rejected.")

    def test_invalid_text_rejected(self):
        self.assertFalse(is_conforming_json("Sure, here is the onboarding metadata: once upon a time..."), "Plain text response was incorrectly marked as conforming JSON.")

if __name__ == "__main__":
    unittest.main()
