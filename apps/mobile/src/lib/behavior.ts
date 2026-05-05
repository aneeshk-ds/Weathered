import type { BehavioralRead, BehaviorSignal, EnergyLevel, WeatherSnapshot } from "@weathered/shared";

export function buildBehavioralRead({
  mood,
  energy,
  weather,
}: {
  mood: number;
  energy: EnergyLevel;
  weather: WeatherSnapshot;
}): BehavioralRead {
  const signals = [
    buildFocusSignal(mood, energy, weather),
    buildSocialSignal(mood, energy, weather),
    buildRiskSignal(mood, energy, weather),
  ];

  return {
    title: "Today's Behavioral Read",
    summary: buildSummary(signals),
    signals,
  };
}

function buildFocusSignal(mood: number, energy: EnergyLevel, weather: WeatherSnapshot): BehaviorSignal {
  if (energy === "high" && weather.temperatureC <= 27) {
    return {
      id: "focus-strong",
      label: "Focus",
      level: "strong",
      message: "Good conditions for analytical work or structured planning.",
    };
  }

  if (energy === "low" || weather.temperatureC >= 30) {
    return {
      id: "focus-low",
      label: "Focus",
      level: "low",
      message: "Keep cognitive load smaller; a lighter task may fit better.",
    };
  }

  return {
    id: "focus-moderate",
    label: "Focus",
    level: mood >= 6 ? "strong" : "moderate",
    message: "Steady enough for focused work, especially if the scope is clear.",
  };
}

function buildSocialSignal(mood: number, energy: EnergyLevel, weather: WeatherSnapshot): BehaviorSignal {
  if (weather.condition === "sunny" && mood >= 7 && energy !== "low") {
    return {
      id: "social-strong",
      label: "Social",
      level: "strong",
      message: "This looks like a good window for connection or follow-through.",
    };
  }

  if (mood <= 4 || energy === "low") {
    return {
      id: "social-low",
      label: "Social",
      level: "low",
      message: "A softer version of a plan may be easier than forcing the full thing.",
    };
  }

  return {
    id: "social-moderate",
    label: "Social",
    level: "moderate",
    message: "Social follow-through may work best with a simple, low-friction plan.",
  };
}

function buildRiskSignal(mood: number, energy: EnergyLevel, weather: WeatherSnapshot): BehaviorSignal {
  if (weather.temperatureC >= 30 || (mood <= 4 && energy === "low")) {
    return {
      id: "risk-strong",
      label: "Decision Risk",
      level: "strong",
      message: "Pause before irreversible choices; this context may reward a slower decision.",
    };
  }

  if (weather.condition === "sunny" && mood >= 8) {
    return {
      id: "risk-moderate-sunny",
      label: "Decision Risk",
      level: "moderate",
      message: "Momentum is useful, but bigger choices may still deserve a quick second pass.",
    };
  }

  return {
    id: "risk-low",
    label: "Decision Risk",
    level: "low",
    message: "No obvious caution signal; normal decision pace looks reasonable.",
  };
}

function buildSummary(signals: BehaviorSignal[]) {
  const strongSignals = signals.filter((signal) => signal.level === "strong");
  const riskSignal = signals.find((signal) => signal.label === "Decision Risk");

  if (riskSignal?.level === "strong") {
    return "A pause-worthy context: choose smaller steps before bigger commitments.";
  }

  if (strongSignals.some((signal) => signal.label === "Focus")) {
    return "A useful focus window: structured work may feel easier than usual.";
  }

  if (strongSignals.some((signal) => signal.label === "Social")) {
    return "A good social window: connection and follow-through may come more naturally.";
  }

  return "A balanced context: keep the decision small enough to match your current capacity.";
}
