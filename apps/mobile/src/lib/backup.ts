import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import {
  DECISION_CATEGORIES,
  DECISION_OPTIONS,
  ENERGY_LEVELS,
  type DecisionCategory,
  type DecisionLogInput,
  type RecommendationFeedback,
  type WeatherCondition,
} from "@weathered/shared";

const BACKUP_VERSION = 1;

export interface BackupPayload {
  app: "weathered";
  version: number;
  exportedAt: string;
  entries: DecisionLogInput[];
  feedback: RecommendationFeedback[];
}

export interface BackupResult {
  ok: boolean;
  message: string;
}

export interface RestoreResult extends BackupResult {
  entries?: DecisionLogInput[];
  feedback?: RecommendationFeedback[];
}

export async function exportBackup(
  entries: DecisionLogInput[],
  feedback: RecommendationFeedback[],
): Promise<BackupResult> {
  try {
    const payload: BackupPayload = {
      app: "weathered",
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      entries,
      feedback,
    };
    const stamp = new Date().toISOString().slice(0, 10);
    const uri = `${FileSystem.cacheDirectory}weathered-backup-${stamp}.json`;
    await FileSystem.writeAsStringAsync(uri, JSON.stringify(payload, null, 2));

    if (!(await Sharing.isAvailableAsync())) {
      return { ok: false, message: "Sharing isn't available on this device." };
    }

    await Sharing.shareAsync(uri, {
      mimeType: "application/json",
      dialogTitle: "Save your Weathered backup",
      UTI: "public.json",
    });
    return { ok: true, message: "Backup ready — choose iCloud Drive or Google Drive to save it." };
  } catch {
    return { ok: false, message: "Could not create the backup." };
  }
}

export async function importBackup(): Promise<RestoreResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) {
      return { ok: false, message: "Restore canceled." };
    }

    const raw = await FileSystem.readAsStringAsync(result.assets[0].uri);
    const parsed = JSON.parse(raw) as Partial<BackupPayload>;

    if (parsed.app !== "weathered" || !Array.isArray(parsed.entries)) {
      return { ok: false, message: "That file isn't a Weathered backup." };
    }

    const entries = parsed.entries.map(normalizeEntry).filter((entry): entry is DecisionLogInput => entry !== null);
    const feedback = Array.isArray(parsed.feedback)
      ? parsed.feedback.map(normalizeFeedback).filter((item): item is RecommendationFeedback => item !== null)
      : [];

    if (entries.length !== parsed.entries.length) {
      return { ok: false, message: "That backup has entries Weathered could not read safely." };
    }

    return {
      ok: true,
      message: `Restored ${entries.length} check-in${entries.length === 1 ? "" : "s"}.`,
      entries,
      feedback,
    };
  } catch {
    return { ok: false, message: "Could not read that file." };
  }
}

function normalizeEntry(value: unknown, index: number): DecisionLogInput | null {
  if (!isRecord(value) || !isValidMood(value.mood) || !isEnergy(value.energy)) {
    return null;
  }

  if (!isDecisionCategory(value.decisionCategory)) {
    return null;
  }

  if (!isDecisionOutcome(value.decisionCategory, value.decisionOutcome) || !isWeatherSnapshot(value.weather)) {
    return null;
  }

  if (typeof value.timestamp !== "string" || Number.isNaN(Date.parse(value.timestamp))) {
    return null;
  }

  if (value.note !== undefined && typeof value.note !== "string") {
    return null;
  }

  return {
    id: typeof value.id === "string" && value.id.trim() ? value.id : `restored-${value.timestamp}-${index}`,
    userId: typeof value.userId === "string" && value.userId.trim() ? value.userId : "local",
    mood: value.mood,
    energy: value.energy,
    decisionCategory: value.decisionCategory,
    decisionOutcome: value.decisionOutcome,
    note: value.note,
    weather: value.weather,
    timestamp: value.timestamp,
  };
}

function normalizeFeedback(value: unknown): RecommendationFeedback | null {
  if (!isRecord(value)) return null;

  if (
    typeof value.nudgeId !== "string" ||
    (value.value !== "helpful" && value.value !== "not_now") ||
    typeof value.timestamp !== "string" ||
    Number.isNaN(Date.parse(value.timestamp))
  ) {
    return null;
  }

  return {
    nudgeId: value.nudgeId,
    value: value.value,
    timestamp: value.timestamp,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isValidMood(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 1 && value <= 10;
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
    isWeatherCondition(value.condition) &&
    typeof value.temperatureC === "number" &&
    Number.isFinite(value.temperatureC) &&
    typeof value.humidity === "number" &&
    Number.isFinite(value.humidity) &&
    value.humidity >= 0 &&
    value.humidity <= 100 &&
    typeof value.locationLabel === "string"
  );
}

function isWeatherCondition(value: unknown): value is WeatherCondition {
  return value === "sunny" || value === "cloudy" || value === "rainy";
}
