import assert from "node:assert/strict";
import {
  buildBehavioralRead,
  buildDecisionReadiness,
  buildRecommendationNudges,
} from "../apps/mobile/src/lib/behavior.ts";
import { buildInsight } from "../apps/mobile/src/lib/insights.ts";
import { buildWeekDays, buildWeekMood, sameDay } from "../apps/mobile/src/lib/weekMood.ts";
import { activeNudgeFeedback, personalizeNudges } from "../apps/mobile/src/lib/personalize.ts";
import { filterHistoryEntries, groupEntriesByDay } from "../apps/mobile/src/lib/history.ts";
import {
  computeStreak,
  dominantWeeklyWeather,
  supportiveMoodCaption,
  weeklyMoodDelta,
} from "../apps/mobile/src/lib/homeStats.ts";
import { reminderSchedule } from "../apps/mobile/src/lib/reminders.ts";
import { buildDayPartInsights, dayPartFor } from "../apps/mobile/src/lib/dayParts.ts";
import {
  buildReflectionSummary,
  dayRatingScore,
  recentReflectionReadinessSignal,
  reflectionForDay,
  upsertDailyReflection,
} from "../apps/mobile/src/lib/reflections.ts";
import {
  assessTravelWeather,
  normalizeTravelWeatherState,
  TRAVEL_GEOFENCE_RADIUS_M,
  TRAVEL_NOTIFICATION_COOLDOWN_MS,
} from "../apps/mobile/src/lib/travelWeather.ts";

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
  assert.match(nudges[0].evidenceLabel, /Current read: mood 5\/10/, "primary nudges should explain the live context");
  assert.ok(nudges[0].purposeLabel, "primary nudges should explain why the suggestion matters");
  assert.equal(nudges[0].source, "live", "primary nudges should identify live conditions as their source");
  assert.equal(nudges[0].confidence, "medium", "heuristic live conditions should not overstate confidence");
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
  assert.match(nudges[1].evidenceLabel, /Category lens: work/, "category nudges should name the decision lens");
  assert.ok(
    nudges.every((nudge) => nudge.purposeLabel),
    "all work nudges should carry a purpose",
  );
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

// --- behavior.ts: sparse old patterns remain predictive ---
{
  const weather = { ...baseWeather, condition: "cloudy" };
  const read = buildBehavioralRead({ mood: 6, energy: "medium", weather });
  const unrelated = Array.from({ length: 25 }, (_, index) =>
    makeEntry({
      id: `unrelated-${index}`,
      decisionCategory: "social",
      decisionOutcome: "go_out",
      mood: 4,
      timestamp: new Date(2026, 6, 28 - index, 9, 0, 0).toISOString(),
    }),
  );
  const oldWorkPattern = [
    makeEntry({
      id: "old-work-1",
      decisionCategory: "work",
      decisionOutcome: "work",
      mood: 9,
      weather,
      timestamp: "2020-01-01T09:00:00.000Z",
    }),
    makeEntry({
      id: "old-work-2",
      decisionCategory: "work",
      decisionOutcome: "work",
      mood: 9,
      weather,
      timestamp: "2022-01-01T09:00:00.000Z",
    }),
  ];
  const entries = [...unrelated, ...oldWorkPattern];
  const readiness = buildDecisionReadiness({
    read,
    category: "work",
    mood: 6,
    energy: "medium",
    weather,
    entries,
  });
  assert.ok(
    readiness.drivers.includes("pattern mood 9.0"),
    "readiness should use matching old history beyond the former 20-entry window",
  );
  const nudges = buildRecommendationNudges({
    read,
    category: "work",
    mood: 6,
    energy: "medium",
    weather,
    entries,
  });
  const patternNudge = nudges.find((nudge) => nudge.id === "nudge-pattern-encourage");
  assert.ok(patternNudge, "recommendations should use sparse old matching patterns");
  assert.match(patternNudge.evidenceLabel, /2 similar cloudy\/work logs/);
  assert.match(patternNudge.purposeLabel, /matching history/, "pattern nudges should describe how history is useful");
  assert.equal(patternNudge.source, "history");
  assert.equal(patternNudge.confidence, "low", "two historical matches should remain an early signal");
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
  assert.ok(
    week.slice(0, 5).every((value) => value === null),
    "days with no entries should be explicitly missing",
  );
}

// --- personalize.ts: feedback is useful, stable, and time-bounded ---
{
  const now = new Date("2026-07-01T12:00:00.000Z");
  const nudges = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const feedback = [
    { nudgeId: "b", value: "helpful", timestamp: "2026-07-01T11:00:00.000Z" },
    { nudgeId: "a", value: "not_now", timestamp: "2026-07-01T11:00:00.000Z" },
  ];
  const ordered = personalizeNudges(nudges, feedback, now).map((n) => n.id);
  assert.deepEqual(ordered, ["b", "c", "a"], "helpful ranks first, not_now last, unrated stays in the middle");

  const untouched = personalizeNudges(nudges, [], now).map((n) => n.id);
  assert.deepEqual(untouched, ["a", "b", "c"], "no feedback should preserve original order");

  const staleNotNow = [{ nudgeId: "a", value: "not_now", timestamp: "2026-06-29T11:00:00.000Z" }];
  assert.deepEqual(
    personalizeNudges(nudges, staleNotNow, now).map((n) => n.id),
    ["a", "b", "c"],
    "not_now should stop influencing suggestions after one day",
  );
  assert.equal(activeNudgeFeedback(staleNotNow, "a", now), undefined, "stale feedback should not stay selected");

  const recentHelpful = [{ nudgeId: "b", value: "helpful", timestamp: "2026-06-10T12:00:00.000Z" }];
  assert.equal(activeNudgeFeedback(recentHelpful, "b", now), "helpful");
  const staleHelpful = [{ nudgeId: "b", value: "helpful", timestamp: "2026-05-01T12:00:00.000Z" }];
  assert.equal(activeNudgeFeedback(staleHelpful, "b", now), undefined, "helpful feedback should decay after 30 days");
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

  const balancedByDay = weeklyMoodDelta(
    [
      makeEntry({ mood: 10, timestamp: daysAgoIso(1) }),
      makeEntry({ mood: 10, timestamp: new Date(2026, 6, 19, 18, 0, 0).toISOString() }),
      makeEntry({ mood: 2, timestamp: daysAgoIso(2) }),
      makeEntry({ mood: 4, timestamp: daysAgoIso(8) }),
    ],
    today,
  );
  assert.equal(balancedByDay.current, 6, "each tracked day has equal weight even when one day has multiple logs");
}

// --- homeStats.ts: weekly weather signal ---
{
  const today = new Date(2026, 6, 20, 12, 0, 0);
  const recent = (daysAgo, condition) =>
    makeEntry({
      timestamp: new Date(2026, 6, 20 - daysAgo, 9, 0, 0).toISOString(),
      weather: { ...baseWeather, condition },
    });
  assert.equal(
    dominantWeeklyWeather([recent(1, "rainy"), recent(2, "rainy"), recent(3, "sunny")], today),
    "rainy",
    "the most frequently logged weekly weather is returned",
  );
  assert.equal(dominantWeeklyWeather([], today), null, "no weekly entries means no dominant weather");
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

// --- travelWeather.ts: destination weather alerts with cooldown safeguards ---
{
  const capturedAt = "2026-07-20T08:00:00.000Z";
  const sample = (overrides = {}) => ({
    latitude: 12.9716,
    longitude: 77.5946,
    capturedAt,
    weather: {
      condition: "cloudy",
      temperatureC: 24,
      humidity: 60,
      locationLabel: "Bengaluru",
      ...(overrides.weather || {}),
    },
    ...overrides,
  });
  const now = new Date("2026-07-20T10:00:00.000Z");

  assert.equal(TRAVEL_GEOFENCE_RADIUS_M, 5000, "travel monitoring ignores ordinary short-distance movement");

  const firstDestination = assessTravelWeather({}, sample(), now);
  assert.equal(firstDestination.shouldNotify, true, "the first destination sample produces a useful weather alert");
  assert.match(firstDestination.title, /Weather in Bengaluru/);
  assert.match(firstDestination.body, /Cloudy, 24°C/);

  const unchanged = assessTravelWeather(
    { lastSample: sample({ capturedAt: "2026-07-20T07:00:00.000Z" }) },
    sample(),
    now,
  );
  assert.equal(unchanged.shouldNotify, false, "unchanged weather in the same labelled place stays quiet");

  const changedCondition = assessTravelWeather(
    {
      lastSample: sample({
        capturedAt: "2026-07-20T07:00:00.000Z",
        weather: { condition: "sunny", temperatureC: 28, humidity: 48, locationLabel: "Bengaluru" },
      }),
    },
    sample({
      weather: { condition: "rainy", temperatureC: 23, humidity: 82, locationLabel: "Mysuru" },
    }),
    now,
  );
  assert.equal(changedCondition.shouldNotify, true);
  assert.ok(changedCondition.reasons.includes("condition"));
  assert.ok(changedCondition.reasons.includes("new_place"));
  assert.match(changedCondition.title, /Weather changed in Mysuru/);
  assert.match(changedCondition.body, /sunny to rainy/);

  const temperatureOnly = assessTravelWeather(
    { lastSample: sample() },
    sample({ weather: { condition: "cloudy", temperatureC: 29, humidity: 60, locationLabel: "Bengaluru" } }),
    now,
  );
  assert.equal(temperatureOnly.shouldNotify, true, "a five-degree shift is meaningful without a condition change");
  assert.deepEqual(temperatureOnly.reasons, ["temperature"]);
  assert.match(temperatureOnly.body, /5° warmer/);

  const placeOnly = assessTravelWeather(
    { lastSample: sample() },
    sample({ weather: { condition: "cloudy", temperatureC: 24, humidity: 60, locationLabel: "Mysuru" } }),
    now,
  );
  assert.equal(placeOnly.shouldNotify, true, "a clearly labelled new place receives its current weather");
  assert.deepEqual(placeOnly.reasons, ["new_place"]);

  const cooldown = assessTravelWeather(
    {
      lastSample: sample(),
      lastNotifiedAt: new Date(now.getTime() - TRAVEL_NOTIFICATION_COOLDOWN_MS + 60_000).toISOString(),
    },
    sample({ weather: { condition: "rainy", temperatureC: 20, humidity: 85, locationLabel: "Mysuru" } }),
    now,
  );
  assert.equal(cooldown.shouldNotify, false, "travel alerts are rate-limited");
  assert.ok(cooldown.reasons.includes("cooldown"));
  assert.equal(
    cooldown.nextState.lastSample.weather.locationLabel,
    "Mysuru",
    "the quiet sample becomes the new baseline",
  );

  assert.deepEqual(normalizeTravelWeatherState({ lastSample: { nope: true }, lastNotifiedAt: "bad-date" }), {});
}

// --- dayParts.ts: reminder-aligned time boundaries and full-history aggregation ---
{
  assert.equal(dayPartFor(new Date(2026, 6, 20, 5, 0, 0)), "morning");
  assert.equal(dayPartFor(new Date(2026, 6, 20, 11, 59, 0)), "morning");
  assert.equal(dayPartFor(new Date(2026, 6, 20, 12, 0, 0)), "afternoon");
  assert.equal(dayPartFor(new Date(2026, 6, 20, 17, 0, 0)), "evening");
  assert.equal(dayPartFor(new Date(2026, 6, 20, 21, 0, 0)), "night");
  assert.equal(dayPartFor(new Date(2026, 6, 20, 4, 59, 0)), "night");

  const entries = [
    makeEntry({ mood: 8, timestamp: new Date(2020, 0, 1, 9, 0, 0).toISOString(), weather: { condition: "sunny" } }),
    makeEntry({ mood: 6, timestamp: new Date(2026, 6, 20, 10, 0, 0).toISOString(), weather: { condition: "sunny" } }),
    makeEntry({ mood: 4, timestamp: new Date(2026, 6, 20, 13, 0, 0).toISOString(), weather: { condition: "rainy" } }),
    makeEntry({ mood: 9, timestamp: new Date(2026, 6, 20, 22, 0, 0).toISOString(), weather: { condition: "cloudy" } }),
  ];
  const insights = buildDayPartInsights(entries);
  assert.equal(insights.length, 4, "all four parts of the day are always represented");
  assert.equal(insights[0].averageMood, 7, "morning averages include old and recent history");
  assert.equal(insights[0].checkIns, 2);
  assert.equal(insights[0].dominantWeather, "sunny");
  assert.equal(insights[1].averageMood, 4);
  assert.equal(insights[2].averageMood, null, "a missing time period remains explicitly empty");
  assert.equal(insights[2].checkIns, 0);
  assert.equal(insights[3].averageMood, 9);
}

// --- reflections.ts: one transparent, bounded qualitative signal per day ---
{
  const now = new Date(2026, 6, 20, 22, 0, 0);
  const goodReflection = {
    id: "reflection-2026-07-20",
    userId: "local",
    rating: "good",
    factors: ["work", "movement"],
    note: "Focused work and a walk helped.",
    timestamp: now.toISOString(),
  };
  const olderRoughReflection = {
    id: "reflection-2026-07-19",
    userId: "local",
    rating: "rough",
    factors: ["screen_time", "rest"],
    timestamp: new Date(2026, 6, 19, 22, 0, 0).toISOString(),
  };

  assert.equal(dayRatingScore("rough"), 3);
  assert.equal(dayRatingScore("great"), 9);
  assert.equal(reflectionForDay([goodReflection], now)?.note, "Focused work and a walk helped.");

  const replacement = { ...goodReflection, rating: "great", timestamp: new Date(2026, 6, 20, 23, 0, 0).toISOString() };
  const upserted = upsertDailyReflection([goodReflection, olderRoughReflection], replacement);
  assert.equal(upserted.length, 2, "saving again replaces the same local day");
  assert.equal(upserted[0].rating, "great");

  const summary = buildReflectionSummary([goodReflection, olderRoughReflection]);
  assert.equal(summary.count, 2);
  assert.equal(summary.averageScore, 5, "good 7 and rough 3 average to 5");
  assert.equal(summary.topFactor, "work", "factor ties use the stable displayed order");

  const recentSignal = recentReflectionReadinessSignal([goodReflection], now);
  assert.deepEqual(recentSignal, { score: 7, adjustment: 2, label: "Good" });
  assert.equal(
    recentReflectionReadinessSignal([{ ...olderRoughReflection, timestamp: "2020-01-01T22:00:00.000Z" }], now),
    null,
    "old reflections remain historical context and do not adjust current readiness",
  );

  const read = buildBehavioralRead({ mood: 6, energy: "medium", weather: baseWeather });
  const baseline = buildDecisionReadiness({
    read,
    category: "work",
    mood: 6,
    energy: "medium",
    weather: baseWeather,
    entries: [],
  });
  const withRecentReflection = buildDecisionReadiness({
    read,
    category: "work",
    mood: 6,
    energy: "medium",
    weather: baseWeather,
    entries: [],
    reflections: [{ ...goodReflection, timestamp: new Date().toISOString() }],
  });
  assert.equal(withRecentReflection.score, baseline.score + 2, "a good recent day adds only its bounded adjustment");
  assert.ok(
    withRecentReflection.drivers.some((driver) => driver.includes("latest day reflection 7/10 (+2)")),
    "readiness discloses exactly how the reflection was quantified",
  );
}

// --- weekMood.ts: buildWeekDays real labels + today flag ---
{
  const today = new Date(2026, 6, 15, 12, 0, 0);
  const days = buildWeekDays([makeEntry({ mood: 8, timestamp: new Date(2026, 6, 15, 9, 0, 0).toISOString() })], today);
  assert.equal(days.length, 7, "seven day slots");
  assert.equal(days[6].isToday, true, "the last slot is today");
  assert.equal(days[6].value, 8, "today reflects today's check-in");
  assert.equal(days[6].hasData, true, "today is marked as tracked");
  assert.ok(
    days.slice(0, 6).every((day) => day.value === null && !day.hasData),
    "missing days stay explicit",
  );
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
