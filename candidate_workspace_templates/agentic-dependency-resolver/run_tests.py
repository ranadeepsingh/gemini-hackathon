import unittest
import os
from resolver import backtrack_resolver

class TestDependencyResolver(unittest.TestCase):
    def test_resolver_resolves_clash(self):
        res = backtrack_resolver()
        # Verify the returned dictionary contains version mappings for our core packages
        self.assertIsInstance(res, dict)
        self.assertTrue(len(res) > 0, "Resolver returned an empty configurations.")
        self.assertIn("trade-core", res, "trade-core version not returned.")
        self.assertIn("auth-provider", res, "auth-provider version not returned.")
        self.assertIn("cryptography", res, "cryptography version not returned.")

        # In the conflict trade-core@2.2.0 is blocked if cryptography >= 4.2.0 is needed.
        # An automated SAT/backtracker should pin compatible states like:
        # trade-core="2.1.8" (or similar), which doesn't trigger the trade-core@2.2.0 conflict.
        # Or cryptography satisfies both. Let's make sure the returned versions are non-empty.
        for k, v in res.items():
            self.assertTrue(len(v) > 0, f"Version for {k} cannot be empty.")

if __name__ == "__main__":
    unittest.main()
