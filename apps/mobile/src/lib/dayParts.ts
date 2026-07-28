import type { DecisionLogInput, WeatherCondition } from "@weathered/shared";

export type DayPart = "morning" | "afternoon" | "evening" | "night";

export interface DayPartDefinition {
  key: DayPart;
  label: string;
  timeLabel: string;
}

export interface DayPartInsight extends DayPartDefinition {
  averageMood: number | null;
  checkIns: number;
  dominantWeather: WeatherCondition | null;
}

export const DAY_PARTS: readonly DayPartDefinition[] = [
  { key: "morning", label: "Morning", timeLabel: "5am–12pm" },
  { key: "afternoon", label: "Afternoon", timeLabel: "12–5pm" },
  { key: "evening", label: "Evening", timeLabel: "5–9pm" },
  { key: "night", label: "Night", timeLabel: "9pm–5am" },
];

/** Map a local check-in time to the four reminder-aligned parts of the day. */
export function dayPartFor(date: Date): DayPart {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

/**
 * Summarize mood and weather by local time of day using all saved check-ins.
 * Empty periods remain null so missing tracking is never treated as low mood.
 */
export function buildDayPartInsights(entries: DecisionLogInput[]): DayPartInsight[] {
  return DAY_PARTS.map((part) => {
    const matching = entries.filter((entry) => {
      const timestamp = new Date(entry.timestamp);
      return !Number.isNaN(timestamp.getTime()) && dayPartFor(timestamp) === part.key;
    });

    if (matching.length === 0) {
      return { ...part, averageMood: null, checkIns: 0, dominantWeather: null };
    }

    const averageMood = Math.round((matching.reduce((sum, entry) => sum + entry.mood, 0) / matching.length) * 10) / 10;
    const weatherCounts: Record<WeatherCondition, number> = { sunny: 0, cloudy: 0, rainy: 0 };
    matching.forEach((entry) => {
      weatherCounts[entry.weather.condition] += 1;
    });
    const dominantWeather = (Object.entries(weatherCounts) as [WeatherCondition, number][]).sort(
      (a, b) => b[1] - a[1],
    )[0][0];

    return {
      ...part,
      averageMood,
      checkIns: matching.length,
      dominantWeather,
    };
  });
}
