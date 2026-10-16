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
const MAX_RECONNECT_ATTEMPTS = 10;

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
  // Close existing connection if any
  if (socket) {
    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    socket.close();
  }

  // NEW recommended public endpoint (no app_id needed)
  socket = new WebSocket("wss://api.derivws.com/trading/v1/options/ws/public");

  setStatus("Connecting...", "connecting");

  socket.addEventListener("open", () => {
    console.log("WebSocket connected");
    reconnectAttempts = 0;
    setStatus("Connected — loading price", "connecting");
    subscribeToMarket(selectedSymbol);

    // Keep-alive ping every 30 seconds
    if (window.pingInterval) clearInterval(window.pingInterval);
    window.pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
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

    // Always log errors clearly
    if (data.error) {
      console.error("Deriv API error:", data.error);
      setStatus(data.error.message || "API Error", "error");
      priceElement.textContent = "Unavailable";
      return;
    }

    // Handle tick updates
    if (data.msg_type === "tick" && data.tick) {
      if (data.tick.symbol !== selectedSymbol) return;

      if (data.subscription?.id) {
        subscriptionId = data.subscription.id;
      }

      const decimals = Number(data.tick.pip_size ?? 2);
      priceElement.textContent = Number(data.tick.quote).toFixed(decimals);
      updatedElement.textContent = new Date().toLocaleTimeString();
      setStatus("Live price connected", "connected");
    }

    // Optional: log other useful messages
    if (data.msg_type === "ping") {
      // pong received, connection is alive
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

    if (window.pingInterval) {
      clearInterval(window.pingInterval);
    }

    // Auto-reconnect with backoff
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 15000);
      reconnectAttempts++;
      console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts})`);
      setTimeout(connect, delay);
    } else {
      setStatus("Failed to reconnect. Refresh the page.", "error");
    }
  });
}

function subscribeToMarket(symbol) {
  selectedSymbol = symbol;

  if (socket?.readyState !== WebSocket.OPEN) {
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

  if (socket?.readyState === WebSocket.OPEN) {
    subscribeToMarket(selectedSymbol);
  } else {
    priceElement.textContent = "Loading...";
    setStatus("Connecting to market...");
  }
}

// Start connection
connect();

// Market change listener
marketSelect.addEventListener("change", updateSelectedMarket);