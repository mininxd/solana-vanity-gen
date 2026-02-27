import { Keypair } from '@solana/web3.js';
import { estimate, vanity } from './lib/libSolana.js';

const keypair = Keypair.generate();
const pubKey = keypair.publicKey.toBase58();

const solanaAddressEl = document.getElementById("solana-address");
const prefixInputEl = document.getElementById("prefix-input");
const suffixInputEl = document.getElementById("suffix-input");

const difficultyEl = document.getElementById("estimate-difficulty");
const speedEl = document.getElementById("estimate-speed");
const timeEl = document.getElementById("estimate-time");
const speedLabel = document.getElementById("speed-label");
const timeLabel = document.getElementById("time-label");
const actualProgressEl = document.getElementById("actual-progress");
const progressBar = document.getElementById("generate-progress-bar");
const caseSensitiveSwitch = document.getElementById("case-sensitive-switch");
const threadsMinusBtn = document.getElementById("threads-minus");
const threadsPlusBtn = document.getElementById("threads-plus");
const threadsValueEl = document.getElementById("threads-value");
const generateBtn = document.getElementById("generate-btn");

const estimateLegend = document.getElementById("estimate-legend");

const resultContainer = document.getElementById("result-container");
const resultAddress = document.getElementById("result-address");
const resultPrivateKey = document.getElementById("result-private-key");
const resultAttempts = document.getElementById("result-attempts");
const resultTime = document.getElementById("result-time");

const maxThreads = navigator.hardwareConcurrency || 4;
let threads = maxThreads;
let currentDifficulty = 1;
threadsValueEl.textContent = threads;

function placeholder(start, end) {
  const wallet = pubKey.slice(
    start.length,
    pubKey.length - end.length
  );

  const startEl = `<span class="font-bold p-0">${start}</span>`;
  const walletEl = `<span class="font-light p-0">${wallet}</span>`;
  const endEl = `<span class="font-bold p-0">${end}</span>`;

  return `${startEl}${walletEl}${endEl}`;
}

function formatAmount(num, simple = false) {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (simple && num >= 1e3) return (num / 1e3).toFixed(2) + "k";
  return Math.floor(num).toLocaleString();
}

function formatTime(seconds) {
  if (seconds === Infinity) return "∞";
  if (seconds < 60) return seconds.toFixed(2) + "s";
  if (seconds < 3600) return (seconds / 60).toFixed(2) + "m";
  if (seconds < 86400) return (seconds / 3600).toFixed(2) + "h";
  return (seconds / 86400).toFixed(2) + "d";
}

let isGenerating = false;

function updateAll(e) {
  if (isGenerating) return;

  // 1. Sanitize input: Only Base58 characters
  const base58Regex = /[^1-9A-HJ-NP-Za-km-z]/g;
  if (e && e.target && (e.target === prefixInputEl || e.target === suffixInputEl)) {
    const cleaned = e.target.value.replace(base58Regex, '');
    if (e.target.value !== cleaned) {
      e.target.value = cleaned;
    }
  }

  let prefix = prefixInputEl.value;
  let suffix = suffixInputEl.value;

  // 2. Enforce total length limit (cannot exceed pubKey.length)
  if (prefix.length + suffix.length > pubKey.length) {
    if (e && e.target === suffixInputEl) {
      suffix = suffix.slice(0, pubKey.length - prefix.length);
      suffixInputEl.value = suffix;
    } else {
      // Default to truncating prefix if it's the target or if no event exists
      prefix = prefix.slice(0, pubKey.length - suffix.length);
      prefixInputEl.value = prefix;
    }
  }

  const caseSensitive = caseSensitiveSwitch.selected;
  
  // Update preview
  solanaAddressEl.innerHTML = placeholder(prefix, suffix);

  // Update estimation
  const est = estimate(prefix, suffix, threads, caseSensitive);
  currentDifficulty = est.difficulty || 1;
  difficultyEl.textContent = formatAmount(currentDifficulty);
  speedEl.textContent = formatAmount(est.attemptsPerSecond, true) + "h/s";
  timeEl.textContent = formatTime(parseFloat(est.expectedTimeSeconds));
  
  speedLabel.textContent = "Speed";
  timeLabel.textContent = "Expected Time";

  if (!isGenerating) {
    actualProgressEl.textContent = "0%";
    progressBar.value = 0;
    estimateLegend.textContent = "Estimated :";
  }

  // Update button states
  threadsMinusBtn.disabled = threads <= 1;
  threadsPlusBtn.disabled = threads >= maxThreads;
}

prefixInputEl.addEventListener("input", updateAll);
suffixInputEl.addEventListener("input", updateAll);

threadsMinusBtn.addEventListener("click", () => {
  if (threads > 1) {
    threads--;
    threadsValueEl.textContent = threads;
    updateAll();
  }
});

threadsPlusBtn.addEventListener("click", () => {
  if (threads < maxThreads) {
    threads++;
    threadsValueEl.textContent = threads;
    updateAll();
  }
});

caseSensitiveSwitch.addEventListener("change", updateAll);

generateBtn.addEventListener("click", async () => {
  const prefix = prefixInputEl.value;
  const suffix = suffixInputEl.value;
  const caseSensitive = caseSensitiveSwitch.selected;

  isGenerating = true;
  generateBtn.disabled = true;
  prefixInputEl.disabled = true;
  suffixInputEl.disabled = true;
  caseSensitiveSwitch.disabled = true;
  threadsMinusBtn.disabled = true;
  threadsPlusBtn.disabled = true;

  generateBtn.textContent = "Generating...";
  estimateLegend.textContent = "Progress :";
  speedLabel.textContent = "Attempts";
  timeLabel.textContent = "Time";
  
  actualProgressEl.textContent = "0%";
  resultContainer.classList.add("hidden");

  const startTime = performance.now();

  try {
    const result = await vanity(prefix, suffix, threads, caseSensitive, (attempts) => {
      // Progress probability formula: 1 - (1 - 1/difficulty)^attempts
      let prob;
      if (currentDifficulty <= 1) {
        prob = 100;
      } else {
        // Use a more numerically stable way for very high difficulties if needed, 
        // but for now this is fine for standard usage.
        prob = (1 - Math.pow(1 - 1/currentDifficulty, attempts)) * 100;
      }
      const probValue = prob / 100;
      actualProgressEl.textContent = (prob < 0.01 ? prob.toPrecision(2) : prob.toFixed(2)) + "%";
      progressBar.value = probValue;

      // Update live stats
      speedEl.textContent = formatAmount(attempts);
      const elapsed = (performance.now() - startTime) / 1000;
      timeEl.textContent = formatTime(elapsed);
    });

    // Format the resulting address with bold prefix/suffix
    const matchedPrefix = result.address.slice(0, prefix.length);
    const matchedSuffix = suffix.length > 0 ? result.address.slice(-suffix.length) : "";
    const middle = result.address.slice(prefix.length, suffix.length > 0 ? -suffix.length : undefined);

    resultAddress.innerHTML = `<span class="font-bold">${matchedPrefix}</span><span class="font-light">${middle}</span><span class="font-bold">${matchedSuffix}</span>`;
    
    resultPrivateKey.textContent = result.privateKey;
    resultAttempts.textContent = formatAmount(result.attempts);
    resultTime.textContent = result.time;
    resultContainer.classList.remove("hidden");
    
    // Final stats update
    actualProgressEl.textContent = "100%";
    progressBar.value = 1;
    speedEl.textContent = formatAmount(result.attempts);
    timeEl.textContent = formatTime(parseFloat(result.time));
    estimateLegend.textContent = "Completed :";
  } catch (err) {
    console.error(err);
    alert("An error occurred during generation. Check the console for details.");
    estimateLegend.textContent = "Error :";
  } finally {
    isGenerating = false;
    generateBtn.disabled = false;
    prefixInputEl.disabled = false;
    suffixInputEl.disabled = false;
    caseSensitiveSwitch.disabled = false;
    generateBtn.textContent = "Generate";
    
    // Update thread buttons state without resetting progress text/legend
    threadsMinusBtn.disabled = threads <= 1;
    threadsPlusBtn.disabled = threads >= maxThreads;
  }
});

// Initial render
updateAll();