let ws:
  | typeof WebSocket
  | typeof global.WebSocket
  | typeof window.WebSocket
  | typeof self.WebSocket =
  WebSocket || global.WebSocket || window.WebSocket || self.WebSocket;

if (!ws) {
  throw new Error("WebSocket is not supported by this browser.");
}

export default ws;
