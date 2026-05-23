import re

def audit_sql_query(query):
    if query is None:
        return ""
    if "create index" in query.lower() and "concurrently" not in query.lower():
        # Match 'create index' case-insensitively and replace preserving rest of query
        return re.sub(r'(?i)create index', 'CREATE INDEX CONCURRENTLY', query)
    return query

def generate_rollback_sql(query):
    if query is None:
        return "DROP INDEX CONCURRENTLY;"
    m = re.search(r'(?i)index\s+(\w+)', query)
    if m:
        return f"DROP INDEX CONCURRENTLY IF EXISTS {m.group(1)};"
    return "DROP INDEX CONCURRENTLY;"
