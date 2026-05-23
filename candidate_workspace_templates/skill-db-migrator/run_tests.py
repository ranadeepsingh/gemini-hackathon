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

if __name__ == "__main__":
    unittest.main()
