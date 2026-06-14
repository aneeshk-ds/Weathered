import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DecisionLogInput, RecommendationFeedback, WeatherSourceMode } from "@weathered/shared";

const STORAGE_KEY = "weathered.local.entries.v1";
const PREFERENCES_KEY = "weathered.local.preferences.v1";
const NUDGE_FEEDBACK_KEY = "weathered.local.nudge-feedback.v1";

export interface LocalPreferences {
  weatherSourceMode: WeatherSourceMode;
}

const defaultPreferences: LocalPreferences = {
  weatherSourceMode: "live_ready",
};

function withIds(entries: DecisionLogInput[]): DecisionLogInput[] {
  return entries.map((entry, index) => ({
    ...entry,
    id: entry.id || `migrated-${entry.timestamp}-${index}`,
  }));
}

export async function loadEntries(seedEntries: DecisionLogInput[]): Promise<DecisionLogInput[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seedEntries));
      return seedEntries;
    }

    const parsed = JSON.parse(raw) as DecisionLogInput[];
    return Array.isArray(parsed) ? withIds(parsed) : seedEntries;
  } catch {
    return seedEntries;
  }
}

export async function saveEntries(entries: DecisionLogInput[]): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}

export async function loadPreferences(): Promise<LocalPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFERENCES_KEY);

    if (!raw) {
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(defaultPreferences));
      return defaultPreferences;
    }

    const parsed = JSON.parse(raw) as Partial<LocalPreferences>;
    return {
      weatherSourceMode: isWeatherSourceMode(parsed.weatherSourceMode)
        ? parsed.weatherSourceMode
        : defaultPreferences.weatherSourceMode,
    };
  } catch {
    return defaultPreferences;
  }
}

export async function savePreferences(preferences: LocalPreferences): Promise<boolean> {
  try {
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}

export async function loadRecommendationFeedback(): Promise<RecommendationFeedback[]> {
  try {
    const raw = await AsyncStorage.getItem(NUDGE_FEEDBACK_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as RecommendationFeedback[];
    return Array.isArray(parsed) ? parsed.filter(isRecommendationFeedback) : [];
  } catch {
    return [];
  }
}

export async function saveRecommendationFeedback(feedback: RecommendationFeedback[]): Promise<boolean> {
  try {
    await AsyncStorage.setItem(NUDGE_FEEDBACK_KEY, JSON.stringify(feedback));
    return true;
  } catch {
    return false;
  }
}

function isWeatherSourceMode(value: unknown): value is WeatherSourceMode {
  return value === "daily_mock" || value === "seasonal_mock" || value === "live_ready";
}

function isRecommendationFeedback(value: RecommendationFeedback): value is RecommendationFeedback {
  return (
    typeof value?.nudgeId === "string" &&
    (value.value === "helpful" || value.value === "not_now") &&
    typeof value.timestamp === "string"
  );
}
