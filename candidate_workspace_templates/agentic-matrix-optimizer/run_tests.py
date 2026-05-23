import unittest
import time
import numpy as np
from matrix_processor import process_matrix_multiply

class TestMatrixOptimizer(unittest.TestCase):
    def test_correctness(self):
        a = np.random.rand(10, 10)
        b = np.random.rand(10, 10)
        res = process_matrix_multiply(a, b)
        self.assertEqual(res.shape, (10, 10))
        np.testing.assert_allclose(res, np.matmul(a, b))

    def test_latency_is_optimized(self):
        a = np.random.rand(50, 50)
        b = np.random.rand(50, 50)
        start = time.time()
        # Call it twice to check if caching or parallelization works
        res1 = process_matrix_multiply(a, b)
        res2 = process_matrix_multiply(a, b)
        duration = time.time() - start
        # The starter code sleeps for 1 second per call, total 2.0s.
        # An optimized solution using multithreading chunking and caching should execute in < 0.1s!
        self.assertTrue(duration < 0.5, f"Latency is too high: {duration:.2f}s. Ensure caching or multithreading is active.")

if __name__ == "__main__":
    unittest.main()
