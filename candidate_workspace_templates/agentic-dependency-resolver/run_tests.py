import importlib
import unittest

def require_resolver(testcase):
    try:
        module = importlib.import_module("resolver")
    except Exception as exc:
        testcase.fail(f"resolver.py must import cleanly: {exc}")
    resolver = getattr(module, "backtrack_resolver", None)
    testcase.assertTrue(callable(resolver), "resolver.py must define callable backtrack_resolver().")
    return resolver

class TestDependencyResolver(unittest.TestCase):
    def test_resolver_resolves_clash(self):
        backtrack_resolver = require_resolver(self)
        res = backtrack_resolver()
        self.assertIsInstance(res, dict)
        self.assertTrue(len(res) > 0, "Resolver returned empty configurations.")
        self.assertIn("trade-core", res, "trade-core version not returned.")
        self.assertIn("auth-provider", res, "auth-provider version not returned.")
        self.assertIn("cryptography", res, "cryptography version not returned.")

        for k, v in res.items():
            self.assertTrue(len(v) > 0, f"Version for {k} cannot be empty.")

    def test_trade_core_pinned(self):
        backtrack_resolver = require_resolver(self)
        res = backtrack_resolver()
        self.assertEqual(res.get("trade-core"), "2.1.8", "trade-core version must be pinned exactly to 2.1.8.")

    def test_auth_provider_pinned(self):
        backtrack_resolver = require_resolver(self)
        res = backtrack_resolver()
        self.assertEqual(res.get("auth-provider"), "1.4.2", "auth-provider version must be pinned exactly to 1.4.2.")

    def test_cryptography_pinned(self):
        backtrack_resolver = require_resolver(self)
        res = backtrack_resolver()
        self.assertEqual(res.get("cryptography"), "3.4.7", "cryptography version must be pinned exactly to 3.4.7.")

    def test_result_keys_integrity(self):
        backtrack_resolver = require_resolver(self)
        res = backtrack_resolver()
        expected_keys = {"trade-core", "auth-provider", "cryptography"}
        self.assertEqual(set(res.keys()), expected_keys, f"Returned dict has extra or missing keys. Got: {list(res.keys())}")

if __name__ == "__main__":
    unittest.main()
