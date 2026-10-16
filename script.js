const marketSelect = document.getElementById("marketSelect");
const marketName = document.getElementById("marketName");
const symbolElement = document.getElementById("symbol");
const priceElement = document.getElementById("price");
const statusElement = document.getElementById("status");
const statusDot = document.getElementById("statusDot");
const updatedElement = document.getElementById("updated");
const socket = new WebSocket(
  "wss://ws.derivws.com/websockets/v3?app_id=1089"
);
let selectedSymbol = marketSelect.value;
let subscriptionId = null;
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
  selectedSymbol = symbol;
  if (subscriptionId !== null && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify({
      forget: subscriptionId
    }));
    subscriptionId = null;
  }
  priceElement.textContent = "Loading...";
  updatedElement.textContent = "—";
  setStatus("Loading " + symbol + "...");
  socket.send(JSON.stringify({
    ticks: symbol,
    subscribe: 1
  }));
}
function updateSelectedMarket() {
  const option = marketSelect.options[marketSelect.selectedIndex];
  marketName.textContent = option.textContent;
  symbolElement.textContent = marketSelect.value;
  selectedSymbol = marketSelect.value;
  if (socket.readyState === WebSocket.OPEN) {
    subscribeToMarket(selectedSymbol);
  } else {
    priceElement.textContent = "Loading...";
    setStatus("Connecting to market...");
  }
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
      subscriptionId = data.subscription.id;
    }
    const decimals = Number(data.tick.pip_size ?? 2);
    priceElement.textContent = Number(data.tick.quote).toFixed(decimals);
    updatedElement.textContent = new Date().toLocaleTimeString();
    setStatus("Live price connected", "connected");
  }
});
socket.addEventListener("error", () => {
  setStatus("Connection error — check API setup", "error");
});
socket.addEventListener("close", () => {
  subscriptionId = null;
  setStatus("Disconnected — refresh to reconnect", "error");
});
marketSelect.addEventListener("change", updateSelectedMarket);