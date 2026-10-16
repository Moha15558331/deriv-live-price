
const marketSelect = document.getElementById("marketSelect");
const marketName = document.getElementById("marketName");
const symbolElement = document.getElementById("symbol");
const priceElement = document.getElementById("price");
const statusElement = document.getElementById("status");
const statusDot = document.getElementById("statusDot");
const updatedElement = document.getElementById("updated");

let selectedSymbol = marketSelect.value;
let currentPrice = 0;
let priceTimer = null;

const settings = {
  "1HZ10V": { start: 1000, decimals: 2 },
  "1HZ15V": { start: 1500, decimals: 2 },
  "1HZ25V": { start: 2500, decimals: 2 },
  "1HZ30V": { start: 3000, decimals: 2 },
  "1HZ50V": { start: 5000, decimals: 2 },
  "1HZ75V": { start: 7500, decimals: 2 },
  "1HZ90V": { start: 9000, decimals: 2 },
  "1HZ100V": { start: 10000, decimals: 2 },
  "R_10": { start: 1000, decimals: 3 },
  "R_25": { start: 2500, decimals: 3 },
  "R_50": { start: 5000, decimals: 4 },
  "R_75": { start: 7500, decimals: 4 },
  "R_100": { start: 10000, decimals: 2 },
  "BOOM1000": { start: 1000, decimals: 2 },
  "BOOM500": { start: 500, decimals: 2 },
  "CRASH1000": { start: 1000, decimals: 2 },
  "CRASH500": { start: 500, decimals: 2 },
  "stpRNG": { start: 1000, decimals: 2 },
  "frxEURUSD": { start: 1.08, decimals: 5 },
  "frxGBPUSD": { start: 1.27, decimals: 5 },
  "frxUSDJPY": { start: 150, decimals: 3 },
  "cryBTCUSD": { start: 60000, decimals: 2 },
  "cryETHUSD": { start: 3000, decimals: 2 },
  "frxXAUUSD": { start: 2700, decimals: 2 }
};

function setStatus(message, state) {
  statusElement.textContent = message;
  statusDot.className = "dot";

  if (state === "connected") {
    statusDot.classList.add("connected");
  } else if (state === "error") {
    statusDot.classList.add("error");
  }
}

function updatePrice() {
  const market = settings[selectedSymbol];

  if (!market) {
    priceElement.textContent = "Unavailable";
    setStatus("No preview data configured", "error");
    return;
  }

  // Random movement for interface testing only.
  const movement = (Math.random() - 0.5) * market.start * 0.0002;
  currentPrice = Math.max(0.00001, currentPrice + movement);

  priceElement.textContent = currentPrice.toFixed(market.decimals);
  updatedElement.textContent = new Date().toLocaleTimeString();

  setStatus("Sample data — not connected to Deriv", "error");
}

function selectMarket() {
  const option = marketSelect.options[marketSelect.selectedIndex];
  selectedSymbol = marketSelect.value;

  marketName.textContent = option.textContent;
  symbolElement.textContent = selectedSymbol;

  const market = settings[selectedSymbol];
  currentPrice = market ? market.start : 1000;

  clearInterval(priceTimer);
  updatePrice();
  priceTimer = setInterval(updatePrice, 1000);
}

marketSelect.addEventListener("change", selectMarket);

selectMarket();
