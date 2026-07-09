import type { DecisionLogInput, Insight, InsightConfidence } from "@weathered/shared";

interface Candidate {
  insight: Insight;
  support: number;
  matchesCurrent: boolean;
}

function confidenceFor(support: number): InsightConfidence {
  if (support >= 4) {
    return "high";
  }

  if (support >= 2) {
    return "medium";
  }

  return "low";
}

function count(entries: DecisionLogInput[], predicate: (entry: DecisionLogInput) => boolean): number {
  return entries.filter(predicate).length;
}

function averageMood(entries: DecisionLogInput[]): number {
  if (entries.length === 0) {
    return 0;
  }

  return entries.reduce((sum, entry) => sum + entry.mood, 0) / entries.length;
}

/**
 * Returns the most useful plain-language insight available from the local log.
 * Unlike the previous version, this surfaces graduated-confidence patterns from
 * a single observation onward, and always returns an encouraging fallback so the
 * user is never left with a blank insight slot.
 */
export function buildInsight(entry: DecisionLogInput, entries: DecisionLogInput[]): Insight | null {
  const candidates: Candidate[] = [];

  const rainySocialCancels = count(
    entries,
    (item) =>
      item.decisionCategory === "social" && item.decisionOutcome === "cancel" && item.weather.condition === "rainy",
  );
  if (rainySocialCancels >= 1) {
    candidates.push({
      support: rainySocialCancels,
      matchesCurrent: entry.decisionCategory === "social" && entry.weather.condition === "rainy",
      insight: {
        id: "rainy-social-cancel",
        title: "Rain nudges your social plans",
        message: `You've canceled social plans on rainy days ${rainySocialCancels} time${rainySocialCancels === 1 ? "" : "s"}. Worth noticing before the next rainy invite.`,
        confidence: confidenceFor(rainySocialCancels),
      },
    });
  }

  const lowEnergyWorkSkips = count(
    entries,
    (item) => item.energy === "low" && item.decisionCategory === "work" && item.decisionOutcome === "skip",
  );
  if (lowEnergyWorkSkips >= 1) {
    candidates.push({
      support: lowEnergyWorkSkips,
      matchesCurrent: entry.energy === "low" && entry.decisionCategory === "work",
      insight: {
        id: "low-energy-work-skip",
        title: "Low energy shapes your work calls",
        message: `When energy runs low you've skipped work ${lowEnergyWorkSkips} time${lowEnergyWorkSkips === 1 ? "" : "s"}. A smaller next step may beat all-or-nothing.`,
        confidence: confidenceFor(lowEnergyWorkSkips),
      },
    });
  }

  const sunnySocialGoOut = count(
    entries,
    (item) =>
      item.weather.condition === "sunny" && item.decisionCategory === "social" && item.decisionOutcome === "go_out",
  );
  if (sunnySocialGoOut >= 2) {
    candidates.push({
      support: sunnySocialGoOut,
      matchesCurrent: entry.weather.condition === "sunny" && entry.decisionCategory === "social",
      insight: {
        id: "sunny-social-go-out",
        title: "Sunshine gets you out",
        message: `Bright days line up with going out — ${sunnySocialGoOut} times so far. A good window to make plans.`,
        confidence: confidenceFor(sunnySocialGoOut),
      },
    });
  }

  const rainyEntries = entries.filter((item) => item.weather.condition === "rainy");
  const clearEntries = entries.filter((item) => item.weather.condition !== "rainy");
  if (rainyEntries.length >= 2 && clearEntries.length >= 1) {
    const rainyMood = averageMood(rainyEntries);
    const clearMood = averageMood(clearEntries);
    if (clearMood - rainyMood >= 1.5) {
      const support = rainyEntries.length;
      candidates.push({
        support,
        matchesCurrent: entry.weather.condition === "rainy",
        insight: {
          id: "mood-weather-rainy",
          title: "Rain tracks with lower mood",
          message: `Your mood averages ${rainyMood.toFixed(1)} on rainy days versus ${clearMood.toFixed(1)} otherwise. Be gentle with big calls when it's wet.`,
          confidence: confidenceFor(support),
        },
      });
    }
  }

  const upbeatSpending = count(
    entries,
    (item) =>
      item.decisionCategory === "spending" &&
      item.decisionOutcome === "buy" &&
      (item.mood >= 8 || item.weather.condition === "sunny"),
  );
  if (upbeatSpending >= 2) {
    candidates.push({
      support: upbeatSpending,
      matchesCurrent: entry.decisionCategory === "spending",
      insight: {
        id: "upbeat-spending",
        title: "Good moods open the wallet",
        message: `Higher-mood or sunny moments line up with buying ${upbeatSpending} times. A short pause before purchases may help.`,
        confidence: confidenceFor(upbeatSpending),
      },
    });
  }

  if (candidates.length > 0) {
    candidates.sort((left, right) => {
      if (left.matchesCurrent !== right.matchesCurrent) {
        return left.matchesCurrent ? -1 : 1;
      }

      return right.support - left.support;
    });

    return candidates[0].insight;
  }

  if (entries.length <= 1) {
    return {
      id: "first-checkin",
      title: "First check-in logged",
      message: "Nice start. A few more check-ins and Weathered will begin spotting your patterns.",
      confidence: "low",
    };
  }

  return {
    id: "keep-logging",
    title: "Patterns are forming",
    message: `That's ${entries.length} check-ins. Keep going across different weather and moods to sharpen your insights.`,
    confidence: "low",
  };
}
