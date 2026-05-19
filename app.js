const verbs = [
  { base: "be", past: ["was", "were", "was / were", "was/were"], participle: ["been"] },
  { base: "have", past: ["had"], participle: ["had"] },
  { base: "do", past: ["did"], participle: ["done"] },
  { base: "say", past: ["said"], participle: ["said"] },
  { base: "go", past: ["went"], participle: ["gone"] },
  { base: "get", past: ["got"], participle: ["got", "gotten"] },
  { base: "make", past: ["made"], participle: ["made"] },
  { base: "know", past: ["knew"], participle: ["known"] },
  { base: "think", past: ["thought"], participle: ["thought"] },
  { base: "take", past: ["took"], participle: ["taken"] },
  { base: "see", past: ["saw"], participle: ["seen"] },
  { base: "come", past: ["came"], participle: ["come"] },
  { base: "find", past: ["found"], participle: ["found"] },
  { base: "give", past: ["gave"], participle: ["given"] },
  { base: "tell", past: ["told"], participle: ["told"] },
  { base: "become", past: ["became"], participle: ["become"] },
  { base: "show", past: ["showed"], participle: ["shown", "showed"] },
  { base: "leave", past: ["left"], participle: ["left"] },
  { base: "feel", past: ["felt"], participle: ["felt"] },
  { base: "put", past: ["put"], participle: ["put"] }
];

const trophyDefinitions = [
  { id: "firstQuest", name: "First Quest", detail: "Finish one practice round.", check: (run, history) => history.length >= 1 },
  { id: "starCatcher", name: "Star Catcher", detail: "Score 300 points in a round.", check: (run) => run.score >= 300 },
  { id: "perfectPilot", name: "Perfect Pilot", detail: "Get every verb right.", check: (run) => run.correct === verbs.length },
  { id: "speedSpark", name: "Speed Spark", detail: "Finish in under 2 minutes.", check: (run) => run.seconds <= 120 },
  { id: "streakHero", name: "Streak Hero", detail: "Reach a streak of 5.", check: (run) => run.bestStreak >= 5 },
  { id: "levelUp", name: "Level Up", detail: "Beat your last score.", check: (run, history) => history.length > 1 && run.score > history[1].score }
];

const state = {
  order: [],
  index: 0,
  score: 0,
  correct: 0,
  streak: 0,
  bestStreak: 0,
  startedAt: 0,
  timerId: 0,
  locked: false
};

const els = {
  progressText: document.querySelector("#progressText"),
  scoreText: document.querySelector("#scoreText"),
  streakText: document.querySelector("#streakText"),
  timerText: document.querySelector("#timerText"),
  progressBar: document.querySelector("#progressBar"),
  baseVerb: document.querySelector("#baseVerb"),
  verbInitial: document.querySelector("#verbInitial"),
  pastInput: document.querySelector("#pastInput"),
  participleInput: document.querySelector("#participleInput"),
  answerForm: document.querySelector("#answerForm"),
  feedback: document.querySelector("#feedback"),
  playScreen: document.querySelector("#playScreen"),
  resultScreen: document.querySelector("#resultScreen"),
  resultTitle: document.querySelector("#resultTitle"),
  resultSummary: document.querySelector("#resultSummary"),
  awardsList: document.querySelector("#awardsList"),
  playAgainButton: document.querySelector("#playAgainButton"),
  leaderboardList: document.querySelector("#leaderboardList"),
  clearScoresButton: document.querySelector("#clearScoresButton"),
  trophyGrid: document.querySelector("#trophyGrid"),
  verbChips: document.querySelector("#verbChips")
};

function normalize(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5);
}

function getHistory() {
  return JSON.parse(localStorage.getItem("verbQuestHistory") || "[]");
}

function saveHistory(history) {
  localStorage.setItem("verbQuestHistory", JSON.stringify(history));
}

function getEarnedTrophies() {
  return JSON.parse(localStorage.getItem("verbQuestTrophies") || "[]");
}

function saveEarnedTrophies(trophies) {
  localStorage.setItem("verbQuestTrophies", JSON.stringify(trophies));
}

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function elapsedSeconds() {
  return Math.max(0, Math.floor((Date.now() - state.startedAt) / 1000));
}

function updateTimer() {
  els.timerText.textContent = formatTime(elapsedSeconds());
}

function renderQuestion() {
  const current = state.order[state.index];
  state.locked = false;
  els.progressText.textContent = `${state.index + 1} / ${verbs.length}`;
  els.scoreText.textContent = state.score;
  els.streakText.textContent = state.streak;
  els.progressBar.style.width = `${((state.index + 1) / verbs.length) * 100}%`;
  els.baseVerb.textContent = current.base;
  els.verbInitial.textContent = current.base[0];
  els.pastInput.value = "";
  els.participleInput.value = "";
  els.feedback.textContent = "";
  els.feedback.className = "feedback";
  els.pastInput.focus();
}

function accepted(value, answers) {
  return answers.map(normalize).includes(normalize(value));
}

function answerText(answers) {
  return answers[0].replace(" / ", " or ");
}

function handleAnswer(event) {
  event.preventDefault();
  if (state.locked) return;
  state.locked = true;
  const current = state.order[state.index];
  const pastOk = accepted(els.pastInput.value, current.past);
  const participleOk = accepted(els.participleInput.value, current.participle);
  const bothOk = pastOk && participleOk;

  if (bothOk) {
    state.correct += 1;
    state.streak += 1;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
    state.score += 10 + Math.min(state.streak * 2, 10);
    els.feedback.textContent = `Yes! ${current.base}, ${answerText(current.past)}, ${answerText(current.participle)}. Bonus points for your streak.`;
    els.feedback.classList.add("correct");
  } else {
    state.streak = 0;
    els.feedback.textContent = `Close! The answer is: ${current.base}, ${answerText(current.past)}, ${answerText(current.participle)}.`;
    els.feedback.classList.add("miss");
  }

  els.scoreText.textContent = state.score;
  els.streakText.textContent = state.streak;
  setTimeout(nextQuestion, 1050);
}

function nextQuestion() {
  state.index += 1;
  if (state.index >= verbs.length) {
    finishRound();
    return;
  }
  renderQuestion();
}

function getGrade(correct) {
  if (correct === verbs.length) return "Legendary!";
  if (correct >= 16) return "Brilliant work!";
  if (correct >= 12) return "Strong quest!";
  if (correct >= 8) return "Good practice!";
  return "Keep training!";
}

function finishRound() {
  clearInterval(state.timerId);
  const run = {
    date: new Date().toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
    score: state.score,
    correct: state.correct,
    seconds: elapsedSeconds(),
    bestStreak: state.bestStreak
  };
  const history = [run, ...getHistory()].slice(0, 12);
  saveHistory(history);

  const earnedBefore = getEarnedTrophies();
  const newAwards = trophyDefinitions
    .filter((trophy) => !earnedBefore.includes(trophy.id) && trophy.check(run, history))
    .map((trophy) => trophy.id);
  saveEarnedTrophies([...earnedBefore, ...newAwards]);

  els.playScreen.classList.remove("active");
  els.resultScreen.classList.add("active");
  els.resultTitle.textContent = getGrade(run.correct);
  els.resultSummary.textContent = `You scored ${run.score} points, answered ${run.correct} of ${verbs.length} verbs correctly, and finished in ${formatTime(run.seconds)}.`;
  renderAwards(newAwards);
  renderLeaderboard();
  renderTrophies();
}

function trophySvg() {
  return `
    <svg class="trophy-icon" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M18 10h28v12c0 11-6 19-14 19S18 33 18 22V10z" fill="currentColor"/>
      <path d="M18 16H8c0 13 7 20 16 20v-8c-5 0-8-4-8-12h2zm28 0h10c0 13-7 20-16 20v-8c5 0 8-4 8-12h-2z" fill="currentColor" opacity=".68"/>
      <path d="M27 40h10v10h11v6H16v-6h11z" fill="currentColor"/>
    </svg>
  `;
}

function renderAwards(newAwards) {
  if (newAwards.length === 0) {
    els.awardsList.innerHTML = `<span class="award-pill">Practice points saved</span>`;
    return;
  }
  els.awardsList.innerHTML = newAwards
    .map((id) => {
      const trophy = trophyDefinitions.find((item) => item.id === id);
      return `<span class="award-pill">New award: ${trophy.name}</span>`;
    })
    .join("");
}

function renderLeaderboard() {
  const history = getHistory();
  if (!history.length) {
    els.leaderboardList.innerHTML = `<li class="empty-state">Your practice rounds will appear here.</li>`;
    return;
  }

  const ranked = [...history]
    .sort((a, b) => b.score - a.score || a.seconds - b.seconds)
    .slice(0, 6);

  els.leaderboardList.innerHTML = ranked
    .map(
      (run, index) => `
        <li class="leader-entry">
          <span class="rank">${index + 1}</span>
          <span class="leader-meta">
            <strong>${run.score} pts</strong>
            <span>${run.correct}/${verbs.length} correct - ${formatTime(run.seconds)} - ${run.date}</span>
          </span>
        </li>
      `
    )
    .join("");
}

function renderTrophies() {
  const earned = getEarnedTrophies();
  els.trophyGrid.innerHTML = trophyDefinitions
    .map(
      (trophy) => `
        <article class="trophy ${earned.includes(trophy.id) ? "earned" : ""}">
          ${trophySvg()}
          <strong>${trophy.name}</strong>
          <span>${trophy.detail}</span>
        </article>
      `
    )
    .join("");
}

function renderVerbChips() {
  els.verbChips.innerHTML = verbs.map((verb) => `<span>${verb.base}</span>`).join("");
}

function startRound() {
  state.order = shuffle(verbs);
  state.index = 0;
  state.score = 0;
  state.correct = 0;
  state.streak = 0;
  state.bestStreak = 0;
  state.startedAt = Date.now();
  state.locked = false;
  clearInterval(state.timerId);
  state.timerId = setInterval(updateTimer, 1000);
  updateTimer();
  els.resultScreen.classList.remove("active");
  els.playScreen.classList.add("active");
  renderQuestion();
}

els.answerForm.addEventListener("submit", handleAnswer);
els.playAgainButton.addEventListener("click", startRound);
els.clearScoresButton.addEventListener("click", () => {
  localStorage.removeItem("verbQuestHistory");
  localStorage.removeItem("verbQuestTrophies");
  renderLeaderboard();
  renderTrophies();
});

renderVerbChips();
renderLeaderboard();
renderTrophies();
startRound();
