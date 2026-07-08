import type {
  DecisionCategory,
  DecisionForecast,
  DecisionLogInput,
  EnergyLevel,
  InsightConfidence,
  WeatherSnapshot,
} from "@weathered/shared";

const DECISION_CATEGORIES: DecisionCategory[] = ["social", "work", "spending", "other"];

interface CurrentState {
  mood: number;
  energy: EnergyLevel;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function confidenceFromStrength(strength: number, hasHistory: boolean): InsightConfidence {
  if (strength >= 75 && hasHistory) {
    return "high";
  }

  if (strength >= 55) {
    return "medium";
  }

  return "low";
}

/**
 * Produces a decision forecast that is useful even with little or no history.
 * Today's mood, energy, and weather always provide a grounded present-moment
 * read; matching past logs raise the signal strength and confidence rather than
 * being required for any read at all.
 */
export function buildDecisionForecast(
  entries: DecisionLogInput[],
  currentWeather: WeatherSnapshot,
  current: CurrentState,
): DecisionForecast {
  const { mood, energy } = current;

  const recentEntries = entries.slice(0, 14);
  const weatherMatchedEntries = recentEntries.filter(
    (entry) => entry.weather.condition === currentWeather.condition,
  );
  const historySample = weatherMatchedEntries.length >= 2 ? weatherMatchedEntries : recentEntries;
  const hasHistory = historySample.length >= 2;
  const categoryFocus = getDominantCategory(historySample.length > 0 ? historySample : recentEntries);

  const socialCancels = historySample.filter(
    (entry) => entry.decisionCategory === "social" && entry.decisionOutcome === "cancel",
  ).length;
  const lowEnergyWorkSkips = historySample.filter(
    (entry) => entry.energy === "low" && entry.decisionCategory === "work" && entry.decisionOutcome === "skip",
  ).length;

  // Present-moment confidence is always available from today's inputs.
  let strength = 55 + (mood - 5) * 4;
  if (energy === "high") {
    strength += 8;
  } else if (energy === "low") {
    strength -= 8;
  }
  if (currentWeather.temperatureC >= 30) {
    strength -= 6;
  }
  // History adds backing without being required.
  strength += Math.min(22, weatherMatchedEntries.length * 4 + (hasHistory ? 6 : 0));
  const signalStrength = clamp(Math.round(strength), 25, 100);
  const confidence = confidenceFromStrength(signalStrength, hasHistory);

  const backing = hasHistory
    ? `Backed by ${historySample.length} similar log${historySample.length === 1 ? "" : "s"}`
    : "Based on today's conditions";

  if (currentWeather.condition === "rainy" && (energy === "low" || mood <= 5 || socialCancels >= 1)) {
    return {
      id: "forecast-rain-social-buffer",
      title: "Rain may need a softer plan",
      message: `Rainy weather with your current state leans toward social friction. A flexible plan protects the connection without forcing it. ${backing}.`,
      actionLabel: "Offer a backup plan before deciding",
      confidence,
      weatherCondition: currentWeather.condition,
      categoryFocus: "social",
      signalStrength,
    };
  }

  if (energy === "low" || mood <= 4 || lowEnergyWorkSkips >= 1) {
    return {
      id: "forecast-low-energy-work",
      title: "Treat the next decision as lower-pressure",
      message: `Energy or mood is on the lower side right now. Smaller commitments are more realistic than all-or-nothing choices. ${backing}.`,
      actionLabel: "Choose the smallest useful next step",
      confidence,
      weatherCondition: currentWeather.condition,
      categoryFocus: "work",
      signalStrength,
    };
  }

  if (currentWeather.condition === "sunny" && mood >= 6) {
    return {
      id: "forecast-sunny-window",
      title: "This is a good activation window",
      message: `Bright weather and a steady mood line up well. A good time to confirm plans or handle a decision you've delayed. ${backing}.`,
      actionLabel: "Use the momentum while it's easy",
      confidence,
      weatherCondition: currentWeather.condition,
      categoryFocus,
      signalStrength,
    };
  }

  return {
    id: "forecast-steady",
    title: "A steady moment to decide",
    message: `No strong caution signal in your current state. A normal decision pace looks reasonable if the next step is clear. ${backing}.`,
    actionLabel: "Proceed with one clear check",
    confidence,
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

