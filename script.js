const priceElement = document.getElementById("price");
const statusElement = document.getElementById("connectionStatus");
const statusDot = document.getElementById("statusDot");
const lastUpdateElement = document.getElementById("lastUpdate");
const connectionDetail = document.getElementById("connectionDetail");
function setStatus(text, color, detail) {
  statusElement.textContent = text;
  statusDot.style.background = color;
  connectionDetail.textContent = detail;
}
const socket = new WebSocket(
  "wss://api.derivws.com/trading/v1/options/ws/public"
);
setStatus("Connecting...", "#fbbf24", "Connecting");
socket.onopen = () => {
  setStatus("Connected", "#34d399", "WebSocket open");
  priceElement.textContent = "Waiting for data...";
  socket.send(JSON.stringify({
    ticks: "R_100",
    subscribe: 1
  }));
};
socket.onmessage = (event) => {
  let message;
  try {
    message = JSON.parse(event.data);
  } catch {
    connectionDetail.textContent = "Invalid server response";
    return;
  }
  if (message.error) {
    setStatus("Server error", "#f87171", message.error.message);
    return;
  }
  if (message.tick) {
    priceElement.textContent = message.tick.quote;
    lastUpdateElement.textContent =
      new Date().toLocaleTimeString();
    setStatus("Live data received", "#34d399", "Receiving updates");
  }
};
socket.onerror = () => {
  setStatus("Connection error", "#f87171", "Socket error");
};
socket.onclose = (event) => {
  setStatus("Disconnected", "#f87171", `Closed (${event.code})`);
};