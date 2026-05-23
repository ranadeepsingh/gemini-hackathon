import time
import numpy as np

def process_matrix_multiply(matrix_a, matrix_b):
    # TODO: Remove the artificial demo latency while preserving np.matmul output.
    time.sleep(1.0)
    return np.matmul(matrix_a, matrix_b)
