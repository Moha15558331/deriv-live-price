const marketSelect = document.getElementById("marketSelect");
const marketName = document.getElementById("marketName");
const symbolElement = document.getElementById("symbol");
const priceElement = document.getElementById("price");
const statusElement = document.getElementById("status");
const statusDot = document.getElementById("statusDot");
const updatedElement = document.getElementById("updated");

const APP_ID = "34GGk6VAHQWY2QDMsCKyZ";
const SOCKET_URL = `wss://ws.derivws.com/websockets/v3?app_id=${APP_ID}`;

let socket = null;
let selectedSymbol = marketSelect.value;
let subscriptionId = null;
let requestNumber = 0;
let reconnectTimer = null;
let manuallyClosed = false;

function setStatus(message, state = "connecting") {
  statusElement.textContent = message;
  statusDot.className = "dot";

  if (state === "connected") {
    statusDot.classList.add("connected");
  } else if (state === "error") {
    statusDot.classList.add("error");
  }
}

function sendRequest(request) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return false;
  }
  socket.send(JSON.stringify(request));
  return true;
}

function getDecimalPlaces(pipSize) {
  if (!Number.isFinite(pipSize) || pipSize <= 0) {
    return 2;
  }

  const text = pipSize.toString();
  if (text.includes("e-")) {
    return Math.min(10, Number(text.split("e-")[1]));
  }
  if (text.includes(".")) {
    return Math.min(10, text.split(".")[1].length);
  }
  return 0;
}

function subscribeToMarket(symbol) {
  const previousSubscription = subscriptionId;
  
  // Clean slate for the new token/symbol setup
  subscriptionId = null;
  selectedSymbol = symbol;

  priceElement.textContent = "Loading...";
  updatedElement.textContent = "—";

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    setStatus("Waiting for connection...");
    return;
  }

  // Explicitly unsubscribe from the old stream using its exact ID
  if (previousSubscription) {
    sendRequest({ forget: previousSubscription });
  }

  const reqId = ++requestNumber;
  setStatus(`Loading ${symbol}...`);

  sendRequest({
    ticks: symbol,
    subscribe: 1,
    req_id: reqId
  });
}

function updateSelectedMarket() {
  const option = marketSelect.options[marketSelect.selectedIndex];
  if (!option) return;

  marketName.textContent = option.textContent;
  symbolElement.textContent = marketSelect.value;

  subscribeToMarket(marketSelect.value);
}

function connect() {
  clearTimeout(reconnectTimer);
  setStatus("Connecting to Deriv...");

  try {
    socket = new WebSocket(SOCKET_URL);
  } catch (error) {
    console.error("WebSocket creation failed:", error);
    setStatus("Could not connect", "error");
    reconnectTimer = setTimeout(connect, 5000);
    return;
  }

  socket.addEventListener("open", () => {
    setStatus("Connected — requesting price");
    subscribeToMarket(selectedSymbol);
  });

  socket.addEventListener("message", (event) => {
    let data;
    try {
      data = JSON.parse(event.data);
    } catch (error) {
      console.error("Invalid server response:", error);
      return;
    }

    if (data.error) {
      console.error("Deriv API error:", data.error);
      setStatus(data.error.message || "API request failed", "error");

      if (data.req_id === requestNumber) {
        priceElement.textContent = "Unavailable";
      }
      return;
    }

    // Capture the subscription ID as soon as it returns from our tick initialization
    if (data.subscription?.id && data.tick?.symbol === selectedSymbol) {
      subscriptionId = data.subscription.id;
    }

    if (data.msg_type !== "tick" || !data.tick) {
      return;
    }

    // Prevent cross-talk UI updates from lagging responses of an old market
    if (data.tick.symbol !== selectedSymbol) {
      return;
    }

    const quote = Number(data.tick.quote);
    if (!Number.isFinite(quote)) {
      setStatus("Invalid price received", "error");
      return;
    }

    const decimals = getDecimalPlaces(Number(data.tick.pip_size));
    priceElement.textContent = quote.toFixed(decimals);
    updatedElement.textContent = new Date().toLocaleTimeString();
    setStatus("Live price connected", "connected");
  });

  socket.addEventListener("error", () => {
    setStatus("Connection error — check API setup", "error");
  });

  socket.addEventListener("close", () => {
    subscriptionId = null;
    if (!manuallyClosed) {
      setStatus("Disconnected — reconnecting...", "error");
      reconnectTimer = setTimeout(connect, 3000);
    }
  });
}

marketSelect.addEventListener("change", updateSelectedMarket);

window.addEventListener("beforeunload", () => {
  manuallyClosed = true;
  clearTimeout(reconnectTimer);

  if (socket && socket.readyState === WebSocket.OPEN) {
    if (subscriptionId) {
      sendRequest({ forget: subscriptionId });
    }
    socket.close();
  }
});

// Run UI labels update on load so it reflects the initial HTML dropdown state immediately
updateSelectedMarket();
connect();
