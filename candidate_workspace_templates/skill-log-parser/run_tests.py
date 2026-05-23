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

    def test_skill_markdown_declaration(self):
        skill_path = "skills/log_parser/SKILL.md"
        self.assertTrue(os.path.exists(skill_path), "skills/log_parser/SKILL.md must exist!")
        with open(skill_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("name: log_parser", content, "Frontmatter must define name: log_parser")
        self.assertIn("description:", content, "Frontmatter must define description")
        self.assertNotIn("log_parser_unconfigured", content, "SKILL.md frontmatter must be updated from the starter stub")
        self.assertNotIn("Custom Log Parser Skill Starter", content, "SKILL.md content must be updated from the starter stub")

if __name__ == "__main__":
    unittest.main()
