import type { DecisionCategory, DecisionOption, EnergyLevel, WeatherCondition } from "@weathered/shared";

export const CATEGORY_LABEL: Record<DecisionCategory, string> = {
  social: "Going out",
  work: "Work",
  spending: "Spending",
  scrolling: "Scrolling",
  watching_tv: "Watching TV",
  gaming: "Gaming",
  exercise: "Exercise",
  eating: "Eating",
  other: "Other",
};

export const OUTCOME_LABEL: Record<string, string> = {
  go_out: "Go out",
  stay_in: "Stay in",
  message_someone: "Message someone",
  cancel: "Cancel",
  work: "Do it",
  do_now: "Do it now",
  do_less: "Do less",
  take_break: "Take a break",
  later: "Later",
  stop: "Stop",
  rest: "Rest",
  skip: "Skip",
  buy: "Buy",
  compare: "Compare first",
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
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}
