import type { DecisionLogInput } from "@weathered/shared";

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export const seedEntries: DecisionLogInput[] = [
  {
    id: "seed-1",
    userId: "local",
    mood: 7,
    energy: "medium",
    decisionCategory: "social",
    decisionOutcome: "go_out",
    note: "Coffee after work",
    weather: { condition: "sunny", temperatureC: 28, humidity: 52, locationLabel: "Local estimate" },
    timestamp: daysAgo(1),
  },
  {
    id: "seed-2",
    userId: "local",
    mood: 4,
    energy: "low",
    decisionCategory: "social",
    decisionOutcome: "cancel",
    note: "Too wet to head out",
    weather: { condition: "rainy", temperatureC: 22, humidity: 84, locationLabel: "Local estimate" },
    timestamp: daysAgo(2),
  },
  {
    id: "seed-3",
    userId: "local",
    mood: 8,
    energy: "high",
    decisionCategory: "work",
    decisionOutcome: "work",
    weather: { condition: "sunny", temperatureC: 27, humidity: 49, locationLabel: "Local estimate" },
    timestamp: daysAgo(3),
  },
];
