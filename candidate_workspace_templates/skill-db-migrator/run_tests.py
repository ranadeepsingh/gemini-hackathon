import unittest
import sys
import os

sys.path.append(os.path.abspath("skills/schema_migrator/scripts"))
from migrate import audit_sql_query, generate_rollback_sql

class TestDBMigratorSkill(unittest.TestCase):
    def test_concurrency_rewrite(self):
        query = "CREATE INDEX idx_users_email ON users(email);"
        res = audit_sql_query(query)
        self.assertTrue("concurrently" in res.lower(), f"Indexes must be created CONCURRENTLY to prevent blocking locks. Got: {res}")

    def test_rollback_generation(self):
        query = "CREATE INDEX idx_users_email ON users(email);"
        res = generate_rollback_sql(query)
        self.assertTrue("drop index concurrently" in res.lower() and "idx_users_email" in res.lower(), f"Rollback query invalid. Got: {res}")

    def test_already_concurrent_queries_unchanged(self):
        query = "CREATE INDEX CONCURRENTLY idx_users_email ON users(email);"
        res = audit_sql_query(query)
        self.assertEqual(res, query, f"Already concurrent index creation query should not be changed. Got: {res}")

    def test_non_create_index_queries_unchanged(self):
        query = "SELECT * FROM users WHERE email = 'test@example.com';"
        res = audit_sql_query(query)
        self.assertEqual(res, query, f"SELECT query should remain completely untouched. Got: {res}")

    def test_skill_markdown_conformance(self):
        skill_path = "skills/schema_migrator/SKILL.md"
        self.assertTrue(os.path.exists(skill_path), "skills/schema_migrator/SKILL.md must exist!")
        with open(skill_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("name:", content, "Frontmatter must define a name.")
        self.assertIn("description:", content, "Frontmatter must define a description.")
        self.assertNotIn("schema_migrator_unconfigured", content, "SKILL.md frontmatter must be updated from the starter stub.")
        self.assertNotIn("Database Schema Migrator Skill Starter", content, "SKILL.md content must be updated from the starter stub.")

if __name__ == "__main__":
    unittest.main()
