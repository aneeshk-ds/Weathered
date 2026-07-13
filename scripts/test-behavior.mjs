import assert from "node:assert/strict";
import {
  buildBehavioralRead,
  buildDecisionReadiness,
  buildRecommendationNudges,
} from "../apps/mobile/src/lib/behavior.ts";
import { buildInsight } from "../apps/mobile/src/lib/insights.ts";
import { buildWeekDays, buildWeekMood, sameDay } from "../apps/mobile/src/lib/weekMood.ts";
import { personalizeNudges } from "../apps/mobile/src/lib/personalize.ts";
import { filterHistoryEntries, groupEntriesByDay } from "../apps/mobile/src/lib/history.ts";
import { computeStreak, supportiveMoodCaption, weeklyMoodDelta } from "../apps/mobile/src/lib/homeStats.ts";
import { reminderSchedule } from "../apps/mobile/src/lib/reminders.ts";

const baseWeather = {
  condition: "cloudy",
  temperatureC: 24,
  humidity: 60,
  locationLabel: "Local estimate",
};

function makeEntry(overrides = {}) {
  return {
    id: `entry-${Math.random().toString(36).slice(2)}`,
    userId: "local",
    mood: 6,
    energy: "medium",
    decisionCategory: "social",
    decisionOutcome: "go_out",
    weather: { ...baseWeather, ...(overrides.weather || {}) },
    timestamp: new Date().toISOString(),
    ...overrides,
  };
}

// --- behavior.ts: strong risk context (heat load) forces a pause ---
{
  const weather = { ...baseWeather, temperatureC: 32 };
  const read = buildBehavioralRead({ mood: 5, energy: "medium", weather });
  const risk = read.signals.find((s) => s.label === "Decision Risk");
  assert.equal(risk.level, "strong", "temp >= 30 should raise a strong risk signal");

  const readiness = buildDecisionReadiness({
    read,
    category: "work",
    mood: 5,
    energy: "medium",
    weather,
    entries: [],
  });
  assert.equal(readiness.label, "Pause", "strong risk should push readiness to Pause");
  assert.ok(readiness.score < 55, "pause readiness score should sit below the steady band");

  const nudges = buildRecommendationNudges({ read, category: "work", mood: 5, energy: "medium", weather, entries: [] });
  assert.equal(nudges[0].id, "nudge-delay-irrevocable", "strong risk should lead with the slow-down nudge");
  assert.ok(nudges.length <= 3, "nudges are capped at three");
}

// --- behavior.ts: high energy, cool, work focus window is Ready ---
{
  const weather = { ...baseWeather, temperatureC: 24 };
  const read = buildBehavioralRead({ mood: 7, energy: "high", weather });
  const focus = read.signals.find((s) => s.label === "Focus");
  assert.equal(focus.level, "strong", "high energy in cool weather is a strong focus window");

  const readiness = buildDecisionReadiness({ read, category: "work", mood: 7, energy: "high", weather, entries: [] });
  assert.equal(readiness.label, "Ready", "strong focus and high energy should read as Ready");

  const nudges = buildRecommendationNudges({ read, category: "work", mood: 7, energy: "high", weather, entries: [] });
  assert.equal(nudges[0].id, "nudge-use-focus-window", "work focus window should lead with the focus nudge");
}

// --- behavior.ts: sunny social window leads with social nudge ---
{
  const weather = { ...baseWeather, condition: "sunny", temperatureC: 26 };
  const read = buildBehavioralRead({ mood: 8, energy: "high", weather });
  const nudges = buildRecommendationNudges({ read, category: "social", mood: 8, energy: "high", weather, entries: [] });
  assert.equal(nudges[0].id, "nudge-social-follow-through", "sunny social window should lead with the social nudge");
}

// --- behavior.ts: low energy leads with the lighter-version nudge ---
{
  const read = buildBehavioralRead({ mood: 6, energy: "low", weather: baseWeather });
  const nudges = buildRecommendationNudges({
    read,
    category: "other",
    mood: 6,
    energy: "low",
    weather: baseWeather,
    entries: [],
  });
  assert.equal(nudges[0].id, "nudge-low-energy-version", "low energy should lead with the lighter-version nudge");
}

// --- insights.ts: rainy social cancel pattern surfaces ---
{
  const rainyCancel = makeEntry({
    decisionCategory: "social",
    decisionOutcome: "cancel",
    weather: { ...baseWeather, condition: "rainy" },
  });
  const insight = buildInsight(rainyCancel, [rainyCancel]);
  assert.equal(insight.id, "rainy-social-cancel", "a rainy social cancel should surface the rainy-social insight");
}

// --- insights.ts: first check-in fallback ---
{
  const plain = makeEntry({ decisionOutcome: "go_out" });
  const insight = buildInsight(plain, [plain]);
  assert.equal(insight.id, "first-checkin", "a single non-pattern entry should return the first-checkin insight");
}

// --- insights.ts: keep-logging fallback for multiple non-pattern entries ---
{
  const a = makeEntry({ decisionCategory: "work", decisionOutcome: "work", mood: 6 });
  const b = makeEntry({ decisionCategory: "work", decisionOutcome: "work", mood: 6 });
  const insight = buildInsight(a, [a, b]);
  assert.equal(insight.id, "keep-logging", "multiple non-pattern entries should return the keep-logging insight");
}

// --- insights.ts: repeated sunny social go-outs surface ---
{
  const s1 = makeEntry({ weather: { ...baseWeather, condition: "sunny" }, decisionOutcome: "go_out" });
  const s2 = makeEntry({ weather: { ...baseWeather, condition: "sunny" }, decisionOutcome: "go_out" });
  const insight = buildInsight(s1, [s1, s2]);
  assert.equal(insight.id, "sunny-social-go-out", "two sunny go-outs should surface the sunshine insight");
}

// --- weekMood.ts: deterministic seven-slot averaging ---
{
  assert.equal(sameDay(new Date(2026, 6, 9, 1, 0), new Date(2026, 6, 9, 23, 0)), true);
  assert.equal(sameDay(new Date(2026, 6, 9), new Date(2026, 6, 8)), false);

  const today = new Date(2026, 6, 9, 12, 0, 0);
  const entries = [
    makeEntry({ mood: 6, timestamp: new Date(2026, 6, 9, 10, 0, 0).toISOString() }),
    makeEntry({ mood: 8, timestamp: new Date(2026, 6, 9, 15, 0, 0).toISOString() }),
    makeEntry({ mood: 4, timestamp: new Date(2026, 6, 8, 10, 0, 0).toISOString() }),
  ];
  const week = buildWeekMood(entries, today);
  assert.equal(week.length, 7, "week should always have seven slots");
  assert.equal(week[6], 7, "today slot should average moods 6 and 8");
  assert.equal(week[5], 4, "yesterday slot should hold the single mood");
  assert.equal(
    week.slice(0, 5).reduce((sum, v) => sum + v, 0),
    0,
    "days with no entries should be zero",
  );
}

// --- personalize.ts: helpful first, not_now last, stable in between ---
{
  const nudges = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const feedback = [
    { nudgeId: "b", value: "helpful", timestamp: "2026-07-01T00:00:00.000Z" },
    { nudgeId: "a", value: "not_now", timestamp: "2026-07-01T00:00:00.000Z" },
  ];
  const ordered = personalizeNudges(nudges, feedback).map((n) => n.id);
  assert.deepEqual(ordered, ["b", "c", "a"], "helpful ranks first, not_now last, unrated stays in the middle");

  const untouched = personalizeNudges(nudges, []).map((n) => n.id);
  assert.deepEqual(untouched, ["a", "b", "c"], "no feedback should preserve original order");
}

// --- history.ts: category and query filtering ---
{
  const social = makeEntry({ decisionCategory: "social", decisionOutcome: "go_out", note: "beach walk" });
  const work = makeEntry({ decisionCategory: "work", decisionOutcome: "work", note: "deadline" });
  const all = [social, work];
  const onlyWork = filterHistoryEntries(all, { category: "work", query: "" });
  assert.equal(onlyWork.length, 1, "category filter narrows to one entry");
  assert.equal(onlyWork[0].decisionCategory, "work");
  assert.equal(filterHistoryEntries(all, { category: "all", query: "beach" }).length, 1, "note query matches");
  assert.equal(filterHistoryEntries(all, { category: "all", query: "BEACH" }).length, 1, "query is case-insensitive");
  assert.equal(filterHistoryEntries(all, { category: "all", query: "missing" }).length, 0, "no match returns none");
  assert.equal(filterHistoryEntries(all, { category: "all", query: "" }).length, 2, "empty filter returns all");
}

// --- history.ts: day grouping with Today and Yesterday labels ---
{
  const today = new Date(2026, 6, 9, 12, 0, 0);
  const t1 = makeEntry({ timestamp: new Date(2026, 6, 9, 9, 0, 0).toISOString() });
  const t2 = makeEntry({ timestamp: new Date(2026, 6, 9, 8, 0, 0).toISOString() });
  const y1 = makeEntry({ timestamp: new Date(2026, 6, 8, 20, 0, 0).toISOString() });
  const groups = groupEntriesByDay([t1, t2, y1], today);
  assert.equal(groups.length, 2, "two distinct days produce two groups");
  assert.equal(groups[0].label, "Today");
  assert.equal(groups[0].entries.length, 2, "both of today's entries land in one group");
  assert.equal(groups[1].label, "Yesterday");
  assert.equal(groups[1].entries.length, 1);
}

// --- homeStats.ts: check-in streak ---
{
  const today = new Date(2026, 6, 10, 12, 0, 0);
  const at = (daysAgo, hour = 9) => new Date(2026, 6, 10 - daysAgo, hour, 0, 0).toISOString();
  assert.equal(computeStreak([], today), 0, "no entries means no streak");
  assert.equal(computeStreak([makeEntry({ timestamp: at(0) })], today), 1, "a check-in today is a 1-day streak");
  assert.equal(
    computeStreak(
      [makeEntry({ timestamp: at(0) }), makeEntry({ timestamp: at(1) }), makeEntry({ timestamp: at(2) })],
      today,
    ),
    3,
    "three consecutive days is a 3-day streak",
  );
  assert.equal(
    computeStreak([makeEntry({ timestamp: at(0, 8) }), makeEntry({ timestamp: at(0, 20) })], today),
    1,
    "two check-ins on the same day count as one day",
  );
  assert.equal(computeStreak([makeEntry({ timestamp: at(1) })], today), 1, "yesterday only still counts (grace)");
  assert.equal(computeStreak([makeEntry({ timestamp: at(2) })], today), 0, "a two-day gap breaks the streak");
  assert.equal(
    computeStreak([makeEntry({ timestamp: at(0) }), makeEntry({ timestamp: at(2) })], today),
    1,
    "a missing yesterday stops the streak at today",
  );
}

// --- homeStats.ts: supportive mood caption ---
assert.match(supportiveMoodCaption(0), /Log a check-in/);
assert.match(supportiveMoodCaption(8), /bright/);
assert.match(supportiveMoodCaption(6.5), /steady/);
assert.match(supportiveMoodCaption(5), /Be kind/);
assert.match(supportiveMoodCaption(3), /Small steps/);

// --- homeStats.ts: weekly mood delta vs the prior week ---
{
  const today = new Date(2026, 6, 20, 12, 0, 0);
  const daysAgoIso = (d) => new Date(2026, 6, 20 - d, 9, 0, 0).toISOString();
  // this week (0-6 days ago) average 8, previous week (7-13) average 5 -> +60%
  const entries = [
    makeEntry({ mood: 8, timestamp: daysAgoIso(1) }),
    makeEntry({ mood: 8, timestamp: daysAgoIso(3) }),
    makeEntry({ mood: 5, timestamp: daysAgoIso(8) }),
    makeEntry({ mood: 5, timestamp: daysAgoIso(10) }),
  ];
  const delta = weeklyMoodDelta(entries, today);
  assert.equal(delta.hasComparison, true, "both weeks have data");
  assert.equal(delta.deltaPct, 60, "8 vs 5 is a +60% change");
  const noPrev = weeklyMoodDelta([makeEntry({ mood: 7, timestamp: daysAgoIso(1) })], today);
  assert.equal(noPrev.hasComparison, false, "no previous week means no comparison");
}

// --- reminders.ts: four daily nudge slots ---
{
  const slots = reminderSchedule();
  assert.equal(slots.length, 4, "there are four daily reminders");
  assert.deepEqual(
    slots.map((slot) => slot.hour),
    [9, 13, 18, 21],
    "reminders fire at 9am, 1pm, 6pm, and 9pm",
  );
  assert.ok(
    slots.every((slot) => slot.title && slot.body && slot.minute === 0),
    "every reminder has a title, a body, and lands on the hour",
  );
}

// --- weekMood.ts: buildWeekDays real labels + today flag ---
{
  const today = new Date(2026, 6, 15, 12, 0, 0);
  const days = buildWeekDays([makeEntry({ mood: 8, timestamp: new Date(2026, 6, 15, 9, 0, 0).toISOString() })], today);
  assert.equal(days.length, 7, "seven day slots");
  assert.equal(days[6].isToday, true, "the last slot is today");
  assert.equal(days[6].value, 8, "today reflects today's check-in");
  assert.ok(
    days.slice(0, 6).every((day) => !day.isToday),
    "only today is flagged",
  );
  const initials = ["S", "M", "T", "W", "T", "F", "S"];
  days.forEach((day, index) => {
    const d = new Date(2026, 6, 15);
    d.setDate(15 - (6 - index));
    assert.equal(day.label, initials[d.getDay()], "label matches the real weekday");
  });
}

console.log("Behavior and helper tests passed.");
