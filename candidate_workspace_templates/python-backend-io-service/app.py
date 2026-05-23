import json


def calculate_score(payload):
    # TODO: Compute the weighted score from payload["inputs"] and payload["weights"].
    return 0.0


def handle_request(method, path, body):
    # TODO: Implement the POST /score contract from README.md.
    try:
        payload = json.loads(body or "{}")
    except json.JSONDecodeError:
        payload = {}

    return 200, {
        "score": calculate_score(payload),
        "passed": False,
    }
