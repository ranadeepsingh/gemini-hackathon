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
        self.assertTrue(len(res) > 0, "Resolver returned an empty configurations.")
        self.assertIn("trade-core", res, "trade-core version not returned.")
        self.assertIn("auth-provider", res, "auth-provider version not returned.")
        self.assertIn("cryptography", res, "cryptography version not returned.")

        for k, v in res.items():
            self.assertTrue(len(v) > 0, f"Version for {k} cannot be empty.")


if __name__ == "__main__":
    unittest.main()
