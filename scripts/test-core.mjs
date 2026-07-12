import assert from "node:assert/strict";
import { normalizeBackupPayload } from "../apps/mobile/src/lib/backupValidation.ts";
import { summarizeHealth, emptyDiagnostics } from "../apps/mobile/src/lib/diagnostics.ts";
import { buildDecisionForecast } from "../apps/mobile/src/lib/forecast.ts";
import {
  normalizeStoredEntries,
  normalizeStoredPreferences,
  resolveStoredVersion,
} from "../apps/mobile/src/lib/storage.ts";
import { mergeSnapshots } from "../apps/mobile/src/lib/sync.ts";
import {
  fromRemoteCheckIn,
  fromRemoteFeedback,
  toRemoteCheckIn,
  toRemoteFeedback,
} from "../apps/mobile/src/lib/syncMappers.ts";
import { buildSummary } from "../apps/mobile/src/lib/summary.ts";
import {
  buildOpenMeteoCurrentUrl,
  buildLocalWeatherSnapshot,
  describeWeatherSource,
  fetchOpenMeteoCurrentWeather,
  formatWeatherSource,
  normalizeOpenMeteoCurrentResponse,
} from "../apps/mobile/src/lib/weather.ts";

const validEntry = {
  id: "entry-1",
  userId: "local",
  mood: 7,
  energy: "medium",
  decisionCategory: "social",
  decisionOutcome: "go_out",
  note: "felt ready",
  weather: {
    condition: "cloudy",
    temperatureC: 24,
    humidity: 62,
    locationLabel: "Bengaluru",
  },
  timestamp: "2026-06-21T11:00:00.000Z",
};

const validPayload = {
  app: "weathered",
  version: 1,
  exportedAt: "2026-06-21T11:01:00.000Z",
  entries: [validEntry],
  feedback: [
    {
      nudgeId: "nudge-1",
      value: "helpful",
      timestamp: "2026-06-21T11:02:00.000Z",
    },
  ],
};

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function entry(overrides = {}) {
  return {
    ...validEntry,
    id: `entry-${Math.random().toString(36).slice(2)}`,
    timestamp: daysAgo(1),
    ...overrides,
    weather: {
      ...validEntry.weather,
      ...(overrides.weather || {}),
    },
  };
}

const normalized = normalizeBackupPayload(validPayload);
assert.ok(normalized, "valid backup payload should normalize");
assert.equal(normalized.entries.length, 1);
assert.equal(normalized.entries[0].decisionOutcome, "go_out");
assert.equal(normalized.feedback.length, 1);

const missingIdentityPayload = {
  ...validPayload,
  entries: [{ ...validEntry, id: "", userId: "" }],
};
const normalizedMissingIdentity = normalizeBackupPayload(missingIdentityPayload);
assert.ok(normalizedMissingIdentity, "backup entries without ids should be migrated");
assert.match(normalizedMissingIdentity.entries[0].id, /^restored-/);
assert.equal(normalizedMissingIdentity.entries[0].userId, "local");

assert.equal(
  normalizeBackupPayload({ ...validPayload, entries: [{ ...validEntry, mood: 11 }] }),
  null,
  "mood above 10 should be rejected",
);

assert.equal(
  normalizeBackupPayload({
    ...validPayload,
    entries: [{ ...validEntry, weather: { ...validEntry.weather, humidity: 130 } }],
  }),
  null,
  "humidity above 100 should be rejected",
);

const invalidFeedbackPayload = {
  ...validPayload,
  feedback: [{ nudgeId: "nudge-1", value: "later", timestamp: "2026-06-21T11:02:00.000Z" }],
};
const normalizedInvalidFeedback = normalizeBackupPayload(invalidFeedbackPayload);
assert.ok(normalizedInvalidFeedback, "invalid feedback should not invalidate valid entries");
assert.equal(normalizedInvalidFeedback.feedback.length, 0);

const weeklySummary = buildSummary([
  entry({
    id: "recent-rain-social-1",
    mood: 4,
    energy: "low",
    decisionCategory: "social",
    decisionOutcome: "cancel",
    weather: { condition: "rainy", temperatureC: 22, humidity: 88 },
    timestamp: daysAgo(1),
  }),
  entry({
    id: "recent-rain-social-2",
    mood: 5,
    decisionCategory: "social",
    decisionOutcome: "cancel",
    weather: { condition: "rainy", temperatureC: 23, humidity: 84 },
    timestamp: daysAgo(2),
  }),
  entry({
    id: "recent-sunny-work",
    mood: 8,
    energy: "high",
    decisionCategory: "work",
    decisionOutcome: "work",
    weather: { condition: "sunny", temperatureC: 27, humidity: 50 },
    timestamp: daysAgo(3),
  }),
  entry({
    id: "old-entry",
    mood: 10,
    decisionCategory: "spending",
    decisionOutcome: "buy",
    timestamp: daysAgo(21),
  }),
]);
assert.equal(weeklySummary.totalEntries, 3, "weekly summary should ignore entries older than 7 days");
assert.equal(weeklySummary.averageMood, 5.7, "weekly summary should average recent moods");
assert.equal(weeklySummary.decisionCounts.social, 2);
assert.equal(weeklySummary.decisionCounts.work, 1);
assert.equal(weeklySummary.decisionCounts.spending, 0);
assert.equal(weeklySummary.topInsights[0].id, "weekly-rainy-social-cancel");
assert.ok(
  weeklySummary.guidance.some((item) => item.id === "guidance-rainy-social"),
  "weekly guidance should include rainy social buffer when recent rainy cancellations exist",
);

const rainyForecast = buildDecisionForecast(
  [],
  {
    condition: "rainy",
    temperatureC: 23,
    humidity: 90,
    locationLabel: "Local estimate",
  },
  { mood: 4, energy: "low" },
);
assert.equal(rainyForecast.id, "forecast-rain-social-buffer");
assert.equal(rainyForecast.categoryFocus, "social");
assert.equal(rainyForecast.confidence, "low");

const sunnyForecast = buildDecisionForecast(
  [],
  {
    condition: "sunny",
    temperatureC: 27,
    humidity: 52,
    locationLabel: "Local estimate",
  },
  { mood: 7, energy: "high" },
);
assert.equal(sunnyForecast.id, "forecast-sunny-window");
assert.equal(sunnyForecast.confidence, "medium");
assert.ok(sunnyForecast.signalStrength >= 70, "sunny high-energy forecast should carry useful signal strength");

const monsoonEstimate = buildLocalWeatherSnapshot("seasonal_mock", new Date("2026-07-01T00:00:00.000Z"));
assert.equal(monsoonEstimate.condition, "rainy");
assert.equal(monsoonEstimate.locationLabel, "Local estimate");
assert.equal(formatWeatherSource("live_ready"), "live");
assert.equal(describeWeatherSource("live_ready").provider, "Open-Meteo");
assert.equal(describeWeatherSource("daily_mock").readiness, "Prototype mode");

const openMeteoUrl = new URL(
  buildOpenMeteoCurrentUrl({
    latitude: 12.9716,
    longitude: 77.5946,
  }),
);
assert.equal(openMeteoUrl.origin, "https://api.open-meteo.com");
assert.equal(openMeteoUrl.pathname, "/v1/forecast");
assert.equal(openMeteoUrl.searchParams.get("latitude"), "12.9716");
assert.equal(openMeteoUrl.searchParams.get("longitude"), "77.5946");
assert.equal(openMeteoUrl.searchParams.get("current"), "temperature_2m,relative_humidity_2m,weather_code");
assert.equal(openMeteoUrl.searchParams.get("timezone"), "auto");
assert.equal(openMeteoUrl.searchParams.has("api_key"), false);
assert.equal(openMeteoUrl.searchParams.has("apikey"), false);
assert.equal(openMeteoUrl.searchParams.has("token"), false);

assert.deepEqual(
  normalizeOpenMeteoCurrentResponse(
    {
      current: {
        temperature_2m: 27.6,
        relative_humidity_2m: 61.2,
        weather_code: 61,
      },
    },
    "Bengaluru",
  ),
  {
    condition: "rainy",
    temperatureC: 28,
    humidity: 61,
    locationLabel: "Bengaluru",
  },
);
assert.throws(
  () => normalizeOpenMeteoCurrentResponse({ current: { temperature_2m: 28 } }, "Bengaluru"),
  /missing current weather fields/,
);

let weatherFetchAttempts = 0;
const retriedWeather = await fetchOpenMeteoCurrentWeather(
  { latitude: 12.9716, longitude: 77.5946, label: "Bengaluru" },
  async (url) => {
    weatherFetchAttempts += 1;
    assert.ok(url.includes("api.open-meteo.com/v1/forecast"));

    if (weatherFetchAttempts === 1) {
      throw new Error("temporary network failure");
    }

    return {
      ok: true,
      status: 200,
      async json() {
        return {
          current: {
            temperature_2m: 29.1,
            relative_humidity_2m: 57.8,
            weather_code: 2,
          },
        };
      },
    };
  },
);
assert.equal(weatherFetchAttempts, 2);
assert.equal(retriedWeather.condition, "cloudy");
assert.equal(retriedWeather.temperatureC, 29);
assert.equal(retriedWeather.humidity, 58);
assert.equal(retriedWeather.locationLabel, "Bengaluru");

const migratedEntries = normalizeStoredEntries([{ ...validEntry, id: "" }], []);
assert.match(migratedEntries[0].id, /^migrated-/);
assert.deepEqual(normalizeStoredEntries("not-an-array", [validEntry]), [validEntry]);
assert.equal(normalizeStoredPreferences({ weatherSourceMode: "daily_mock" }).weatherSourceMode, "daily_mock");
assert.equal(normalizeStoredPreferences({ weatherSourceMode: "bad-mode" }).weatherSourceMode, "live_ready");
assert.equal(normalizeStoredPreferences(null).weatherSourceMode, "live_ready");
assert.equal(
  normalizeStoredPreferences({ weatherSourceMode: "live_ready" }).onboardingComplete,
  false,
  "onboardingComplete defaults to false",
);
assert.equal(
  normalizeStoredPreferences({ weatherSourceMode: "live_ready", onboardingComplete: true }).onboardingComplete,
  true,
  "onboardingComplete is preserved when valid",
);
assert.equal(
  normalizeStoredPreferences({ weatherSourceMode: "live_ready" }).themeMode,
  "dark",
  "themeMode defaults to dark",
);
assert.equal(
  normalizeStoredPreferences({ weatherSourceMode: "live_ready", themeMode: "light" }).themeMode,
  "light",
  "themeMode is preserved when valid",
);
assert.equal(
  normalizeStoredPreferences({ weatherSourceMode: "live_ready", themeMode: "neon" }).themeMode,
  "dark",
  "invalid themeMode falls back to dark",
);

assert.equal(summarizeHealth(emptyDiagnostics).label, "Healthy");
assert.equal(
  summarizeHealth({
    ...emptyDiagnostics,
    weather: { ...emptyDiagnostics.weather, status: "permission_denied" },
  }).label,
  "Location off",
);
assert.equal(
  summarizeHealth({
    ...emptyDiagnostics,
    storage: { ...emptyDiagnostics.storage, writeFailureCount: 1 },
  }).label,
  "Needs attention",
);

// --- storage.ts: schema version resolver ---
assert.equal(resolveStoredVersion(null), 1, "missing version defaults to 1");
assert.equal(resolveStoredVersion(2), 2, "integer version is kept");
assert.equal(resolveStoredVersion("3"), 3, "numeric string version is parsed");
assert.equal(resolveStoredVersion("bad"), 1, "non-numeric version falls back to 1");
assert.equal(resolveStoredVersion(0), 1, "zero falls back to 1");
assert.equal(resolveStoredVersion(-4), 1, "negative falls back to 1");

// --- sync.ts: last-write-wins snapshot merge ---
const mergeLocal = {
  entries: [{ id: "a", timestamp: "2026-07-01T00:00:00.000Z", mood: 5 }],
  feedback: [{ nudgeId: "n1", value: "not_now", timestamp: "2026-07-01T00:00:00.000Z" }],
};
const mergeRemote = {
  entries: [
    { id: "a", timestamp: "2026-07-05T00:00:00.000Z", mood: 8 },
    { id: "b", timestamp: "2026-07-03T00:00:00.000Z", mood: 6 },
  ],
  feedback: [{ nudgeId: "n1", value: "helpful", timestamp: "2026-07-04T00:00:00.000Z" }],
};
const merged = mergeSnapshots(mergeLocal, mergeRemote);
assert.equal(merged.entries.length, 2, "entries dedupe by id");
assert.equal(merged.entries.find((entry) => entry.id === "a").mood, 8, "newest timestamp wins for a conflicting id");
assert.equal(merged.entries[0].id, "a", "merged entries are sorted newest first");
assert.equal(merged.feedback.length, 1, "feedback dedupes by nudgeId");
assert.equal(merged.feedback[0].value, "helpful", "newest feedback wins");

// --- syncMappers.ts: remote row round-trip ---
const remoteEntry = toRemoteCheckIn(validEntry, "user-1");
assert.equal(remoteEntry.user_id, "user-1");
assert.equal(remoteEntry.decision_category, validEntry.decisionCategory, "camelCase maps to snake_case");
assert.equal(remoteEntry.decision_outcome, validEntry.decisionOutcome);
assert.equal(remoteEntry.note, validEntry.note);
const roundTripEntry = fromRemoteCheckIn(remoteEntry);
assert.equal(roundTripEntry.id, validEntry.id);
assert.equal(roundTripEntry.decisionCategory, validEntry.decisionCategory, "snake_case maps back to camelCase");
assert.equal(roundTripEntry.decisionOutcome, validEntry.decisionOutcome);
assert.equal(roundTripEntry.userId, "local", "pulled rows use the local userId marker");
assert.deepEqual(roundTripEntry.weather, validEntry.weather);

const remoteNoNote = toRemoteCheckIn({ ...validEntry, note: undefined }, "user-1");
assert.equal(remoteNoNote.note, null, "missing note becomes null for the database");
assert.equal(fromRemoteCheckIn(remoteNoNote).note, undefined, "null note maps back to undefined");

const remoteFeedback = toRemoteFeedback(
  { nudgeId: "n1", value: "helpful", timestamp: "2026-07-01T00:00:00.000Z" },
  "user-1",
);
assert.equal(remoteFeedback.nudge_id, "n1");
assert.equal(remoteFeedback.user_id, "user-1");
assert.equal(fromRemoteFeedback(remoteFeedback).nudgeId, "n1");
assert.equal(fromRemoteFeedback(remoteFeedback).value, "helpful");

console.log("Core smoke tests passed.");
