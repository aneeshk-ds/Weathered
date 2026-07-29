import {
  DECISION_CATEGORIES,
  DECISION_OPTIONS,
  type DailyReflection,
  type DecisionCategory,
  type DecisionLogInput,
  type RecommendationFeedback,
} from "@weathered/shared";
import { DAY_FACTORS, DAY_RATINGS } from "./reflections.ts";
import { removeLegacySampleEntries } from "./legacyData.ts";

const ENERGY_LEVELS = ["low", "medium", "high"] as const;
const MAX_BACKUP_ENTRIES = 5000;
const MAX_BACKUP_FEEDBACK = 5000;
const MAX_BACKUP_REFLECTIONS = 5000;
const MAX_ID_LENGTH = 160;
const MAX_USER_ID_LENGTH = 80;
const MAX_NOTE_LENGTH = 120;
const MAX_REFLECTION_NOTE_LENGTH = 240;
const MAX_LOCATION_LABEL_LENGTH = 120;
const MAX_TIMESTAMP_LENGTH = 40;

export interface NormalizedBackup {
  entries: DecisionLogInput[];
  feedback: RecommendationFeedback[];
  reflections: DailyReflection[];
}

export function normalizeBackupPayload(value: unknown): NormalizedBackup | null {
  if (!isRecord(value) || value.app !== "weathered" || !Array.isArray(value.entries)) {
    return null;
  }

  if (value.entries.length > MAX_BACKUP_ENTRIES) {
    return null;
  }

  if (Array.isArray(value.feedback) && value.feedback.length > MAX_BACKUP_FEEDBACK) {
    return null;
  }
  if (Array.isArray(value.reflections) && value.reflections.length > MAX_BACKUP_REFLECTIONS) {
    return null;
  }

  const entries = value.entries.map(normalizeEntry).filter((entry): entry is DecisionLogInput => entry !== null);

  if (entries.length !== value.entries.length) {
    return null;
  }

  return {
    entries: removeLegacySampleEntries(entries),
    feedback: Array.isArray(value.feedback)
      ? value.feedback.map(normalizeFeedback).filter((item): item is RecommendationFeedback => item !== null)
      : [],
    reflections: Array.isArray(value.reflections)
      ? value.reflections.map(normalizeReflection).filter((item): item is DailyReflection => item !== null)
      : [],
  };
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

  if (!isBoundedString(value.timestamp, MAX_TIMESTAMP_LENGTH) || Number.isNaN(Date.parse(value.timestamp))) {
    return null;
  }

  if (value.note !== undefined && !isBoundedString(value.note, MAX_NOTE_LENGTH)) {
    return null;
  }

  const id =
    isBoundedString(value.id, MAX_ID_LENGTH) && value.id.trim() ? value.id : `restored-${value.timestamp}-${index}`;
  const userId = isBoundedString(value.userId, MAX_USER_ID_LENGTH) && value.userId.trim() ? value.userId : "local";
  const note = value.note !== undefined && value.note.trim() ? value.note : undefined;

  return {
    id,
    userId,
    mood: value.mood,
    energy: value.energy,
    decisionCategory: value.decisionCategory,
    decisionOutcome: value.decisionOutcome,
    note,
    weather: value.weather,
    timestamp: value.timestamp,
  };
}

function normalizeFeedback(value: unknown): RecommendationFeedback | null {
  if (!isRecord(value)) return null;

  if (
    !isBoundedString(value.nudgeId, MAX_ID_LENGTH) ||
    !value.nudgeId.trim() ||
    (value.value !== "helpful" && value.value !== "not_now") ||
    !isBoundedString(value.timestamp, MAX_TIMESTAMP_LENGTH) ||
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

function normalizeReflection(value: unknown): DailyReflection | null {
  if (!isRecord(value)) return null;

  if (
    !isBoundedString(value.id, MAX_ID_LENGTH) ||
    !value.id.trim() ||
    !isBoundedString(value.userId, MAX_USER_ID_LENGTH) ||
    !value.userId.trim() ||
    !DAY_RATINGS.includes(value.rating as DailyReflection["rating"]) ||
    !Array.isArray(value.factors) ||
    value.factors.length > DAY_FACTORS.length ||
    !value.factors.every((factor) => DAY_FACTORS.includes(factor as DailyReflection["factors"][number])) ||
    new Set(value.factors).size !== value.factors.length ||
    (value.note !== undefined && !isBoundedString(value.note, MAX_REFLECTION_NOTE_LENGTH)) ||
    !isBoundedString(value.timestamp, MAX_TIMESTAMP_LENGTH) ||
    Number.isNaN(Date.parse(value.timestamp))
  ) {
    return null;
  }

  return {
    id: value.id,
    userId: value.userId,
    rating: value.rating as DailyReflection["rating"],
    factors: value.factors as DailyReflection["factors"],
    note: value.note === undefined || !value.note.trim() ? undefined : value.note,
    timestamp: value.timestamp,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBoundedString(value: unknown, maxLength: number): value is string {
  return typeof value === "string" && value.length <= maxLength;
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

function isWeatherCondition(value: unknown): value is DecisionLogInput["weather"]["condition"] {
  return value === "sunny" || value === "cloudy" || value === "rainy";
}
