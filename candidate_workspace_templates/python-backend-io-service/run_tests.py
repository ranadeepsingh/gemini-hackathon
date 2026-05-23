import importlib
import json
import unittest

def require_function(testcase, name):
    try:
        module = importlib.import_module("app")
    except Exception as exc:
        testcase.fail(f"app.py must import cleanly: {exc}")
    function = getattr(module, name, None)
    testcase.assertTrue(callable(function), f"app.py must define callable {name}().")
    return function

class TestPythonBackendIOService(unittest.TestCase):
    def test_calculates_weighted_score(self):
        calculate_score = require_function(self, "calculate_score")
        payload = {"inputs": [0.8, 0.6, 1.0], "weights": [2, 1, 1], "threshold": 0.75}
        self.assertEqual(calculate_score(payload), 0.8)

    def test_valid_post_score_request(self):
        handle_request = require_function(self, "handle_request")
        status, response = handle_request(
            "POST",
            "/score",
            json.dumps({"inputs": [1, 0.5, 0.5], "weights": [1, 1, 2], "threshold": 0.6}),
        )
        self.assertEqual(status, 200)
        self.assertEqual(response["score"], 0.625)
        self.assertTrue(response["passed"])

    def test_rejects_invalid_payloads(self):
        handle_request = require_function(self, "handle_request")
        bad_requests = [
            ("POST", "/score", "{not-json"),
            ("POST", "/score", json.dumps({"inputs": [], "weights": []})),
            ("POST", "/score", json.dumps({"inputs": [1, 2], "weights": [1]})),
            ("POST", "/score", json.dumps({"inputs": [1, "oops"], "weights": [1, 1]})),
            ("POST", "/score", json.dumps({"inputs": [1], "weights": [0]})),
        ]

        for method, path, body in bad_requests:
            with self.subTest(body=body):
                status, response = handle_request(method, path, body)
                self.assertEqual(status, 400)
                self.assertIn("error", response)

    def test_rejects_wrong_route(self):
        handle_request = require_function(self, "handle_request")
        self.assertEqual(handle_request("GET", "/score", "{}")[0], 405)
        self.assertEqual(handle_request("POST", "/unknown", "{}")[0], 404)

    def test_default_threshold_conformance(self):
        calculate_score = require_function(self, "calculate_score")
        # Asserts score threshold defaults to 0.75 when omitted in calculating check or handling requests
        payload = {"inputs": [0.8, 0.8, 0.8], "weights": [1, 1, 1]} # score = 0.8, default threshold = 0.75 -> passed
        handle_request = require_function(self, "handle_request")
        status, response = handle_request(
            "POST",
            "/score",
            json.dumps({"inputs": [0.8, 0.8, 0.8], "weights": [1, 1, 1]}), # threshold omitted
        )
        self.assertEqual(status, 200)
        self.assertEqual(response["score"], 0.8)
        self.assertTrue(response["passed"])

if __name__ == "__main__":
    unittest.main()
