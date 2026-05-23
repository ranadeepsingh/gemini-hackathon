import unittest
import time
import numpy as np
from matrix_processor import process_matrix_multiply

class TestMatrixOptimizer(unittest.TestCase):
    def test_correctness(self):
        a = [[float(row * 10 + col) for col in range(10)] for row in range(10)]
        b = [[1.0 if row == col else 0.0 for col in range(10)] for row in range(10)]
        res = process_matrix_multiply(a, b)
        self.assertEqual(res.shape, (10, 10))
        self.assertEqual(res.tolist(), a)

    def test_latency_is_optimized(self):
        a = [[float(row * 50 + col) for col in range(50)] for row in range(50)]
        b = [[1.0 if row == col else 0.0 for col in range(50)] for row in range(50)]
        start = time.time()
        # Call it twice to catch any accidental artificial delay.
        res1 = process_matrix_multiply(a, b)
        res2 = process_matrix_multiply(a, b)
        duration = time.time() - start
        self.assertTrue(duration < 0.5, f"Latency is too high: {duration:.2f}s. Remove artificial sleeps and preserve np.matmul output.")

if __name__ == "__main__":
    unittest.main()
