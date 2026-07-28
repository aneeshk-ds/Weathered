import type { DecisionLogInput, WeatherCondition } from "@weathered/shared";

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * Current check-in streak: consecutive days with at least one check-in, counting
 * back from today. A one-day grace applies, so a streak that ran up to yesterday
 * still shows until the day is missed. `today` is injectable for testing.
 */
export function computeStreak(entries: DecisionLogInput[], today: Date = new Date()): number {
  const days = new Set(entries.map((entry) => dayKey(new Date(entry.timestamp))));
  const cursor = new Date(today);
  if (!days.has(dayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
    if (!days.has(dayKey(cursor))) {
      return 0;
    }
  }
  let streak = 0;
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/**
 * Compare the last 7 days of mood against the 7 days before that. Returns the
 * rounded percentage change and whether both windows have enough data to compare.
 */
export function weeklyMoodDelta(
  entries: DecisionLogInput[],
  today: Date = new Date(),
): { current: number; previous: number; deltaPct: number; hasComparison: boolean } {
  const now = today.getTime();
  const week = 7 * 24 * 60 * 60 * 1000;
  const inWindow = (from: number, to: number) =>
    entries.filter((entry) => {
      const time = Date.parse(entry.timestamp);
      return time > from && time <= to;
    });
  const average = (list: DecisionLogInput[]) => {
    const byDay = new Map<string, number[]>();
    list.forEach((entry) => {
      const key = dayKey(new Date(entry.timestamp));
      byDay.set(key, [...(byDay.get(key) ?? []), entry.mood]);
    });
    const dailyAverages = [...byDay.values()].map(
      (moods) => moods.reduce((sum, mood) => sum + mood, 0) / moods.length,
    );
    return dailyAverages.length
      ? dailyAverages.reduce((sum, dailyAverage) => sum + dailyAverage, 0) / dailyAverages.length
      : 0;
  };

  const currentList = inWindow(now - week, now);
  const previousList = inWindow(now - 2 * week, now - week);
  const current = average(currentList);
  const previous = average(previousList);
  const hasComparison = currentList.length > 0 && previousList.length > 0 && previous > 0;
  const deltaPct = hasComparison ? Math.round(((current - previous) / previous) * 100) : 0;
  return { current, previous, deltaPct, hasComparison };
}

/** Most frequently logged weather condition in the trailing seven days. */
export function dominantWeeklyWeather(
  entries: DecisionLogInput[],
  today: Date = new Date(),
): WeatherCondition | null {
  const now = today.getTime();
  const from = now - 7 * 24 * 60 * 60 * 1000;
  const counts: Record<WeatherCondition, number> = { sunny: 0, cloudy: 0, rainy: 0 };
  entries.forEach((entry) => {
    const timestamp = Date.parse(entry.timestamp);
    if (timestamp > from && timestamp <= now) counts[entry.weather.condition] += 1;
  });
  const ranked = (Object.entries(counts) as [WeatherCondition, number][]).sort(
    (left, right) => right[1] - left[1],
  );
  return ranked[0][1] > 0 ? ranked[0][0] : null;
}

/** A short, supportive line describing the week's average mood. */
export function supportiveMoodCaption(averageMood: number): string {
  if (averageMood <= 0) {
    return "Log a check-in to see your week.";
  }
  if (averageMood >= 7.5) {
    return "Your week is looking bright.";
  }
  if (averageMood >= 6) {
    return "Your week is looking steady.";
  }
  if (averageMood >= 4) {
    return "A mixed week. Be kind to yourself.";
  }
  return "A heavier week. Small steps count.";
}
