import unittest
import sys
import os

# Append local scripts path to PYTHONPATH
sys.path.append(os.path.abspath("skills/log_parser/scripts"))
from parse import parse_log_line

class TestLogParserSkill(unittest.TestCase):
    def test_apache_parsing(self):
        line = '127.0.0.1 - - [23/May/2026:12:00:00 -0700] "GET /index.html HTTP/1.1" 200 1024'
        res = parse_log_line(line)
        self.assertIsInstance(res, dict)
        self.assertEqual(res.get("status"), 200)
        self.assertEqual(res.get("ip"), "127.0.0.1")

    def test_json_parsing(self):
        line = '{"ip": "10.0.0.1", "status": 404, "message": "Not Found"}'
        res = parse_log_line(line)
        self.assertIsInstance(res, dict)
        self.assertEqual(res.get("status"), 404)
        self.assertEqual(res.get("ip"), "10.0.0.1")

if __name__ == "__main__":
    unittest.main()
