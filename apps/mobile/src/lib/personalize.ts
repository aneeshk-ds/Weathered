import type { RecommendationFeedback } from "@weathered/shared";

/**
 * Stable re-sort of nudges by prior feedback: "helpful" first, "not_now" last,
 * unrated in the middle. Relies on a stable sort so original order is preserved
 * within each band.
 */
export function personalizeNudges<T extends { id: string }>(nudges: T[], feedback: RecommendationFeedback[]): T[] {
  const value = new Map(feedback.map((item) => [item.nudgeId, item.value]));
  const score = (id: string) => {
    const choice = value.get(id);
    return choice === "helpful" ? 1 : choice === "not_now" ? -1 : 0;
  };
  return [...nudges].sort((left, right) => score(right.id) - score(left.id));
}
