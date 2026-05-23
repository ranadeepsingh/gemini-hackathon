import numpy as np

class MatrixResult(list):
    @property
    def shape(self):
        return (len(self), len(self[0]) if self else 0)

    def tolist(self):
        return [list(row) for row in self]

def _manual_matmul(matrix_a, matrix_b):
    rows = len(matrix_a)
    cols = len(matrix_b[0]) if matrix_b else 0
    inner = len(matrix_b)
    return MatrixResult([
        [sum(matrix_a[row][idx] * matrix_b[idx][col] for idx in range(inner)) for col in range(cols)]
        for row in range(rows)
    ])

def process_matrix_multiply(matrix_a, matrix_b):
    matmul = getattr(np, "matmul", None)
    if matmul:
        return matmul(matrix_a, matrix_b)
    return _manual_matmul(matrix_a, matrix_b)
