import assert from "node:assert/strict";
import { normalizeBackupPayload } from "../apps/mobile/src/lib/backupValidation.ts";
import {
  buildBehavioralRead,
  buildDecisionReadiness,
  buildRecommendationNudges,
} from "../apps/mobile/src/lib/behavior.ts";
import { buildDecisionForecast } from "../apps/mobile/src/lib/forecast.ts";
import { buildInsight } from "../apps/mobile/src/lib/insights.ts";
import {
  normalizeStoredEntries,
  normalizeStoredFeedback,
  normalizeStoredPreferences,
} from "../apps/mobile/src/lib/storage.ts";
import { buildSummary, isWithinLast7Days } from "../apps/mobile/src/lib/summary.ts";

const CATEGORIES = ["social", "work", "spending", "other"];
const OUTCOMES = {
  social: ["go_out", "cancel"],
  work: ["work", "skip"],
  spending: ["buy", "avoid"],
  other: ["note_only"],
};
const ENERGIES = ["low", "medium", "high"];
const CONDITIONS = ["sunny", "cloudy", "rainy"];
const ENTRY_LIMIT = 5000;
const nowMs = Date.now();

function isoDaysAgo(days, offsetMinutes = 0) {
  return new Date(nowMs - days * 24 * 60 * 60 * 1000 - offsetMinutes * 60 * 1000).toISOString();
}

function makeEntry(index, daysAgo = index % 30) {
  const category = CATEGORIES[index % CATEGORIES.length];
  const condition = CONDITIONS[index % CONDITIONS.length];

  return {
    id: `stress-${index}`,
    userId: "local",
    mood: (index % 10) + 1,
    energy: ENERGIES[index % ENERGIES.length],
    decisionCategory: category,
    decisionOutcome: OUTCOMES[category][index % OUTCOMES[category].length],
    note: index % 5 === 0 ? `stress note ${index}` : undefined,
    weather: {
      condition,
      temperatureC: condition === "rainy" ? 23 : condition === "sunny" ? 31 : 26,
      humidity: condition === "rainy" ? 88 : condition === "sunny" ? 48 : 66,
      locationLabel: "Stress City",
    },
    timestamp: isoDaysAgo(daysAgo, index % 1440),
  };
}

function measure(label, fn) {
  const startedAt = Date.now();
  const value = fn();
  const durationMs = Date.now() - startedAt;
  return { label, value, durationMs };
}

async function measureAsync(label, fn) {
  const startedAt = Date.now();
  const value = await fn();
  const durationMs = Date.now() - startedAt;
  return { label, value, durationMs };
}

const entries = Array.from({ length: ENTRY_LIMIT }, (_, index) => makeEntry(index));
const payload = {
  app: "weathered",
  version: 1,
  exportedAt: new Date(nowMs).toISOString(),
  entries,
  feedback: Array.from({ length: 250 }, (_, index) => ({
    nudgeId: `nudge-${index}`,
    value: index % 2 === 0 ? "helpful" : "not_now",
    timestamp: isoDaysAgo(index % 10),
  })),
};

const results = [];

const normalizedResult = measure("normalize 5000-entry backup", () => normalizeBackupPayload(payload));
results.push(normalizedResult);
assert.ok(normalizedResult.value, "large valid backup should normalize");
assert.equal(normalizedResult.value.entries.length, ENTRY_LIMIT);
assert.equal(normalizedResult.value.feedback.length, 250);

const summaryResult = measure("build weekly summary from 5000 entries", () => buildSummary(normalizedResult.value.entries));
results.push(summaryResult);
assert.ok(summaryResult.value.totalEntries > 0, "stress summary should include recent entries");
assert.ok(summaryResult.value.totalEntries < ENTRY_LIMIT, "stress summary should exclude old entries");
assert.ok(summaryResult.value.averageMood >= 1 && summaryResult.value.averageMood <= 10);
assert.equal(
  Object.values(summaryResult.value.decisionCounts).reduce((sum, count) => sum + count, 0),
  summaryResult.value.totalEntries,
);
assert.ok(summaryResult.value.topInsights.length > 0);
assert.ok(summaryResult.value.guidance.length > 0);

const currentEntry = normalizedResult.value.entries[0];
const insightResult = measure("build insight from 5000 entries", () => buildInsight(currentEntry, normalizedResult.value.entries));
results.push(insightResult);
assert.ok(insightResult.value, "stress insight should return a safe result");
assert.ok(["low", "medium", "high"].includes(insightResult.value.confidence));

const forecastResult = measure("build forecast from 5000 entries", () =>
  buildDecisionForecast(normalizedResult.value.entries, currentEntry.weather, {
    mood: currentEntry.mood,
    energy: currentEntry.energy,
  }),
);
results.push(forecastResult);
assert.ok(forecastResult.value.signalStrength >= 0 && forecastResult.value.signalStrength <= 100);

const behavioralRead = buildBehavioralRead({
  mood: currentEntry.mood,
  energy: currentEntry.energy,
  weather: currentEntry.weather,
});
const readinessResult = measure("build readiness from 5000 entries", () =>
  buildDecisionReadiness({
    read: behavioralRead,
    category: currentEntry.decisionCategory,
    mood: currentEntry.mood,
    energy: currentEntry.energy,
    weather: currentEntry.weather,
    entries: normalizedResult.value.entries,
  }),
);
results.push(readinessResult);
assert.ok(readinessResult.value.score >= 0 && readinessResult.value.score <= 100);

const nudgeResult = measure("build nudges from 5000 entries", () =>
  buildRecommendationNudges({
    read: behavioralRead,
    category: currentEntry.decisionCategory,
    mood: currentEntry.mood,
    energy: currentEntry.energy,
    weather: currentEntry.weather,
    entries: normalizedResult.value.entries,
  }),
);
results.push(nudgeResult);
assert.ok(nudgeResult.value.length >= 1 && nudgeResult.value.length <= 3);

const storedResult = measure("normalize local stored entries from 5000 entries", () =>
  normalizeStoredEntries(normalizedResult.value.entries, []),
);
results.push(storedResult);
assert.equal(storedResult.value.length, ENTRY_LIMIT);
const seedEntry = makeEntry(999);
assert.deepEqual(normalizeStoredEntries([{ ...makeEntry(1), mood: 99 }], [seedEntry]), [seedEntry]);
assert.deepEqual(normalizeStoredEntries([null], [seedEntry]), [seedEntry]);
assert.deepEqual(normalizeStoredEntries([{ ...makeEntry(1), note: 7 }], [seedEntry]), [seedEntry]);
assert.deepEqual(
  normalizeStoredEntries(Array.from({ length: ENTRY_LIMIT + 1 }, (_, index) => makeEntry(index)), [seedEntry]),
  [seedEntry],
);

const migratedStoredEntry = normalizeStoredEntries([{ ...makeEntry(2), id: "", userId: "", note: "" }], []);
assert.equal(migratedStoredEntry.length, 1);
assert.ok(migratedStoredEntry[0].id.startsWith("migrated-"));
assert.equal(migratedStoredEntry[0].userId, "local");
assert.equal(migratedStoredEntry[0].note, undefined);

assert.equal(normalizeStoredFeedback(payload.feedback).length, payload.feedback.length);
assert.equal(normalizeStoredFeedback([...payload.feedback, { nudgeId: "", value: "helpful", timestamp: isoDaysAgo(1) }]).length, payload.feedback.length);
assert.equal(normalizeStoredFeedback([{ nudgeId: "nudge", value: "helpful", timestamp: `${"2".repeat(80)}-01-01` }]).length, 0);
assert.equal(
  normalizeStoredFeedback(Array.from({ length: ENTRY_LIMIT + 1 }, (_, index) => ({
    nudgeId: `nudge-${index}`,
    value: "helpful",
    timestamp: isoDaysAgo(1),
  }))).length,
  0,
);

assert.equal(
  normalizeBackupPayload({
    ...payload,
    entries: Array.from({ length: ENTRY_LIMIT + 1 }, (_, index) => makeEntry(index)),
  }),
  null,
  "backup over entry limit should be rejected",
);
assert.equal(
  normalizeBackupPayload({
    ...payload,
    feedback: Array.from({ length: ENTRY_LIMIT + 1 }, (_, index) => ({
      nudgeId: `nudge-${index}`,
      value: "helpful",
      timestamp: isoDaysAgo(1),
    })),
  }),
  null,
  "backup over feedback limit should be rejected",
);
assert.equal(
  normalizeBackupPayload({
    ...payload,
    entries: [{ ...makeEntry(1), note: "x".repeat(121) }],
  }),
  null,
  "backup note above UI limit should be rejected",
);
assert.equal(
  normalizeBackupPayload({
    ...payload,
    entries: [{ ...makeEntry(1), weather: { ...makeEntry(1).weather, temperatureC: 1000 } }],
  }),
  null,
  "impossible weather temperature should be rejected",
);
assert.equal(
  normalizeBackupPayload({
    ...payload,
    entries: [{ ...makeEntry(1), weather: { ...makeEntry(1).weather, locationLabel: "" } }],
  }),
  null,
  "blank weather location should be rejected",
);
assert.equal(
  normalizeBackupPayload({
    ...payload,
    entries: [{ ...makeEntry(1), timestamp: `${"2".repeat(80)}-01-01T00:00:00.000Z` }],
  }),
  null,
  "oversized timestamps should be rejected",
);

const emptyNotePayload = normalizeBackupPayload({
  ...payload,
  entries: [{ ...makeEntry(1), note: "" }],
});
assert.ok(emptyNotePayload);
assert.equal(emptyNotePayload.entries[0].note, undefined);
assert.equal(
  normalizeBackupPayload({
    ...payload,
    feedback: [{ nudgeId: "", value: "helpful", timestamp: isoDaysAgo(1) }],
  })?.feedback.length,
  0,
);
assert.equal(
  normalizeBackupPayload({
    ...payload,
    feedback: [{ nudgeId: "nudge", value: "helpful", timestamp: `${"2".repeat(80)}-01-01` }],
  })?.feedback.length,
  0,
);

assert.equal(isWithinLast7Days(new Date(nowMs + 60_000).toISOString(), nowMs), false);
assert.equal(isWithinLast7Days(isoDaysAgo(8), nowMs), false);
assert.equal(isWithinLast7Days(isoDaysAgo(1), nowMs), true);
assert.equal(normalizeStoredPreferences({ weatherSourceMode: "seasonal_mock" }).weatherSourceMode, "seasonal_mock");
assert.equal(normalizeStoredPreferences({ weatherSourceMode: "external_api" }).weatherSourceMode, "live_ready");

const slowest = results.reduce((best, item) => (item.durationMs > best.durationMs ? item : best), results[0]);
assert.ok(slowest.durationMs < 2500, `${slowest.label} took ${slowest.durationMs}ms`);

for (const result of results) {
  console.log(`${result.label}: ${result.durationMs}ms`);
}
console.log("Data stress tests passed.");
