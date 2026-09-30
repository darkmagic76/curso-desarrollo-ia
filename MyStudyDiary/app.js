// Key used to store sessions in localStorage.
const STORAGE_KEY = "study-diary-sessions";

const form = document.getElementById("session-form");
const dateInput = document.getElementById("date");
const topicInput = document.getElementById("topic");
const minutesInput = document.getElementById("minutes");
const formError = document.getElementById("form-error");
const streakCount = document.getElementById("streak-count");
const streakUnit = document.getElementById("streak-unit");
const sessionList = document.getElementById("session-list");
const emptyMessage = document.getElementById("empty-message");

// Converts a Date into "YYYY-MM-DD" using the user's LOCAL date (never UTC).
function toLocalDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Converts "YYYY-MM-DD" into a local Date (avoids new Date("YYYY-MM-DD"), which is UTC).
function fromDateKey(key) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

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

// Counts consecutive days with at least one session, ending today.
// If today has no session yet but yesterday does, the streak is still alive.
function calculateStreak(sessions) {
  const studiedDays = new Set(sessions.map((session) => session.date));
  const day = new Date();

  if (!studiedDays.has(toLocalDateKey(day))) {
    day.setDate(day.getDate() - 1);
  }

  let streak = 0;
  while (studiedDays.has(toLocalDateKey(day))) {
    streak++;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

function formatDate(key) {
  return fromDateKey(key).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function render() {
  const sessions = loadSessions();

  const streak = calculateStreak(sessions);
  streakCount.textContent = streak;
  streakUnit.textContent = streak === 1 ? "día seguido" : "días seguidos";

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
