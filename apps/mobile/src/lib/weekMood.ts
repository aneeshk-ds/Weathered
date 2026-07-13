import type { DecisionLogInput } from "@weathered/shared";

export function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Average mood per day for the trailing seven days, oldest first. Days with no
 * entries return 0 so the week chart always keeps a fixed seven-slot shape.
 * `today` is injectable to keep the function deterministic under test.
 */
export function buildWeekMood(entries: DecisionLogInput[], today: Date = new Date()): number[] {
  const week: number[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const dayEntries = entries.filter((entry) => sameDay(new Date(entry.timestamp), day));
    const avg = dayEntries.length ? dayEntries.reduce((sum, entry) => sum + entry.mood, 0) / dayEntries.length : 0;
    week.push(Math.round(avg * 10) / 10);
  }
  return week;
}

export interface WeekDay {
  key: string;
  label: string;
  value: number;
  isToday: boolean;
}

const WEEKDAY_INITIAL = ["S", "M", "T", "W", "T", "F", "S"];

function weekDayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

/**
 * The trailing seven days ending today (oldest first) with the real weekday
 * initial for each day and the current day flagged. Today's bucket reflects
 * today's check-ins live. `today` is injectable for testing.
 */
export function buildWeekDays(entries: DecisionLogInput[], today: Date = new Date()): WeekDay[] {
  const days: WeekDay[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const dayEntries = entries.filter((entry) => sameDay(new Date(entry.timestamp), day));
    const value = dayEntries.length
      ? Math.round((dayEntries.reduce((sum, entry) => sum + entry.mood, 0) / dayEntries.length) * 10) / 10
      : 0;
    days.push({ key: weekDayKey(day), label: WEEKDAY_INITIAL[day.getDay()], value, isToday: offset === 0 });
  }
  return days;
}
