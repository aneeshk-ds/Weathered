import type {
  DecisionLogInput,
  Insight,
  WeeklySummary,
} from "@weathered/shared";

export function buildInsightFromEntry(
  entry: DecisionLogInput,
  entries: DecisionLogInput[],
): Insight | null {
  const rainySocialCancels = entries.filter(
    (item) =>
      item.decisionCategory === "social" &&
      item.decisionOutcome === "cancel" &&
      item.weather.condition === "rainy",
  ).length;

  if (
    entry.decisionCategory === "social" &&
    entry.decisionOutcome === "cancel" &&
    entry.weather.condition === "rainy" &&
    rainySocialCancels >= 2
  ) {
    return {
      id: "rainy-cancel-pattern",
      title: "Pattern detected",
      message: "You tend to cancel social plans more often on rainy days.",
      confidence: "medium",
    };
  }

  if (entry.energy === "low" && entry.decisionCategory === "work") {
    return {
      id: "low-energy-work",
      title: "Possible work-energy pattern",
      message: "Low-energy work decisions are showing up in your logs.",
      confidence: "low",
    };
  }

  return null;
}

export function buildWeeklySummary(entries: DecisionLogInput[]): WeeklySummary {
  const totalEntries = entries.length;
  const averageMood =
    totalEntries === 0
      ? 0
      : Number(
          (
            entries.reduce((sum, item) => sum + item.mood, 0) / totalEntries
          ).toFixed(1),
        );

  const decisionCounts = entries.reduce<Record<string, number>>((acc, item) => {
    acc[item.decisionCategory] = (acc[item.decisionCategory] || 0) + 1;
    return acc;
  }, {});

  const rainyEntries = entries.filter((item) => item.weather.condition === "rainy").length;
  const lowMoodEntries = entries.filter((item) => item.mood <= 4).length;

  return {
    totalEntries,
    averageMood,
    decisionCounts,
    topInsights: [
      {
        id: "api-rainy-pattern",
        title: "Rain context",
        message:
          rainyEntries > 0
            ? `Rainy-day logs recorded: ${rainyEntries}.`
            : "No rainy-day patterns yet.",
        confidence: rainyEntries > 1 ? "medium" : "low",
      },
      {
        id: "api-low-mood-pattern",
        title: "Mood context",
        message:
          lowMoodEntries > 0
            ? `Low-mood entries recorded: ${lowMoodEntries}.`
            : "No low-mood entries yet.",
        confidence: lowMoodEntries > 1 ? "medium" : "low",
      },
    ],
    guidance: [
      {
        id: "api-guidance-1",
        title: "Weekly read",
        message: "As more entries build up, the API summary can return more personal guidance as well.",
      },
    ],
  };
}
