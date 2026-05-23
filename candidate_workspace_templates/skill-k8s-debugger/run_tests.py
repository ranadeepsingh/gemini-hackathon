import unittest
import sys
import os

sys.path.append(os.path.abspath("skills/k8s_triage/scripts"))
from triage import triage_pod_state

class TestK8sTriageSkill(unittest.TestCase):
    def test_network_failure_diagnosed(self):
        res = triage_pod_state("Connection refused by database-service:5432")
        self.assertTrue("NETWORK_FAILURE" in res or "DATABASE" in res, f"Expected network diagnostic string, got: {res}")

    def test_rbac_security_blocks_node_deletion(self):
        with self.assertRaises(PermissionError):
            triage_pod_state("Connection refused", action="delete_node")

    def test_empty_logs_handled_safely(self):
        res = triage_pod_state("")
        self.assertTrue("UNKNOWN_CRASH" in res, f"Empty logs should return unknown crash, got: {res}")

    def test_none_logs_handled_safely(self):
        res = triage_pod_state(None)
        self.assertTrue("UNKNOWN_CRASH" in res, f"None logs should return unknown crash, got: {res}")

    def test_skill_markdown_conformance(self):
        skill_path = "skills/k8s_triage/SKILL.md"
        self.assertTrue(os.path.exists(skill_path), "skills/k8s_triage/SKILL.md must exist!")
        with open(skill_path, "r", encoding="utf-8") as f:
            content = f.read()
        self.assertIn("name:", content, "Frontmatter must define a name.")
        self.assertIn("description:", content, "Frontmatter must define a description.")
        self.assertNotIn("k8s_triage_unconfigured", content, "SKILL.md frontmatter must be updated from the starter stub.")
        self.assertNotIn("Kubernetes Sandbox Triage Skill Starter", content, "SKILL.md content must be updated from the starter stub.")

if __name__ == "__main__":
    unittest.main()
