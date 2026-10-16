const marketSelect = document.getElementById("marketSelect");
const marketName = document.getElementById("marketName");
const symbolElement = document.getElementById("symbol");
const priceElement = document.getElementById("price");
const statusElement = document.getElementById("status");
const statusDot = document.getElementById("statusDot");
const updatedElement = document.getElementById("updated");

let socket = null;
let selectedSymbol = marketSelect.value;
let subscriptionId = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 12;
let pingInterval = null;

function setStatus(message, state = "connecting") {
  statusElement.textContent = message;
  statusDot.className = "dot";
  if (state === "connected") {
    statusDot.classList.add("connected");
  } else if (state === "error") {
    statusDot.classList.add("error");
  }
}

function connect() {
  // Clean previous connection
  if (socket) {
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    try { socket.close(); } catch (e) {}
  }

  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }

  // Use the old reliable endpoint
  socket = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");

  setStatus("Connecting...", "connecting");
  priceElement.textContent = "Waiting...";

  socket.addEventListener("open", () => {
    console.log("✅ WebSocket connected");
    reconnectAttempts = 0;
    setStatus("Connected — loading price");
    subscribeToMarket(selectedSymbol);

    // Keep-alive ping
    pingInterval = setInterval(() => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ ping: 1 }));
      }
    }, 30000);
  });

  socket.addEventListener("message", (event) => {
    let data;
    try {
      data = JSON.parse(event.data);
    } catch (error) {
      console.error("Failed to parse message:", event.data);
      return;
    }

    if (data.error) {
      console.error("Deriv API error:", data.error);
      setStatus(data.error.message || "API Error", "error");
      priceElement.textContent = "Unavailable";
      return;
    }

    if (data.msg_type === "tick" && data.tick) {
      if (data.tick.symbol !== selectedSymbol) return;

      if (data.subscription && data.subscription.id) {
        subscriptionId = data.subscription.id;
      }

      const decimals = Number(data.tick.pip_size ?? 2);
      priceElement.textContent = Number(data.tick.quote).toFixed(decimals);
      updatedElement.textContent = new Date().toLocaleTimeString();
      setStatus("Live price connected", "connected");
    }
  });

  socket.addEventListener("error", (err) => {
    console.error("WebSocket error:", err);
    setStatus("Connection error", "error");
  });

  socket.addEventListener("close", (event) => {
    console.log("WebSocket closed:", event.code, event.reason);
    subscriptionId = null;
    setStatus("Disconnected — reconnecting...", "error");

    if (pingInterval) {
      clearInterval(pingInterval);
      pingInterval = null;
    }

    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(1000 * Math.pow(1.8, reconnectAttempts), 15000);
      reconnectAttempts++;
      console.log(`Reconnecting in ${Math.round(delay)}ms (attempt ${reconnectAttempts})`);
      setTimeout(connect, delay);
    } else {
      setStatus("Failed to reconnect. Please refresh the page.", "error");
    }
  });
}

function subscribeToMarket(symbol) {
  selectedSymbol = symbol;

  if (!socket || socket.readyState !== WebSocket.OPEN) {
    priceElement.textContent = "Loading...";
    setStatus("Connecting to market...");
    return;
  }

  // Forget previous subscription
  if (subscriptionId) {
    socket.send(JSON.stringify({ forget: subscriptionId }));
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

  if (socket && socket.readyState === WebSocket.OPEN) {
    subscribeToMarket(selectedSymbol);
  } else {
    priceElement.textContent = "Loading...";
    setStatus("Connecting to market...");
  }
}

// Start
connect();

// Market change
marketSelect.addEventListener("change", updateSelectedMarket);