
const marketSelect = document.getElementById("marketSelect");
const marketName = document.getElementById("marketName");
const symbolElement = document.getElementById("symbol");
const priceElement = document.getElementById("price");
const statusElement = document.getElementById("status");
const statusDot = document.getElementById("statusDot");
const updatedElement = document.getElementById("updated");

let selectedSymbol = marketSelect.value;
let timer = null;
let currentPrice = 1000;

const marketSettings = {
  "1HZ10V":  { price: 1000, decimals: 2 },
  "1HZ15V":  { price: 1500, decimals: 2 },
  "1HZ25V":  { price: 2500, decimals: 2 },
  "1HZ30V":  { price: 3000, decimals: 2 },
  "1HZ50V":  { price: 5000, decimals: 2 },
  "1HZ75V":  { price: 7500, decimals: 2 },
  "1HZ90V":  { price: 9000, decimals: 2 },
  "1HZ100V": { price: 10000, decimals: 2 },
  "R_10":    { price: 1000, decimals: 3 },
  "R_25":    { price: 2500, decimals: 3 },
  "R_50":    { price: 5000, decimals: 3 },
  "R_75":    { price: 7500, decimals: 3 },
  "R_100":   { price: 10000, decimals: 2 },
  "BOOM1000": { price: 1000, decimals: 2 },
  "BOOM500":  { price: 500, decimals: 2 },
  "CRASH1000": { price: 1000, decimals: 2 },
  "CRASH500":  { price: 500, decimals: 2 },
  "stpRNG": { price: 1000, decimals: 2 },
  "frxEURUSD": { price: 1.08, decimals: 5 },
  "frxGBPUSD": { price: 1.27, decimals: 5 },
  "frxUSDJPY": { price: 150, decimals: 3 },
  "cryBTCUSD": { price: 60000, decimals: 2 },
  "cryETHUSD": { price: 3000, decimals: 2 },
  "frxXAUUSD": { price: 2700, decimals: 2 }
};

function setStatus(message, state = "connecting") {
  statusElement.textContent = message;
  statusDot.className = "dot";

  if (state === "connected") {
    statusDot.classList.add("connected");
  } else if (state === "error") {
    statusDot.classList.add("error");
  }
}

function updatePrice() {
  const settings = marketSettings[selectedSymbol];

  if (!settings) {
    priceElement.textContent = "Unavailable";
    setStatus("No sample data configured", "error");
    return;
  }

  // SIMULATION ONLY — these are not real market prices.
  const movement = (Math.random() - 0.5) * settings.price * 0.0002;
  currentPrice = Math.max(0.00001, currentPrice + movement);

  priceElement.textContent = currentPrice.toFixed(settings.decimals);
  updatedElement.textContent = new Date().toLocaleTimeString();

  setStatus("Sample data — not live", "error");
}

function selectMarket() {
  const option = marketSelect.options[marketSelect.selectedIndex];

  selectedSymbol = marketSelect.value;
  marketName.textContent = option.textContent;
  symbolElement.textContent = selectedSymbol;

  const settings = marketSettings[selectedSymbol];
  currentPrice = settings ? settings.price : 1000;

  clearInterval(timer);

  priceElement.textContent = "Loading sample...";
  updatedElement.textContent = "—";
  setStatus("Preparing sample data...");

  updatePrice();
  timer = setInterval(updatePrice, 1000);
}

marketSelect.addEventListener("change", selectMarket);

selectMarket();
