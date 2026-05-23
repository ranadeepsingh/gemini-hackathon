import time
import numpy as np

def process_matrix_multiply(matrix_a, matrix_b):
    # Found single-threaded latency bottleneck
    time.sleep(1.0)
    return np.matmul(matrix_a, matrix_b)
