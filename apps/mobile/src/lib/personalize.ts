import type { RecommendationFeedback, RecommendationFeedbackValue } from "@weathered/shared";

const HELPFUL_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;
const NOT_NOW_WINDOW_MS = 24 * 60 * 60 * 1000;

export function activeNudgeFeedback(
  feedback: RecommendationFeedback[],
  id: string,
  now = new Date(),
): RecommendationFeedbackValue | undefined {
  const item = feedback.find((candidate) => candidate.nudgeId === id);
  if (!item) return undefined;

  const timestamp = Date.parse(item.timestamp);
  if (Number.isNaN(timestamp)) return undefined;

  const age = Math.max(0, now.getTime() - timestamp);
  const activeWindow = item.value === "helpful" ? HELPFUL_WINDOW_MS : NOT_NOW_WINDOW_MS;
  return age <= activeWindow ? item.value : undefined;
}

/**
 * Stable re-sort of nudges using recent feedback. "Not now" is intentionally
 * short-lived, while useful suggestions receive a longer but bounded lift.
 */
export function personalizeNudges<T extends { id: string }>(
  nudges: T[],
  feedback: RecommendationFeedback[],
  now = new Date(),
): T[] {
  const score = (id: string) => {
    const choice = activeNudgeFeedback(feedback, id, now);
    return choice === "helpful" ? 1 : choice === "not_now" ? -1 : 0;
  };
  return [...nudges].sort((left, right) => score(right.id) - score(left.id));
}
