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

if __name__ == "__main__":
    unittest.main()
