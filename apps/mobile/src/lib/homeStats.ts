import type { DecisionLogInput } from "@weathered/shared";

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
