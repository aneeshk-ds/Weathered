import {
  DECISION_CATEGORIES,
  type DecisionCategory,
  type DecisionForecast,
  type DecisionLogInput,
  type WeatherSnapshot,
} from "@weathered/shared";

export function buildDecisionForecast(
  entries: DecisionLogInput[],
  currentWeather: WeatherSnapshot,
): DecisionForecast {
  const recentEntries = entries.slice(0, 14);
  const weatherMatchedEntries = recentEntries.filter(
    (entry) => entry.weather.condition === currentWeather.condition,
  );
  const sample = weatherMatchedEntries.length >= 2 ? weatherMatchedEntries : recentEntries;
  const categoryFocus = getDominantCategory(sample);
  const averageMood = sample.length > 0 ? getAverageMood(sample) : 0;
  const socialCancels = sample.filter(
    (entry) => entry.decisionCategory === "social" && entry.decisionOutcome === "cancel",
  ).length;
  const lowEnergyWorkSkips = sample.filter(
    (entry) => entry.energy === "low" && entry.decisionCategory === "work" && entry.decisionOutcome === "skip",
  ).length;
  const signalStrength = Math.min(
    100,
    Math.round(((weatherMatchedEntries.length * 1.5 + sample.length) / 20) * 100),
  );

  if (currentWeather.condition === "rainy" && socialCancels >= 1) {
    return {
      id: "forecast-rain-social-buffer",
      title: "Rain may need a softer plan",
      message:
        "Recent rainy-context logs show some social friction. A flexible plan may protect the connection without forcing the moment.",
      actionLabel: "Offer a backup plan before deciding",
      confidence: weatherMatchedEntries.length >= 3 ? "medium" : "low",
      weatherCondition: currentWeather.condition,
      categoryFocus: "social",
      signalStrength,
    };
  }

  if (lowEnergyWorkSkips >= 1 || averageMood <= 4.5) {
    return {
      id: "forecast-low-energy-work",
      title: "Treat the next decision as lower-pressure",
      message:
        "The recent pattern leans toward lower energy or mood. Smaller work commitments may be more realistic than all-or-nothing choices.",
      actionLabel: "Choose the smallest useful next step",
      confidence: sample.length >= 4 ? "medium" : "low",
      weatherCondition: currentWeather.condition,
      categoryFocus: "work",
      signalStrength,
    };
  }

  if (currentWeather.condition === "sunny" && averageMood >= 6.5) {
    return {
      id: "forecast-sunny-window",
      title: "This may be a good activation window",
      message:
        "Your recent brighter-weather entries are trending steadier. It may be a good time to confirm plans or handle a decision you have delayed.",
      actionLabel: "Use the momentum while it is easy",
      confidence: weatherMatchedEntries.length >= 3 ? "medium" : "low",
      weatherCondition: currentWeather.condition,
      categoryFocus,
      signalStrength,
    };
  }

  return {
    id: "forecast-keep-logging",
    title: "The next signal is still forming",
    message:
      "Weathered has enough local context to make a gentle read, but a few more varied check-ins will sharpen the forecast.",
    actionLabel: "Log before the decision, not after",
    confidence: sample.length >= 5 ? "medium" : "low",
    weatherCondition: currentWeather.condition,
    categoryFocus,
    signalStrength,
  };
}

function getDominantCategory(entries: DecisionLogInput[]): DecisionCategory {
  return DECISION_CATEGORIES.reduce(
    (best, category) =>
      entries.filter((entry) => entry.decisionCategory === category).length >
      entries.filter((entry) => entry.decisionCategory === best).length
        ? category
        : best,
    "social" as DecisionCategory,
  );
}

function getAverageMood(entries: DecisionLogInput[]) {
  return entries.reduce((sum, entry) => sum + entry.mood, 0) / entries.length;
}
