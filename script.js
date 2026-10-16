
const priceElement = document.getElementById("price");

const socket = new WebSocket(
  "wss://api.derivws.com/trading/v1/options/ws/public"
);

socket.onopen = () => {
  priceElement.textContent = "Connected. Loading price...";

  socket.send(JSON.stringify({
    ticks: "R_100",
    subscribe: 1
  }));
};

socket.onmessage = (event) => {
  const message = JSON.parse(event.data);

  if (message.tick) {
    priceElement.textContent = message.tick.quote;
  }

  if (message.error) {
    priceElement.textContent = "Error: " + message.error.message;
  }
};

socket.onerror = () => {
  priceElement.textContent = "Connection error";
};

socket.onclose = () => {
  priceElement.textContent = "Disconnected";
};
