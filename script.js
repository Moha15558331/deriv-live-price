const marketSelect = document.getElementById("marketSelect");
const marketName = document.getElementById("marketName");
const symbolElement = document.getElementById("symbol");
const priceElement = document.getElementById("price");
const statusElement = document.getElementById("status");
const statusDot = document.getElementById("statusDot");
const updatedElement = document.getElementById("updated");
const socket = new WebSocket(
  "wss://ws.derivws.com/websockets/v3?app_id=34GGk6VAHQWY2QDMsCKyZ"
);
let selectedSymbol = marketSelect.value;
let subscriptions = new Map();
let requestNumber = 0;
let activeRequestId = null;
function setStatus(message, state = "connecting") {
  statusElement.textContent = message;
  statusDot.className = "dot";
  if (state === "connected") {
    statusDot.classList.add("connected");
  } else if (state === "error") {
    statusDot.classList.add("error");
  }
}
function subscribeToMarket(symbol) {
  if (socket.readyState !== WebSocket.OPEN) {
    setStatus("Waiting for connection...");
    return;
  }
  // Unsubscribe from the previous market.
  for (const id of subscriptions.values()) {
    socket.send(JSON.stringify({ forget: id }));
  }
  subscriptions.clear();
  selectedSymbol = symbol;
  activeRequestId = ++requestNumber;
  priceElement.textContent = "Loading...";
  updatedElement.textContent = "—";
  setStatus("Loading " + symbol + "...");
  socket.send(JSON.stringify({
    ticks: symbol,
    subscribe: 1,
    req_id: activeRequestId
  }));
}
function updateSelectedMarket() {
  const option = marketSelect.options[marketSelect.selectedIndex];
  selectedSymbol = marketSelect.value;
  marketName.textContent = option.textContent;
  symbolElement.textContent = selectedSymbol;
  subscribeToMarket(selectedSymbol);
}
socket.addEventListener("open", () => {
  setStatus("Connected — loading price");
  subscribeToMarket(selectedSymbol);
});
socket.addEventListener("message", (event) => {
  let data;
  try {
    data = JSON.parse(event.data);
  } catch (error) {
    return;
  }
  if (data.error) {
    setStatus(data.error.message, "error");
    priceElement.textContent = "Unavailable";
    console.error("Deriv API error:", data.error);
    return;
  }
  if (data.msg_type === "tick" && data.tick) {
    if (data.tick.symbol !== selectedSymbol) {
      return;
    }
    if (data.subscription && data.subscription.id) {
      subscriptions.set(selectedSymbol, data.subscription.id);
    }
    const quote = Number(data.tick.quote);
    const decimals = Number(data.tick.pip_size ?? 2);
    priceElement.textContent = quote.toFixed(decimals);
    updatedElement.textContent = new Date().toLocaleTimeString();
    setStatus("Live price connected", "connected");
  }
});
socket.addEventListener("error", () => {
  setStatus("Connection error — check API setup", "error");
});
socket.addEventListener("close", () => {
  subscriptions.clear();
  setStatus("Disconnected — refresh to reconnect", "error");
});
marketSelect.addEventListener("change", updateSelectedMarket);