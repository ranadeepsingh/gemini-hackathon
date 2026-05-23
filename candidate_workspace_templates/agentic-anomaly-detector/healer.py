import gc
import time

class TradeStream:
    def __init__(self):
        self.active_connections = []

    def handle_event(self, event):
        # Found connection socket leak: connection tags appended without disposal
        conn = f"conn_{time.time()}"
        self.active_connections.append(conn)
        return f"Processed {event}"
