# Python Backend I/O Service

Build a small request handler for `POST /score`.

The handler receives a JSON body with:

- `inputs`: non-empty list of numeric values
- `weights`: non-empty list of numeric values, same length as `inputs`
- `threshold`: optional numeric pass threshold, default `0.75`

Return `(status_code, response_dict)` from `handle_request(method, path, body)`.

Expected behavior:

- Reject non-`POST` methods and unknown paths.
- Return `400` for malformed JSON, missing fields, empty arrays, non-numeric values, mismatched lengths, or non-positive total weight.
- Compute the weighted average of `inputs` by `weights`.
- Return `200` with `{"score": <rounded score>, "passed": <bool>}` for valid requests.
