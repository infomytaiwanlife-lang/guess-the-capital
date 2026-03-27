// ── Config ──────────────────────────────────────────────────────────────────
const TOTAL_QUESTIONS = 10;
const API_URL = "https://restcountries.com/v3.1/all?fields=name,capital,flags,cca2";

// ── State ────────────────────────────────────────────────────────────────────
let allCountries = [];   // full list fetched from API (filtered to valid entries)
let questions    = [];   // array of question objects for this round
let currentIndex = 0;
let score        = 0;

// ── DOM refs ─────────────────────────────────────────────────────────────────
const loadingScreen  = document.getElementById("loading-screen");
const startScreen    = document.getElementById("start-screen");
const gameScreen     = document.getElementById("game-screen");
const endScreen      = document.getElementById("end-screen");

const startBtn       = document.getElementById("start-btn");
const nextBtn        = document.getElementById("next-btn");
const restartBtn     = document.getElementById("restart-btn");

const flagImg        = document.getElementById("flag-img");
const countryName    = document.getElementById("country-name");
const optionsGrid    = document.getElementById("options-grid");
const feedback       = document.getElementById("feedback");
const feedbackText   = document.getElementById("feedback-text");
const progressBar    = document.getElementById("progress-bar");

const scoreEl        = document.getElementById("score");
const totalEl        = document.getElementById("total");
const qNumEl         = document.getElementById("q-num");
const qTotalEl       = document.getElementById("q-total");
const finalScoreEl   = document.getElementById("final-score");
const finalTotalEl   = document.getElementById("final-total");
const finalMessage   = document.getElementById("final-message");

// ── API Fetch ─────────────────────────────────────────────────────────────────
async function fetchCountries() {
  const response = await fetch(API_URL);
  if (!response.ok) throw new Error(`API error: ${response.status}`);
  const data = await response.json();

  // Only keep countries that have a capital AND a flag image
  return data.filter(
    (c) => c.capital && c.capital.length > 0 && c.flags && c.flags.png
  );
}

// ── Game Logic ────────────────────────────────────────────────────────────────

/**
 * Pick `count` unique random items from an array.
 * Note: This mutates a shallow copy — original array is safe.
 */
function pickRandom(arr, count) {
  const copy = [...arr];
  const result = [];
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

/**
 * Build an array of question objects.
 * Each question has: country, correct capital, and 4 shuffled options.
 */
function buildQuestions(countries, count) {
  const selected = pickRandom(countries, count);

  return selected.map((country) => {
    const correctCapital = country.capital[0];

    // Pick 3 wrong capitals from other countries (no duplicates, no same capital)
    const others = countries
      .filter((c) => c.capital[0] !== correctCapital)
      .map((c) => c.capital[0]);

    const wrongOptions = pickRandom(others, 3);
    const options = shuffle([correctCapital, ...wrongOptions]);

    return {
      country,
      correctCapital,
      options,
    };
  });
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

// ── UI Rendering ──────────────────────────────────────────────────────────────
function showQuestion(question) {
  const { country, correctCapital, options } = question;

  // Update flag & country name
  flagImg.src = country.flags.png;
  flagImg.alt = `Flag of ${country.name.common}`;
  countryName.textContent = country.name.common;

  // Update progress
  const progress = ((currentIndex) / TOTAL_QUESTIONS) * 100;
  progressBar.style.width = `${progress}%`;
  qNumEl.textContent = currentIndex + 1;

  // Clear previous state
  feedback.className = "hidden";
  feedbackText.textContent = "";
  nextBtn.classList.add("hidden");
  optionsGrid.innerHTML = "";

  // Render option buttons
  options.forEach((capital) => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = capital;
    btn.addEventListener("click", () => handleAnswer(btn, capital, correctCapital));
    optionsGrid.appendChild(btn);
  });
}

function handleAnswer(clickedBtn, chosen, correct) {
  // Lock all buttons
  const allBtns = optionsGrid.querySelectorAll(".option-btn");
  allBtns.forEach((btn) => (btn.disabled = true));

  if (chosen === correct) {
    score++;
    scoreEl.textContent = score;
    clickedBtn.classList.add("correct");
    feedbackText.textContent = "✓ Correct!";
    feedback.className = "correct-fb";
  } else {
    clickedBtn.classList.add("wrong");
    // Highlight the correct answer
    allBtns.forEach((btn) => {
      if (btn.textContent === correct) btn.classList.add("correct");
    });
    feedbackText.textContent = `✗ The answer was ${correct}`;
    feedback.className = "wrong-fb";
  }

  nextBtn.classList.remove("hidden");
}

function showEndScreen() {
  gameScreen.classList.add("hidden");
  endScreen.classList.remove("hidden");

  finalScoreEl.textContent = score;
  finalTotalEl.textContent = TOTAL_QUESTIONS;
  finalMessage.textContent = getEndMessage(score, TOTAL_QUESTIONS);
}

function getEndMessage(score, total) {
  const ratio = score / total;
  if (ratio === 1)   return "Perfect score! 🌍";
  if (ratio >= 0.8)  return "Excellent work!";
  if (ratio >= 0.6)  return "Not bad at all!";
  if (ratio >= 0.4)  return "Room to improve.";
  return "Keep studying! 📚";
}

// ── Screens ───────────────────────────────────────────────────────────────────
function show(el) {
  el.classList.remove("hidden");
}

function hide(el) {
  el.classList.add("hidden");
}

function startGame() {
  score        = 0;
  currentIndex = 0;

  scoreEl.textContent = score;
  totalEl.textContent = TOTAL_QUESTIONS;
  qTotalEl.textContent = TOTAL_QUESTIONS;

  questions = buildQuestions(allCountries, TOTAL_QUESTIONS);

  hide(startScreen);
  hide(endScreen);
  show(gameScreen);

  showQuestion(questions[currentIndex]);
}

// ── Event Listeners ───────────────────────────────────────────────────────────
startBtn.addEventListener("click", startGame);
restartBtn.addEventListener("click", startGame);

nextBtn.addEventListener("click", () => {
  currentIndex++;
  if (currentIndex >= TOTAL_QUESTIONS) {
    showEndScreen();
  } else {
    showQuestion(questions[currentIndex]);
  }
});

// ── Init ──────────────────────────────────────────────────────────────────────
(async () => {
  try {
    allCountries = await fetchCountries();

    hide(loadingScreen);
    show(startScreen);
  } catch (err) {
    loadingScreen.innerHTML = `
      <div class="loader-text" style="color:#f87171">
        Failed to load countries.<br>Check your connection and refresh.
      </div>
    `;
    console.error(err);
  }
})();
