import type { DecisionLogInput, RecommendationFeedback } from "@weathered/shared";

const ENERGY_LEVELS = ["low", "medium", "high"] as const;
const DECISION_CATEGORIES = ["social", "work", "spending", "other"] as const;
const DECISION_OPTIONS = {
  social: ["go_out", "cancel"],
  work: ["work", "skip"],
  spending: ["buy", "avoid"],
  other: ["note_only"],
} as const;

type DecisionCategory = (typeof DECISION_CATEGORIES)[number];

export interface NormalizedBackup {
  entries: DecisionLogInput[];
  feedback: RecommendationFeedback[];
}

export function normalizeBackupPayload(value: unknown): NormalizedBackup | null {
  if (!isRecord(value) || value.app !== "weathered" || !Array.isArray(value.entries)) {
    return null;
  }

  const entries = value.entries.map(normalizeEntry).filter((entry): entry is DecisionLogInput => entry !== null);

  if (entries.length !== value.entries.length) {
    return null;
  }

  return {
    entries,
    feedback: Array.isArray(value.feedback)
      ? value.feedback.map(normalizeFeedback).filter((item): item is RecommendationFeedback => item !== null)
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

function isWeatherCondition(value: unknown): value is DecisionLogInput["weather"]["condition"] {
  return value === "sunny" || value === "cloudy" || value === "rainy";
}
