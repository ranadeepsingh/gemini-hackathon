import unittest
from healer import TradeStream

class TestAnomalyDetector(unittest.TestCase):
    def test_leak_resolution(self):
        stream = TradeStream()
        for i in range(100):
            stream.handle_event(i)
        # In the starter code, active_connections retains 100 elements.
        # It must clean up connections, flatlining memory leak growth (size should be 0 or small constant).
        self.assertEqual(len(stream.active_connections), 0, "Memory leak detected: Active connections are not being disposed of.")

    def test_handle_event_returns_processed_string(self):
        stream = TradeStream()
        res = stream.handle_event("test_event_123")
        self.assertEqual(res, "Processed test_event_123", f"Expected processed string back from handle_event, got: {res}")

    def test_multiple_consecutive_event_runs_leak_check(self):
        stream = TradeStream()
        for i in range(1000):
            stream.handle_event(f"consecutive_run_{i}")
        self.assertEqual(len(stream.active_connections), 0, "Memory leak detected after 1000 consecutive runs.")

    def test_active_connections_initially_empty(self):
        stream = TradeStream()
        self.assertEqual(len(stream.active_connections), 0, "New TradeStream instances must start with zero active connections.")

    def test_active_connections_is_list(self):
        stream = TradeStream()
        self.assertIsInstance(stream.active_connections, list, "TradeStream.active_connections must be a list.")

if __name__ == "__main__":
    unittest.main()
