def triage_pod_state(pod_logs, action="inspect"):
    if action == "delete_node":
        raise PermissionError("Access Denied: Administrative operations blocked.")
    if pod_logs is None:
        return "UNKNOWN_CRASH: None logs"
    if "Connection refused" in pod_logs:
        return "NETWORK_FAILURE: DB unavailable"
    return "UNKNOWN_CRASH: Stacktrace parsed"
