// WebSocket helper. Uses REACT env var VITE_WS_URL if present.
export function connectWS({ onMessage }) {
  const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8000/ws";
  const ws = new WebSocket(WS_URL);

  ws.addEventListener("open", () => {
    console.log("WS open");
  });

  ws.addEventListener("message", (ev) => {
    try {
      const payload = JSON.parse(ev.data);
      onMessage && onMessage(payload);
    } catch (e) {
      console.warn("Invalid WS message", ev.data);
    }
  });

  ws.addEventListener("close", () => {
    console.log("WS closed");
  });

  ws.addEventListener("error", (err) => {
    console.error("WS error", err);
  });

  // simple keepalive ping every 25s
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: "ping" }));
  }, 25000);

  ws.close = ((origClose) => () => {
    clearInterval(pingInterval);
    origClose.call(ws);
  })(ws.close);

  return ws;
}