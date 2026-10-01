// Fixed time zone with daylight saving changes, so date tests are deterministic.
process.env.TZ = "Europe/Madrid";

const test = require("node:test");
const assert = require("node:assert/strict");

const logic = require("../logic.js");

test("logic.js loads in Node and exports an object", () => {
  assert.equal(typeof logic, "object");
  assert.notEqual(logic, null);
});

// --- T2: toLocalDateKey / fromDateKey (RF-1, RF-11) ---

test("toLocalDateKey uses the local date with zero padding", () => {
  assert.equal(logic.toLocalDateKey(new Date(2026, 0, 5)), "2026-01-05");
  assert.equal(logic.toLocalDateKey(new Date(2026, 11, 31)), "2026-12-31");
});

test("toLocalDateKey keeps the local day late at night (no UTC shift)", () => {
  assert.equal(logic.toLocalDateKey(new Date(2026, 5, 30, 23, 59)), "2026-06-30");
  assert.equal(logic.toLocalDateKey(new Date(2026, 0, 1, 0, 30)), "2026-01-01");
});

test("fromDateKey returns a local Date at midnight", () => {
  const date = logic.fromDateKey("2026-09-14");
  assert.equal(date.getFullYear(), 2026);
  assert.equal(date.getMonth(), 8);
  assert.equal(date.getDate(), 14);
  assert.equal(date.getHours(), 0);
});

test("fromDateKey and toLocalDateKey round-trip on month and year boundaries", () => {
  for (const key of ["2026-01-31", "2026-02-01", "2025-12-31", "2026-01-01", "2028-02-29"]) {
    assert.equal(logic.toLocalDateKey(logic.fromDateKey(key)), key);
  }
});

test("round-trip works on daylight saving change days", () => {
  for (const key of ["2026-03-29", "2026-10-25"]) {
    assert.equal(logic.toLocalDateKey(logic.fromDateKey(key)), key);
  }
});

// --- T3: addDays / getMondayKey (RF-1, RF-11) ---

test("addDays moves forward and backward across month and year boundaries", () => {
  assert.equal(logic.addDays("2026-01-31", 1), "2026-02-01");
  assert.equal(logic.addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(logic.addDays("2028-03-01", -1), "2028-02-29");
  assert.equal(logic.addDays("2025-12-31", 1), "2026-01-01");
  assert.equal(logic.addDays("2026-01-01", -1), "2025-12-31");
});

test("addDays with 0 returns the same day", () => {
  assert.equal(logic.addDays("2026-09-14", 0), "2026-09-14");
});

test("addDays handles larger jumps", () => {
  assert.equal(logic.addDays("2026-10-01", -77), "2026-07-16");
  assert.equal(logic.addDays("2026-07-16", 77), "2026-10-01");
});

test("addDays does not skip or repeat days on daylight saving changes", () => {
  assert.equal(logic.addDays("2026-03-28", 1), "2026-03-29");
  assert.equal(logic.addDays("2026-03-29", 1), "2026-03-30");
  assert.equal(logic.addDays("2026-03-30", -1), "2026-03-29");
  assert.equal(logic.addDays("2026-10-24", 1), "2026-10-25");
  assert.equal(logic.addDays("2026-10-25", 1), "2026-10-26");
  assert.equal(logic.addDays("2026-10-26", -1), "2026-10-25");
});

test("getMondayKey returns the same day on a Monday", () => {
  assert.equal(logic.getMondayKey("2026-09-28"), "2026-09-28");
});

test("getMondayKey returns the Monday of the week for midweek and Sunday", () => {
  assert.equal(logic.getMondayKey("2026-09-30"), "2026-09-28"); // Wednesday
  assert.equal(logic.getMondayKey("2026-10-04"), "2026-09-28"); // Sunday
});

test("getMondayKey crosses month and year boundaries", () => {
  assert.equal(logic.getMondayKey("2026-10-01"), "2026-09-28");
  assert.equal(logic.getMondayKey("2027-01-01"), "2026-12-28");
});

// --- T4: isValidSession (RF-10, RF-11) ---

test("isValidSession accepts a normal session", () => {
  assert.equal(logic.isValidSession({ date: "2026-09-14", topic: "JS", minutes: 30, createdAt: 1 }), true);
});

test("isValidSession accepts old sessions without createdAt", () => {
  assert.equal(logic.isValidSession({ date: "2026-09-14", topic: "JS", minutes: 30 }), true);
});

test("isValidSession rejects minutes that are not a whole number above 0", () => {
  for (const minutes of [0, -5, 2.5, "30", undefined, null, NaN]) {
    assert.equal(logic.isValidSession({ date: "2026-09-14", minutes }), false, `minutes: ${minutes}`);
  }
});

test("isValidSession rejects malformed or impossible dates", () => {
  for (const date of ["2026-02-30", "2026-13-01", "14/09/2026", "2026-9-14", "", undefined, 20260914]) {
    assert.equal(logic.isValidSession({ date, minutes: 30 }), false, `date: ${date}`);
  }
});

test("isValidSession accepts 29 February only in leap years", () => {
  assert.equal(logic.isValidSession({ date: "2028-02-29", minutes: 30 }), true);
  assert.equal(logic.isValidSession({ date: "2026-02-29", minutes: 30 }), false);
});

test("isValidSession rejects values that are not objects", () => {
  for (const value of [null, undefined, "2026-09-14", 30, []]) {
    assert.equal(logic.isValidSession(value), false);
  }
});

// --- T5: calculateStreak (RF-11) ---
// Characterization tests: same results as the old version in app.js.

const day = (date, minutes = 30) => ({ date, topic: "JS", minutes });

test("calculateStreak is 0 without sessions", () => {
  assert.equal(logic.calculateStreak([], "2026-10-02"), 0);
});

test("calculateStreak counts consecutive days ending today", () => {
  const sessions = [day("2026-10-02"), day("2026-10-01"), day("2026-09-30")];
  assert.equal(logic.calculateStreak(sessions, "2026-10-02"), 3);
});

test("calculateStreak stays alive from yesterday when today has no session", () => {
  const sessions = [day("2026-10-01"), day("2026-09-30")];
  assert.equal(logic.calculateStreak(sessions, "2026-10-02"), 2);
});

test("calculateStreak is 0 when the last session was two days ago", () => {
  assert.equal(logic.calculateStreak([day("2026-09-30")], "2026-10-02"), 0);
});

test("calculateStreak stops at the first gap", () => {
  const sessions = [day("2026-10-02"), day("2026-10-01"), day("2026-09-29")];
  assert.equal(logic.calculateStreak(sessions, "2026-10-02"), 2);
});

test("calculateStreak counts several sessions on the same day once", () => {
  const sessions = [day("2026-10-02"), day("2026-10-02"), day("2026-10-01")];
  assert.equal(logic.calculateStreak(sessions, "2026-10-02"), 2);
});

test("calculateStreak ignores future sessions", () => {
  const sessions = [day("2026-10-03"), day("2026-10-02")];
  assert.equal(logic.calculateStreak(sessions, "2026-10-02"), 1);
});

test("calculateStreak crosses month and year boundaries", () => {
  assert.equal(logic.calculateStreak([day("2026-10-01"), day("2026-09-30")], "2026-10-01"), 2);
  assert.equal(logic.calculateStreak([day("2027-01-01"), day("2026-12-31")], "2027-01-01"), 2);
});

test("calculateStreak ignores invalid sessions without throwing", () => {
  const sessions = [day("2026-10-02"), day("2026-10-01", 0), { topic: "x" }, null];
  assert.equal(logic.calculateStreak(sessions, "2026-10-02"), 1);
});

// --- T6: calculateBestStreak (RF-11) ---

test("calculateBestStreak is 0 without sessions", () => {
  assert.equal(logic.calculateBestStreak([], "2026-10-02"), 0);
});

test("calculateBestStreak is 1 with a single day", () => {
  assert.equal(logic.calculateBestStreak([day("2026-05-10")], "2026-10-02"), 1);
});

test("calculateBestStreak keeps the longest of several runs, in any order", () => {
  const sessions = [
    day("2026-09-01"), day("2026-08-30"), day("2026-08-31"), // run of 3
    day("2026-10-01"), day("2026-10-02"), // run of 2
  ];
  assert.equal(logic.calculateBestStreak(sessions, "2026-10-02"), 3);
});

test("calculateBestStreak counts several sessions on the same day once", () => {
  const sessions = [day("2026-09-01"), day("2026-09-01"), day("2026-09-02")];
  assert.equal(logic.calculateBestStreak(sessions, "2026-10-02"), 2);
});

test("calculateBestStreak ignores future sessions", () => {
  const sessions = [day("2026-10-02"), day("2026-10-03"), day("2026-10-04")];
  assert.equal(logic.calculateBestStreak(sessions, "2026-10-02"), 1);
});

test("calculateBestStreak crosses daylight saving and year changes", () => {
  const dst = [day("2026-03-28"), day("2026-03-29"), day("2026-03-30")];
  assert.equal(logic.calculateBestStreak(dst, "2026-10-02"), 3);
  const year = [day("2025-12-31"), day("2026-01-01")];
  assert.equal(logic.calculateBestStreak(year, "2026-10-02"), 2);
});

test("calculateBestStreak ignores invalid sessions without throwing", () => {
  const sessions = [day("2026-09-01"), day("2026-09-02", -1), { minutes: 30 }, null];
  assert.equal(logic.calculateBestStreak(sessions, "2026-10-02"), 1);
});

// --- T7: calculateWeekMinutes (RF-11) ---
// 2026-09-28 is a Monday and 2026-10-04 is a Sunday.

test("calculateWeekMinutes is 0 without sessions", () => {
  assert.equal(logic.calculateWeekMinutes([], "2026-10-02"), 0);
});

test("calculateWeekMinutes adds every session from Monday to today", () => {
  const sessions = [day("2026-09-28", 20), day("2026-10-01", 15), day("2026-10-02", 10)];
  assert.equal(logic.calculateWeekMinutes(sessions, "2026-10-02"), 45);
});

test("calculateWeekMinutes adds several sessions of the same day", () => {
  const sessions = [day("2026-10-02", 20), day("2026-10-02", 25)];
  assert.equal(logic.calculateWeekMinutes(sessions, "2026-10-02"), 45);
});

test("calculateWeekMinutes on a Monday only counts that Monday", () => {
  const sessions = [day("2026-09-27", 50), day("2026-09-28", 30)];
  assert.equal(logic.calculateWeekMinutes(sessions, "2026-09-28"), 30);
});

test("calculateWeekMinutes on a Sunday counts the whole week", () => {
  const sessions = [day("2026-09-28", 10), day("2026-10-04", 20), day("2026-10-05", 99)];
  assert.equal(logic.calculateWeekMinutes(sessions, "2026-10-04"), 30);
});

test("calculateWeekMinutes excludes last week and future sessions", () => {
  const sessions = [day("2026-09-27", 40), day("2026-10-02", 10), day("2026-10-03", 60)];
  assert.equal(logic.calculateWeekMinutes(sessions, "2026-10-02"), 10);
});

test("calculateWeekMinutes ignores invalid sessions without throwing", () => {
  const sessions = [day("2026-10-02", 10), day("2026-10-01", 2.5), { date: "2026-10-01" }, null];
  assert.equal(logic.calculateWeekMinutes(sessions, "2026-10-02"), 10);
});

// --- T8: calculateMonthDays (RF-11) ---

test("calculateMonthDays is 0 without sessions", () => {
  assert.equal(logic.calculateMonthDays([], "2026-10-02"), 0);
});

test("calculateMonthDays counts distinct days from the 1st until today", () => {
  const sessions = [day("2026-10-01"), day("2026-10-02"), day("2026-10-02")];
  assert.equal(logic.calculateMonthDays(sessions, "2026-10-02"), 2);
});

test("calculateMonthDays on the 1st only counts that day", () => {
  const sessions = [day("2026-09-30"), day("2026-10-01")];
  assert.equal(logic.calculateMonthDays(sessions, "2026-10-01"), 1);
});

test("calculateMonthDays excludes the previous month, same month of another year and future days", () => {
  const sessions = [day("2026-09-30"), day("2025-10-02"), day("2026-10-02"), day("2026-10-15")];
  assert.equal(logic.calculateMonthDays(sessions, "2026-10-02"), 1);
});

test("calculateMonthDays ignores sessions without date or with invalid data without throwing", () => {
  const sessions = [day("2026-10-02"), { minutes: 30 }, day("2026-10-01", 0), null];
  assert.equal(logic.calculateMonthDays(sessions, "2026-10-02"), 1);
});

// --- T10: getLevel (RF-3) ---

test("getLevel maps total minutes to the 5 fixed levels (limits included)", () => {
  const cases = [[0, 0], [1, 1], [29, 1], [30, 2], [59, 2], [60, 3], [119, 3], [120, 4], [5000, 4]];
  for (const [minutes, level] of cases) {
    assert.equal(logic.getLevel(minutes), level, `${minutes} min`);
  }
});

test("LEGEND describes the range of every level in Spanish", () => {
  assert.deepEqual(logic.LEGEND.map((item) => item.text), [
    "0 min", "1–29 min", "30–59 min", "60–119 min", "120 min o más",
  ]);
});

// --- T11: getHeatmapRange (RF-1) ---
// 2026-10-02 is a Friday; its week starts on Monday 2026-09-28.

test("getHeatmapRange covers 12 weeks from Monday to the Sunday of this week", () => {
  assert.deepEqual(logic.getHeatmapRange("2026-10-02"), { startKey: "2026-07-13", endKey: "2026-10-04" });
});

test("getHeatmapRange works when today is Monday or Sunday", () => {
  assert.deepEqual(logic.getHeatmapRange("2026-09-28"), { startKey: "2026-07-13", endKey: "2026-10-04" });
  assert.deepEqual(logic.getHeatmapRange("2026-10-04"), { startKey: "2026-07-13", endKey: "2026-10-04" });
});

test("getHeatmapRange always spans 84 days starting on a Monday", () => {
  for (const today of ["2026-10-02", "2027-01-01", "2026-03-29"]) {
    const { startKey, endKey } = logic.getHeatmapRange(today);
    assert.equal(logic.fromDateKey(startKey).getDay(), 1);
    assert.equal(logic.addDays(startKey, 83), endKey);
  }
});

// --- T12: sumMinutesByDay (RF-2, RF-3, RF-10) ---

test("sumMinutesByDay adds sessions of the same day, including exact duplicates", () => {
  const sessions = [day("2026-10-01", 20), day("2026-10-01", 15), day("2026-10-02", 10), day("2026-10-02", 10)];
  assert.deepEqual(logic.sumMinutesByDay(sessions, "2026-10-02", "2026-07-13"), {
    "2026-10-01": 35,
    "2026-10-02": 20,
  });
});

test("sumMinutesByDay excludes future, out-of-range and invalid sessions", () => {
  const sessions = [
    day("2026-10-03", 30), // future
    day("2026-07-12", 30), // before the range
    day("2026-07-13", 30), // first day of the range: included
    day("2026-09-01", 0), // invalid minutes
    { date: "2026-09-02" }, // no minutes
    null,
  ];
  assert.deepEqual(logic.sumMinutesByDay(sessions, "2026-10-02", "2026-07-13"), { "2026-07-13": 30 });
});

test("sumMinutesByDay does not modify the sessions it receives", () => {
  const sessions = [day("2026-10-01", 20), day("2026-10-01", 15)];
  const copy = JSON.parse(JSON.stringify(sessions));
  logic.sumMinutesByDay(sessions, "2026-10-02", "2026-07-13");
  assert.deepEqual(sessions, copy);
});

// --- T13: formatDayDetail (RF-4) ---

test("formatDayDetail shows short weekday, day, month and minutes", () => {
  assert.equal(logic.formatDayDetail("2026-09-14", 45, "2026-10-02"), "lun 14 sep: 45 min");
});

test("formatDayDetail says 'sin estudio' for days without minutes", () => {
  assert.equal(logic.formatDayDetail("2026-09-14", 0, "2026-10-02"), "lun 14 sep: sin estudio");
});

test("formatDayDetail adds the year when the day is not in the current year", () => {
  assert.equal(logic.formatDayDetail("2025-12-29", 45, "2026-01-02"), "lun 29 dic 2025: 45 min");
});

// --- T14: getMonthLabels (RF-7) ---

const labelsFor = (todayKey) => logic.getMonthLabels(logic.buildHeatmap([], todayKey).weeks);

test("getMonthLabels labels the column with day 1 and the first column", () => {
  assert.deepEqual(labelsFor("2026-10-02"), [
    { column: 0, label: "jul" },
    { column: 2, label: "ago" },
    { column: 7, label: "sep" },
    { column: 11, label: "oct" },
  ]);
});

test("getMonthLabels skips the first column label when the next one is less than 2 columns away", () => {
  assert.deepEqual(labelsFor("2026-09-07"), [
    { column: 1, label: "jul" },
    { column: 5, label: "ago" },
    { column: 10, label: "sep" },
  ]);
});

test("getMonthLabels does not repeat a month that starts in the first column", () => {
  assert.deepEqual(labelsFor("2026-08-17"), [
    { column: 0, label: "jun" },
    { column: 4, label: "jul" },
    { column: 8, label: "ago" },
  ]);
});

test("getMonthLabels crosses from December to January", () => {
  assert.deepEqual(labelsFor("2027-01-04"), [
    { column: 1, label: "nov" },
    { column: 6, label: "dic" },
    { column: 10, label: "ene" },
  ]);
});

// --- T15: buildHeatmap (RF-1, RF-2, RF-6, RF-9, RF-10) ---

test("buildHeatmap returns 12 weeks of 7 days in chronological order", () => {
  const { weeks } = logic.buildHeatmap([], "2026-10-02");
  assert.equal(weeks.length, 12);
  weeks.forEach((week) => assert.equal(week.length, 7));
  assert.equal(weeks[0][0].key, "2026-07-13");
  assert.equal(weeks[11][6].key, "2026-10-04");
});

test("buildHeatmap marks future days without level or detail", () => {
  const { weeks } = logic.buildHeatmap([day("2026-10-03", 60)], "2026-10-02");
  const saturday = weeks[11][5];
  assert.equal(saturday.isFuture, true);
  assert.equal(saturday.level, null);
  assert.equal(saturday.detail, null);
  assert.equal(saturday.minutes, 0);
});

test("buildHeatmap marks exactly one cell as today", () => {
  const cells = logic.buildHeatmap([], "2026-10-02").weeks.flat();
  const today = cells.filter((cell) => cell.isToday);
  assert.equal(today.length, 1);
  assert.equal(today[0].key, "2026-10-02");
  assert.equal(today[0].isFuture, false);
});

test("buildHeatmap fills minutes, level and detail of past days", () => {
  const cell = logic.buildHeatmap([day("2026-10-01", 20), day("2026-10-01", 15)], "2026-10-02").weeks[11][3];
  assert.deepEqual(cell, {
    key: "2026-10-01", minutes: 35, level: 2, isFuture: false, isToday: false, detail: "jue 1 oct: 35 min",
  });
});

test("buildHeatmap isEmpty without sessions, only out of range or only future", () => {
  assert.equal(logic.buildHeatmap([], "2026-10-02").isEmpty, true);
  assert.equal(logic.buildHeatmap([day("2026-01-01")], "2026-10-02").isEmpty, true);
  assert.equal(logic.buildHeatmap([day("2026-10-03")], "2026-10-02").isEmpty, true);
  assert.equal(logic.buildHeatmap([day("2026-10-02")], "2026-10-02").isEmpty, false);
});

test("buildHeatmap does not throw with invalid data", () => {
  const junk = [null, 42, "x", { date: 5 }, { date: "2026-10-02", minutes: "30" }];
  assert.equal(logic.buildHeatmap(junk, "2026-10-02").isEmpty, true);
});
