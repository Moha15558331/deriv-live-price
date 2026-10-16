const marketSelect = document.getElementById("market");
const priceElement = document.getElementById("price");
const statusElement = document.getElementById("status");
const dotElement = document.getElementById("dot");
const updatedElement = document.getElementById("updated");
const marketNameElement = document.getElementById("marketName");
const toggleButton = document.getElementById("toggle");
let price = 1000;
let paused = false;
let timer;
function setStatus(message, state) {
  statusElement.textContent = message;
  dotElement.className = "dot " + state;
}
function updatePrice() {
  if (paused) return;
  // Simulated price movement for demonstration.
  price += (Math.random() - 0.5) * 4;
  priceElement.textContent = price.toFixed(2);
  marketNameElement.textContent = marketSelect.value;
  updatedElement.textContent = new Date().toLocaleTimeString();
}
function startDemo() {
  clearInterval(timer);
  price = 1000;
  priceElement.textContent = price.toFixed(2);
  marketNameElement.textContent = marketSelect.value;
  setStatus("Connected — demo mode", "connected");
  updatePrice();
  timer = setInterval(updatePrice, 1000);
}
marketSelect.addEventListener("change", startDemo);
toggleButton.addEventListener("click", () => {
  paused = !paused;
  toggleButton.textContent = paused
    ? "Resume updates"
    : "Pause updates";
  setStatus(
    paused ? "Paused" : "Connected — demo mode",
    paused ? "" : "connected"
  );
  if (!paused) updatePrice();
});
window.addEventListener("beforeunload", () => {
  clearInterval(timer);
});
startDemo();