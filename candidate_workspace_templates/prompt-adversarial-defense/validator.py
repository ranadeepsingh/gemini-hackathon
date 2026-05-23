def check_adversarial_patterns(query):
    query_lower = query.lower()
    if 'grandma' in query_lower or 'reveal' in query_lower:
        return False
    if 'decode' in query_lower or 'rm9yz2v0' in query_lower:
        return False
    if 'ignore previous' in query_lower or 'initialization prompt' in query_lower or 'word for word' in query_lower:
        return False
    return True

def inspect_output(response_text):
    response_lower = response_text.lower()
    for sensitive in ['secret_key', 'admin_pwd', 'auth_token']:
        if sensitive in response_lower:
            return 'ACCESS DENIED: Content restricted.'
    return response_text
