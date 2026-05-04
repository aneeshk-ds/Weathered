import type { DecisionLogInput, Insight } from "@weathered/shared";

export function buildInsight(entry: DecisionLogInput, entries: DecisionLogInput[]): Insight | null {
  const rainySocialCancels = entries.filter(
    (item) =>
      item.decisionCategory === "social" &&
      item.decisionOutcome === "cancel" &&
      item.weather.condition === "rainy",
  ).length;

  if (
    entry.decisionCategory === "social" &&
    entry.decisionOutcome === "cancel" &&
    entry.mood <= 4 &&
    entry.weather.condition === "rainy" &&
    rainySocialCancels >= 2
  ) {
    return {
      id: "rainy-social-cancel",
      title: "A weather-linked pattern is forming",
      message: "Rainy, lower-mood moments seem to line up with canceled social plans a little more often.",
      confidence: "medium",
    };
  }

  if (entry.energy === "low" && entry.decisionCategory === "work") {
    return {
      id: "low-energy-work",
      title: "Energy may be shaping work choices",
      message: "Low-energy work decisions are appearing often enough to be worth keeping an eye on.",
      confidence: "low",
    };
  }

  return null;
}
