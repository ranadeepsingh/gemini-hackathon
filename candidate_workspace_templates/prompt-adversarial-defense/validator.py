def check_adversarial_patterns(query):
    query_lower = query.lower()
    if 'grandma' in query_lower or 'reveal' in query_lower:
        return False
    return True

def inspect_output(response_text):
    response_lower = response_text.lower()
    for sensitive in ['secret_key', 'admin_pwd', 'auth_token']:
        if sensitive in response_lower:
            return 'ACCESS DENIED: Content restricted.'
    return response_text

