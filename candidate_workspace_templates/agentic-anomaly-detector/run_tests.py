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

if __name__ == "__main__":
    unittest.main()
