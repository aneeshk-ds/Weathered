import {
  DECISION_CATEGORIES,
  type GuidanceCard,
  type DecisionLogInput,
  type Insight,
  type WeeklySummary,
} from "@weathered/shared";
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function isWithinLast7Days(timestamp: string, nowMs = Date.now()) {
  const entryTime = new Date(timestamp).getTime();
  const sevenDaysAgo = nowMs - SEVEN_DAYS_MS;
  return Number.isFinite(entryTime) && entryTime <= nowMs && entryTime >= sevenDaysAgo;
}

export function filterEntriesWithinLast7Days(entries: DecisionLogInput[], nowMs = Date.now()) {
  return entries.filter((item) => isWithinLast7Days(item.timestamp, nowMs));
}

export function buildSummary(entries: DecisionLogInput[]): WeeklySummary {
  const weeklyEntries = filterEntriesWithinLast7Days(entries);
  const totalEntries = weeklyEntries.length;
  const dailyMood = new Map<string, number[]>();
  weeklyEntries.forEach((entry) => {
    const date = new Date(entry.timestamp);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    dailyMood.set(key, [...(dailyMood.get(key) ?? []), entry.mood]);
  });
  const dailyAverages = [...dailyMood.values()].map(
    (moods) => moods.reduce((sum, mood) => sum + mood, 0) / moods.length,
  );
  const trackedDays = dailyAverages.length;
  const averageMood =
    trackedDays === 0
      ? 0
      : Number((dailyAverages.reduce((sum, dailyAverage) => sum + dailyAverage, 0) / trackedDays).toFixed(1));

  const decisionCounts = DECISION_CATEGORIES.reduce<Record<string, number>>((acc, category) => {
    acc[category] = weeklyEntries.filter((item) => item.decisionCategory === category).length;
    return acc;
  }, {});

  const rainyCancels = weeklyEntries.filter(
    (item) =>
      item.weather.condition === "rainy" && item.decisionCategory === "social" && item.decisionOutcome === "cancel",
  ).length;
  const rainySocialTotal = weeklyEntries.filter(
    (item) => item.weather.condition === "rainy" && item.decisionCategory === "social",
  ).length;
  const sunnyWorkTotal = weeklyEntries.filter(
    (item) => item.weather.condition === "sunny" && item.decisionCategory === "work" && item.decisionOutcome === "work",
  ).length;
  const lowEnergyWorkSkips = weeklyEntries.filter(
    (item) => item.energy === "low" && item.decisionCategory === "work" && item.decisionOutcome === "skip",
  ).length;
  const highMoodSocialGoOut = weeklyEntries.filter(
    (item) => item.mood >= 7 && item.decisionCategory === "social" && item.decisionOutcome === "go_out",
  ).length;

  const lowMoodDays = weeklyEntries.filter((item) => item.mood <= 4).length;
  const lowMoodSocialCancels = weeklyEntries.filter(
    (item) => item.mood <= 4 && item.decisionCategory === "social" && item.decisionOutcome === "cancel",
  ).length;

  const topInsights: Insight[] = [];
  const guidance: GuidanceCard[] = [];

  if (rainyCancels >= 2) {
    topInsights.push({
      id: "weekly-rainy-social-cancel",
      title: "Rainy social hesitation",
      message: "Across this week, rainy conditions seem to coincide with more social cancellations than usual.",
      confidence: rainySocialTotal >= 3 ? "medium" : "low",
    });
  }

  if (lowMoodSocialCancels >= 2) {
    topInsights.push({
      id: "weekly-low-mood-social",
      title: "Mood may be influencing social follow-through",
      message: "Lower-mood entries are showing a softer willingness to follow through on social plans.",
      confidence: "medium",
    });
  }

  if (sunnyWorkTotal >= 2) {
    topInsights.push({
      id: "weekly-sunny-work",
      title: "Clearer weather, steadier work decisions",
      message: "Sunny entries are leaning a bit more toward focused work decisions in your recent logs.",
      confidence: "low",
    });
  }

  if (topInsights.length === 0) {
    topInsights.push({
      id: "weekly-early-days",
      title: "Still early, but the signal is building",
      message:
        "You already have enough activity to start noticing rhythms. A few more logs should make the patterns clearer.",
      confidence: "low",
    });
  }

  if (lowEnergyWorkSkips >= 1) {
    guidance.push({
      id: "guidance-low-energy",
      title: "Low-energy work moments",
      message:
        "On lower-energy days, it may help to treat work choices as lighter planning moments instead of pressure moments.",
    });
  }

  if (rainyCancels >= 1) {
    guidance.push({
      id: "guidance-rainy-social",
      title: "Rainy-day social buffer",
      message:
        "If the weather turns, a softer social plan or backup option may help you stay connected without forcing the moment.",
    });
  }

  if (highMoodSocialGoOut >= 1) {
    guidance.push({
      id: "guidance-high-mood",
      title: "High-mood social window",
      message:
        "Your stronger-mood moments may be good times to make or confirm social plans while motivation feels easy.",
    });
  }

  if (guidance.length === 0) {
    guidance.push({
      id: "guidance-general",
      title: "Keep collecting contrast",
      message:
        "A mix of sunny, rainy, high-energy, and low-energy entries will make the app’s guidance much more personal over time.",
    });
  }

  return {
    totalEntries,
    trackedDays,
    averageMood,
    decisionCounts,
    topInsights,
    guidance: [
      ...guidance,
      {
        id: "guidance-low-mood-count",
        title: "Weekly emotional context",
        message:
          lowMoodDays > 0
            ? `${lowMoodDays} lower-mood entr${lowMoodDays === 1 ? "y has" : "ies have"} been logged this week, which gives the app a more balanced read of your decision patterns.`
            : "This week has not included lower-mood entries yet, so the picture may still be tilted toward steadier days.",
      },
    ].slice(0, 3),
  };
}
