import type { DailyReflection, DayFactor, DayRating } from "@weathered/shared";

export const DAY_RATINGS: readonly DayRating[] = ["rough", "mixed", "good", "great"];
export const DAY_FACTORS: readonly DayFactor[] = [
  "weather",
  "work",
  "people",
  "screen_time",
  "movement",
  "food",
  "rest",
];

export const DAY_RATING_LABELS: Record<DayRating, string> = {
  rough: "Rough",
  mixed: "Mixed",
  good: "Good",
  great: "Great",
};

export const DAY_FACTOR_LABELS: Record<DayFactor, string> = {
  weather: "Weather",
  work: "Work",
  people: "People",
  screen_time: "Screen time",
  movement: "Movement",
  food: "Food",
  rest: "Rest",
};

const DAY_RATING_SCORES: Record<DayRating, number> = {
  rough: 3,
  mixed: 5,
  good: 7,
  great: 9,
};

const READINESS_ADJUSTMENTS: Record<DayRating, number> = {
  rough: -6,
  mixed: -2,
  good: 2,
  great: 4,
};

export interface ReflectionSummary {
  count: number;
  averageScore: number | null;
  topFactor: DayFactor | null;
  latest: DailyReflection | null;
}

export interface ReflectionReadinessSignal {
  score: number;
  adjustment: number;
  label: string;
}

export function dayRatingScore(rating: DayRating): number {
  return DAY_RATING_SCORES[rating];
}

export function localDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function reflectionForDay(reflections: DailyReflection[], day: Date = new Date()): DailyReflection | null {
  const target = localDayKey(day);
  return reflections.find((reflection) => localDayKey(new Date(reflection.timestamp)) === target) ?? null;
}

export function upsertDailyReflection(reflections: DailyReflection[], reflection: DailyReflection): DailyReflection[] {
  const target = localDayKey(new Date(reflection.timestamp));
  return [reflection, ...reflections.filter((item) => localDayKey(new Date(item.timestamp)) !== target)].sort(
    (left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp),
  );
}

export function buildReflectionSummary(reflections: DailyReflection[]): ReflectionSummary {
  if (reflections.length === 0) {
    return { count: 0, averageScore: null, topFactor: null, latest: null };
  }

  const ordered = [...reflections].sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp));
  const averageScore =
    Math.round(
      (reflections.reduce((sum, reflection) => sum + dayRatingScore(reflection.rating), 0) / reflections.length) * 10,
    ) / 10;
  const factorCounts = DAY_FACTORS.map((factor) => ({
    factor,
    count: reflections.reduce((sum, reflection) => sum + (reflection.factors.includes(factor) ? 1 : 0), 0),
  }));
  const strongestFactor = factorCounts.sort((a, b) => b.count - a.count)[0];

  return {
    count: reflections.length,
    averageScore,
    topFactor: strongestFactor.count > 0 ? strongestFactor.factor : null,
    latest: ordered[0],
  };
}

/**
 * Only a recent reflection nudges current readiness. The transparent, bounded
 * adjustment prevents an end-of-day rating from overpowering live mood,
 * energy, weather, or the user's historical decision patterns.
 */
export function recentReflectionReadinessSignal(
  reflections: DailyReflection[],
  now: Date = new Date(),
): ReflectionReadinessSignal | null {
  const latest = buildReflectionSummary(reflections).latest;
  if (!latest) return null;

  const ageMs = now.getTime() - Date.parse(latest.timestamp);
  const thirtySixHoursMs = 36 * 60 * 60 * 1000;
  if (ageMs < 0 || ageMs > thirtySixHoursMs) return null;

  return {
    score: dayRatingScore(latest.rating),
    adjustment: READINESS_ADJUSTMENTS[latest.rating],
    label: DAY_RATING_LABELS[latest.rating],
  };
}
