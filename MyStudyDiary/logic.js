// Pure logic for the Study Diary: dates, statistics and heat map.
// No DOM and no localStorage here. Functions that depend on "today"
// receive it as a parameter so they can be tested with `node --test`.
//
// Loaded as a classic script (works with file://). In Node, the functions
// are exported so the tests can require this file.

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

// Returns the key of the day that is `days` days after `key` (negative goes back).
// Uses setDate, so daylight saving changes never skip or repeat a day.
function addDays(key, days) {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toLocalDateKey(date);
}

// Returns the key of the Monday of the week that contains `todayKey`.
function getMondayKey(todayKey) {
  const daysSinceMonday = (fromDateKey(todayKey).getDay() + 6) % 7; // getDay(): Sunday = 0
  return addDays(todayKey, -daysSinceMonday);
}

// A session is valid when its date is a real "YYYY-MM-DD" day and its minutes
// are a whole number above 0. Invalid sessions are ignored, never deleted.
function isValidSession(session) {
  if (typeof session !== "object" || session === null || Array.isArray(session)) {
    return false;
  }

  const { date, minutes } = session;
  const hasDateShape = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date);
  // A real day survives the round trip; "2026-02-30" would become "2026-03-02".
  const isRealDay = hasDateShape && toLocalDateKey(fromDateKey(date)) === date;

  return isRealDay && Number.isInteger(minutes) && minutes > 0;
}

// Counts consecutive days with at least one session, ending today.
// If today has no session yet but yesterday does, the streak is still alive.
function calculateStreak(sessions, todayKey) {
  const studiedDays = new Set(
    sessions.filter(isValidSession).map((session) => session.date)
  );
  let day = todayKey;

  if (!studiedDays.has(day)) {
    day = addDays(day, -1);
  }

  let streak = 0;
  while (studiedDays.has(day)) {
    streak++;
    day = addDays(day, -1);
  }
  return streak;
}

// Finds the longest run of consecutive days with a session in the whole history.
// Repeated days count once and future dates are ignored.
function calculateBestStreak(sessions, todayKey) {
  const days = [...new Set(sessions.filter(isValidSession).map((session) => session.date))]
    .filter((date) => date <= todayKey)
    .sort(); // "YYYY-MM-DD" sorts correctly as text

  let best = 0;
  let current = 0;
  let previous = null;

  days.forEach((date) => {
    current = previous && addDays(previous, 1) === date ? current + 1 : 1;
    best = Math.max(best, current);
    previous = date;
  });

  return best;
}

// Adds up the minutes studied from this week's Monday (local date) until today.
// Here every session counts, even several on the same day.
function calculateWeekMinutes(sessions, todayKey) {
  const mondayKey = getMondayKey(todayKey);

  return sessions
    .filter(isValidSession)
    .filter((session) => session.date >= mondayKey && session.date <= todayKey)
    .reduce((total, session) => total + session.minutes, 0);
}

// Counts distinct days with a session from the 1st of this month (local) until today.
function calculateMonthDays(sessions, todayKey) {
  const monthPrefix = todayKey.slice(0, 7); // "YYYY-MM"

  const days = sessions
    .filter(isValidSession)
    .map((session) => session.date)
    .filter((date) => date.startsWith(monthPrefix) && date <= todayKey);

  return new Set(days).size;
}

// ---------------------------------------------------------------------------
// Heat map
// ---------------------------------------------------------------------------

const HEATMAP_WEEKS = 12;
const LEVEL_LIMITS = [1, 30, 60, 120]; // minimum minutes for levels 1, 2, 3 and 4
const DAY_NAMES = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"]; // index = getDay()
const MONTH_NAMES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const LEGEND = [
  { level: 0, text: "0 min" },
  { level: 1, text: "1–29 min" },
  { level: 2, text: "30–59 min" },
  { level: 3, text: "60–119 min" },
  { level: 4, text: "120 min o más" },
];

// Turns the total minutes of a day into a color level from 0 to 4.
function getLevel(minutes) {
  let level = 0;
  LEVEL_LIMITS.forEach((limit) => {
    if (minutes >= limit) level++;
  });
  return level;
}

// First and last day of the map: Monday 11 weeks ago until the Sunday of this week.
function getHeatmapRange(todayKey) {
  const mondayThisWeek = getMondayKey(todayKey);
  return {
    startKey: addDays(mondayThisWeek, -7 * (HEATMAP_WEEKS - 1)),
    endKey: addDays(mondayThisWeek, 6),
  };
}

// Total minutes per day, only for valid sessions between startKey and today.
function sumMinutesByDay(sessions, todayKey, startKey) {
  const totals = {};
  sessions.filter(isValidSession).forEach((session) => {
    if (session.date < startKey || session.date > todayKey) return;
    totals[session.date] = (totals[session.date] || 0) + session.minutes;
  });
  return totals;
}

// Text shown for one day, e.g. "lun 14 sep: 45 min". Adds the year if it is not this year.
function formatDayDetail(key, minutes, todayKey) {
  const date = fromDateKey(key);
  let text = `${DAY_NAMES[date.getDay()]} ${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
  if (key.slice(0, 4) !== todayKey.slice(0, 4)) {
    text += ` ${date.getFullYear()}`;
  }
  return `${text}: ${minutes > 0 ? `${minutes} min` : "sin estudio"}`;
}

// Month names over the columns: one over the column that contains day 1 of each month,
// plus the month of the first column unless the next label is less than 2 columns away.
function getMonthLabels(weeks) {
  const labels = [];
  weeks.forEach((week, column) => {
    const firstOfMonth = week.find((cell) => cell.key.endsWith("-01"));
    if (firstOfMonth) {
      labels.push({ column, label: MONTH_NAMES[fromDateKey(firstOfMonth.key).getMonth()] });
    }
  });

  const startsInFirstColumn = labels.length > 0 && labels[0].column === 0;
  const nextIsFarEnough = labels.length === 0 || labels[0].column >= 2;
  if (!startsInFirstColumn && nextIsFarEnough) {
    labels.unshift({ column: 0, label: MONTH_NAMES[fromDateKey(weeks[0][0].key).getMonth()] });
  }
  return labels;
}

// Builds everything the interface needs to paint the map. Pure: same input, same output.
function buildHeatmap(sessions, todayKey) {
  const { startKey } = getHeatmapRange(todayKey);
  const totals = sumMinutesByDay(sessions, todayKey, startKey);

  const weeks = [];
  let key = startKey;
  for (let column = 0; column < HEATMAP_WEEKS; column++) {
    const week = [];
    for (let row = 0; row < 7; row++) {
      const isFuture = key > todayKey; // "YYYY-MM-DD" compares correctly as text
      const minutes = isFuture ? 0 : totals[key] || 0;
      week.push({
        key,
        minutes,
        level: isFuture ? null : getLevel(minutes),
        isFuture,
        isToday: key === todayKey,
        detail: isFuture ? null : formatDayDetail(key, minutes, todayKey),
      });
      key = addDays(key, 1);
    }
    weeks.push(week);
  }

  return {
    weeks,
    monthLabels: getMonthLabels(weeks),
    isEmpty: Object.keys(totals).length === 0,
  };
}

const logic = {
  toLocalDateKey,
  fromDateKey,
  addDays,
  getMondayKey,
  isValidSession,
  calculateStreak,
  calculateBestStreak,
  calculateWeekMinutes,
  calculateMonthDays,
  LEGEND,
  getLevel,
  getHeatmapRange,
  sumMinutesByDay,
  formatDayDetail,
  getMonthLabels,
  buildHeatmap,
};

if (typeof module !== "undefined" && module.exports) {
  module.exports = logic;
}
