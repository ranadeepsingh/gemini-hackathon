class TradeStream:
    def __init__(self):
        self.active_connections = []

    def handle_event(self, event):
        return f"Processed {event}"
