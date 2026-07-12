import type { DecisionLogInput, RecommendationFeedback, ThemeMode, WeatherSourceMode } from "@weathered/shared";

const STORAGE_KEY = "weathered.local.entries.v1";
const PREFERENCES_KEY = "weathered.local.preferences.v1";
const NUDGE_FEEDBACK_KEY = "weathered.local.nudge-feedback.v1";
const ENERGY_LEVELS = ["low", "medium", "high"] as const;
const DECISION_CATEGORIES = ["social", "work", "spending", "other"] as const;
const DECISION_OPTIONS = {
  social: ["go_out", "cancel"],
  work: ["work", "skip"],
  spending: ["buy", "avoid"],
  other: ["note_only"],
} as const;
const MAX_STORED_ENTRIES = 5000;
const MAX_STORED_FEEDBACK = 5000;
const MAX_ID_LENGTH = 160;
const MAX_USER_ID_LENGTH = 80;
const MAX_NOTE_LENGTH = 120;
const MAX_LOCATION_LABEL_LENGTH = 120;
const MAX_TIMESTAMP_LENGTH = 40;

interface AsyncStorageApi {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export interface LocalPreferences {
  weatherSourceMode: WeatherSourceMode;
  onboardingComplete: boolean;
  themeMode: ThemeMode;
}

const defaultPreferences: LocalPreferences = {
  weatherSourceMode: "live_ready",
  onboardingComplete: false,
  themeMode: "dark",
};

type DecisionCategory = (typeof DECISION_CATEGORIES)[number];

function withLocalDefaults(entries: unknown[]): unknown[] {
  return entries.map((entry, index) => {
    if (!isRecord(entry)) {
      return entry;
    }

    const timestamp = typeof entry.timestamp === "string" ? entry.timestamp : `unknown-${index}`;
    const fallbackId = `migrated-${timestamp}-${index}`;
    const id =
      entry.id === undefined || entry.id === null || (typeof entry.id === "string" && !entry.id.trim())
        ? fallbackId
        : entry.id;
    const userId =
      entry.userId === undefined || entry.userId === null || (typeof entry.userId === "string" && !entry.userId.trim())
        ? "local"
        : entry.userId;
    const note = typeof entry.note === "string" && !entry.note.trim() ? undefined : entry.note;

    return {
      ...entry,
      id,
      userId,
      note,
    };
  });
}

async function getAsyncStorage(): Promise<AsyncStorageApi> {
  const module = await import("@react-native-async-storage/async-storage");
  return module.default;
}

export function normalizeStoredEntries(value: unknown, seedEntries: DecisionLogInput[]): DecisionLogInput[] {
  if (!Array.isArray(value) || value.length > MAX_STORED_ENTRIES) {
    return seedEntries;
  }

  const normalized = withLocalDefaults(value);
  const entries = normalized.filter(isStoredEntry);

  return entries.length === normalized.length ? entries : seedEntries;
}

export function normalizeStoredFeedback(value: unknown): RecommendationFeedback[] {
  if (!Array.isArray(value) || value.length > MAX_STORED_FEEDBACK) {
    return [];
  }

  return value.filter(isRecommendationFeedback);
}

export function normalizeStoredPreferences(value: unknown): LocalPreferences {
  if (!isRecord(value)) {
    return defaultPreferences;
  }

  return {
    weatherSourceMode: isWeatherSourceMode(value.weatherSourceMode)
      ? value.weatherSourceMode
      : defaultPreferences.weatherSourceMode,
    onboardingComplete:
      typeof value.onboardingComplete === "boolean" ? value.onboardingComplete : defaultPreferences.onboardingComplete,
    themeMode:
      value.themeMode === "light" || value.themeMode === "dark" ? value.themeMode : defaultPreferences.themeMode,
  };
}

export async function loadEntries(seedEntries: DecisionLogInput[]): Promise<DecisionLogInput[]> {
  try {
    const AsyncStorage = await getAsyncStorage();
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seedEntries));
      return seedEntries;
    }

    return normalizeStoredEntries(JSON.parse(raw), seedEntries);
  } catch {
    return seedEntries;
  }
}

export async function saveEntries(entries: DecisionLogInput[]): Promise<boolean> {
  try {
    const AsyncStorage = await getAsyncStorage();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

export async function loadPreferences(): Promise<LocalPreferences> {
  try {
    const AsyncStorage = await getAsyncStorage();
    const raw = await AsyncStorage.getItem(PREFERENCES_KEY);

    if (!raw) {
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(defaultPreferences));
      return defaultPreferences;
    }

    return normalizeStoredPreferences(JSON.parse(raw));
  } catch {
    return defaultPreferences;
  }
}

export async function savePreferences(preferences: LocalPreferences): Promise<boolean> {
  try {
    const AsyncStorage = await getAsyncStorage();
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}

export async function loadRecommendationFeedback(): Promise<RecommendationFeedback[]> {
  try {
    const AsyncStorage = await getAsyncStorage();
    const raw = await AsyncStorage.getItem(NUDGE_FEEDBACK_KEY);
    if (!raw) {
      return [];
    }

    return normalizeStoredFeedback(JSON.parse(raw));
  } catch {
    return [];
  }
}

export async function saveRecommendationFeedback(feedback: RecommendationFeedback[]): Promise<boolean> {
  try {
    const AsyncStorage = await getAsyncStorage();
    await AsyncStorage.setItem(NUDGE_FEEDBACK_KEY, JSON.stringify(feedback));
    return true;
  } catch {
    return false;
  }
}

function isWeatherSourceMode(value: unknown): value is WeatherSourceMode {
  return value === "daily_mock" || value === "seasonal_mock" || value === "live_ready";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isStoredEntry(value: unknown): value is DecisionLogInput {
  if (!isRecord(value)) {
    return false;
  }

  if (!isBoundedString(value.id, MAX_ID_LENGTH) || !value.id.trim()) {
    return false;
  }

  if (!isBoundedString(value.userId, MAX_USER_ID_LENGTH) || !value.userId.trim()) {
    return false;
  }

  if (value.note !== undefined && !isBoundedString(value.note, MAX_NOTE_LENGTH)) {
    return false;
  }

  return (
    typeof value.mood === "number" &&
    Number.isFinite(value.mood) &&
    value.mood >= 1 &&
    value.mood <= 10 &&
    isEnergy(value.energy) &&
    isDecisionCategory(value.decisionCategory) &&
    isDecisionOutcome(value.decisionCategory, value.decisionOutcome) &&
    isWeatherSnapshot(value.weather) &&
    isBoundedString(value.timestamp, MAX_TIMESTAMP_LENGTH) &&
    !Number.isNaN(Date.parse(value.timestamp))
  );
}

function isBoundedString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length <= maxLength;
}

function isEnergy(value: unknown): value is DecisionLogInput["energy"] {
  return typeof value === "string" && ENERGY_LEVELS.includes(value as DecisionLogInput["energy"]);
}

function isDecisionCategory(value: unknown): value is DecisionCategory {
  return typeof value === "string" && DECISION_CATEGORIES.includes(value as DecisionCategory);
}

function isDecisionOutcome(category: DecisionCategory, value: unknown): value is DecisionLogInput["decisionOutcome"] {
  return typeof value === "string" && DECISION_OPTIONS[category].includes(value as never);
}

function isWeatherSnapshot(value: unknown): value is DecisionLogInput["weather"] {
  if (!isRecord(value)) return false;

  return (
    (value.condition === "sunny" || value.condition === "cloudy" || value.condition === "rainy") &&
    typeof value.temperatureC === "number" &&
    Number.isFinite(value.temperatureC) &&
    value.temperatureC >= -80 &&
    value.temperatureC <= 80 &&
    typeof value.humidity === "number" &&
    Number.isFinite(value.humidity) &&
    value.humidity >= 0 &&
    value.humidity <= 100 &&
    isBoundedString(value.locationLabel, MAX_LOCATION_LABEL_LENGTH) &&
    value.locationLabel.trim().length > 0
  );
}

function isRecommendationFeedback(value: unknown): value is RecommendationFeedback {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isBoundedString(value.nudgeId, MAX_ID_LENGTH) &&
    value.nudgeId.trim().length > 0 &&
    (value.value === "helpful" || value.value === "not_now") &&
    isBoundedString(value.timestamp, MAX_TIMESTAMP_LENGTH) &&
    !Number.isNaN(Date.parse(value.timestamp))
  );
}
