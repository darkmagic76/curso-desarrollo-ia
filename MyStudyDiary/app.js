// Key used to store sessions in localStorage.
const STORAGE_KEY = "study-diary-sessions";

const form = document.getElementById("session-form");
const dateInput = document.getElementById("date");
const topicInput = document.getElementById("topic");
const minutesInput = document.getElementById("minutes");
const formError = document.getElementById("form-error");
const streakCount = document.getElementById("streak-count");
const streakUnit = document.getElementById("streak-unit");
const bestStreakCount = document.getElementById("best-streak-count");
const bestStreakUnit = document.getElementById("best-streak-unit");
const weekMinutes = document.getElementById("week-minutes");
const monthDays = document.getElementById("month-days");
const monthDaysUnit = document.getElementById("month-days-unit");
const sessionList = document.getElementById("session-list");
const emptyMessage = document.getElementById("empty-message");

// toLocalDateKey and fromDateKey live in logic.js (loaded before this file).

function loadSessions() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveSessions(sessions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

function formatDate(key) {
  return fromDateKey(key).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Heat map (the calculations live in logic.js; here we only paint and listen)
// ---------------------------------------------------------------------------

const heatmapGrid = document.getElementById("heatmap-grid");
const heatmapMonths = document.getElementById("heatmap-months");
const heatmapDetail = document.getElementById("heatmap-detail");
const heatmapEmpty = document.getElementById("heatmap-empty");
const heatmapLegendCells = document.getElementById("heatmap-legend-cells");

function showHeatmapDetail(text) {
  heatmapDetail.textContent = text;
}

function hideHeatmapDetail() {
  heatmapDetail.textContent = "";
}

// Cells are painted in chronological order; CSS places them in columns Monday → Sunday.
function renderHeatmap(heatmap) {
  heatmapGrid.innerHTML = "";
  heatmapMonths.innerHTML = "";
  hideHeatmapDetail();

  heatmap.weeks.flat().forEach((cell, index) => {
    if (cell.isFuture) {
      // Future days: outline only, invisible to screen readers and keyboard.
      const empty = document.createElement("span");
      empty.className = "heatmap-cell is-future";
      empty.setAttribute("aria-hidden", "true");
      heatmapGrid.append(empty);
      return;
    }

    const button = document.createElement("button");
    button.type = "button";
    button.className = `heatmap-cell level-${cell.level}`;
    if (cell.isToday) button.classList.add("is-today");
    button.dataset.index = index;
    button.dataset.detail = cell.detail;
    button.setAttribute("aria-label", cell.detail);
    // Roving tabindex: only today is reachable with Tab; arrows move inside.
    button.tabIndex = cell.isToday ? 0 : -1;
    heatmapGrid.append(button);
  });

  heatmap.monthLabels.forEach(({ column, label }) => {
    const span = document.createElement("span");
    span.textContent = label;
    span.style.gridColumn = column + 1;
    heatmapMonths.append(span);
  });

  heatmapEmpty.hidden = !heatmap.isEmpty;
}

function renderHeatmapLegend() {
  LEGEND.forEach(({ level, text }) => {
    const item = document.createElement("span");
    item.className = `heatmap-cell level-${level}`;
    item.tabIndex = 0;
    item.title = text;
    item.dataset.detail = text;
    item.setAttribute("role", "img");
    item.setAttribute("aria-label", text);
    heatmapLegendCells.append(item);
  });
}

// Moves the focus with the arrow keys: up/down = previous/next day, left/right = previous/next week.
const ARROW_STEPS = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 };

function moveHeatmapFocus(current, key) {
  const index = Number(current.dataset.index);
  const target = index + ARROW_STEPS[key];
  const sameColumn = Math.floor(index / 7) === Math.floor(target / 7);
  if ((key === "ArrowUp" || key === "ArrowDown") && !sameColumn) return;

  // Future cells have no data-index, so they can never be reached.
  const next = heatmapGrid.querySelector(`[data-index="${target}"]`);
  if (!next) return;

  current.tabIndex = -1;
  next.tabIndex = 0;
  next.focus();
}

heatmapGrid.addEventListener("keydown", (event) => {
  if (event.key in ARROW_STEPS && event.target.dataset.index) {
    event.preventDefault();
    moveHeatmapFocus(event.target, event.key);
  }
});

// Mouse, touch and keyboard all show the same detail text (grid cells and legend).
for (const area of [heatmapGrid, heatmapLegendCells]) {
  area.addEventListener("mouseover", (event) => {
    if (event.target.dataset.detail) showHeatmapDetail(event.target.dataset.detail);
  });
  area.addEventListener("mouseleave", hideHeatmapDetail);
  area.addEventListener("focusin", (event) => {
    if (event.target.dataset.detail) showHeatmapDetail(event.target.dataset.detail);
  });
  area.addEventListener("click", (event) => {
    if (!event.target.dataset.detail) return;
    event.target.focus(); // some mobile browsers do not focus buttons on tap
    showHeatmapDetail(event.target.dataset.detail);
  });
}

// Tapping outside the map or pressing Escape hides the detail.
document.addEventListener("click", (event) => {
  if (!heatmapGrid.contains(event.target) && !heatmapLegendCells.contains(event.target)) {
    hideHeatmapDetail();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") hideHeatmapDetail();
});

renderHeatmapLegend();

function render() {
  const sessions = loadSessions();
  // One single "today" for every calculation in this render.
  const todayKey = toLocalDateKey(new Date());

  const streak = calculateStreak(sessions, todayKey);
  streakCount.textContent = streak;
  streakUnit.textContent = streak === 1 ? "día seguido" : "días seguidos";

  const bestStreak = Math.max(calculateBestStreak(sessions, todayKey), streak);
  bestStreakCount.textContent = bestStreak;
  bestStreakUnit.textContent = bestStreak === 1 ? "día" : "días";

  weekMinutes.textContent = calculateWeekMinutes(sessions, todayKey);

  const monthDaysCount = calculateMonthDays(sessions, todayKey);
  monthDays.textContent = monthDaysCount;
  monthDaysUnit.textContent = monthDaysCount === 1 ? "día" : "días";

  renderHeatmap(buildHeatmap(sessions, todayKey));

  // Most recent first: by date, then by creation time.
  const sorted = [...sessions].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return b.createdAt - a.createdAt;
  });

  sessionList.innerHTML = "";
  emptyMessage.hidden = sorted.length > 0;

  sorted.forEach((session) => {
    const item = document.createElement("li");

    const info = document.createElement("div");
    const topic = document.createElement("div");
    topic.className = "session-topic";
    topic.textContent = session.topic; // textContent prevents HTML injection
    const date = document.createElement("div");
    date.className = "session-date";
    date.textContent = formatDate(session.date);
    info.append(topic, date);

    const minutes = document.createElement("span");
    minutes.className = "session-minutes";
    minutes.textContent = `${session.minutes} min`;

    item.append(info, minutes);
    sessionList.append(item);
  });
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const date = dateInput.value;
  const topic = topicInput.value.trim();
  const minutes = Number(minutesInput.value);

  if (!date) {
    formError.textContent = "Elige una fecha.";
    return;
  }
  if (date > toLocalDateKey(new Date())) {
    formError.textContent = "La fecha no puede ser futura.";
    return;
  }
  if (!topic) {
    formError.textContent = "Escribe un tema.";
    return;
  }
  if (!Number.isInteger(minutes) || minutes <= 0) {
    formError.textContent = "Los minutos deben ser un número entero mayor que 0.";
    return;
  }

  formError.textContent = "";
  const sessions = loadSessions();
  sessions.push({ date, topic, minutes, createdAt: Date.now() });
  saveSessions(sessions);

  topicInput.value = "";
  minutesInput.value = "";
  dateInput.value = toLocalDateKey(new Date());
  render();
});

// Default date is today (local), but future dates are not allowed.
const today = toLocalDateKey(new Date());
dateInput.value = today;
dateInput.max = today;

render();
