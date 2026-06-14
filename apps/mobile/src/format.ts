import type { DecisionCategory, DecisionOption, EnergyLevel, WeatherCondition } from "@weathered/shared";

export const CATEGORY_LABEL: Record<DecisionCategory, string> = {
  social: "Going out",
  work: "Work",
  spending: "Spending",
  other: "Other",
};

export const OUTCOME_LABEL: Record<string, string> = {
  go_out: "Go out",
  cancel: "Cancel",
  work: "Do it",
  skip: "Skip",
  buy: "Buy",
  avoid: "Hold off",
  note_only: "Just noting",
};

export const ENERGY_LABEL: Record<EnergyLevel, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function weatherEmoji(condition: WeatherCondition): string {
  if (condition === "sunny") return "☀️";
  if (condition === "rainy") return "🌧️";
  return "⛅";
}

export function outcomeLabel(outcome: DecisionOption): string {
  return OUTCOME_LABEL[outcome] || outcome;
}

export function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}
