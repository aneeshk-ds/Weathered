import type { DecisionCategory, DecisionLogInput } from "@weathered/shared";

export type HistoryCategoryFilter = DecisionCategory | "all";

/**
 * Filter check-ins by decision category and a free-text query. The query is
 * matched, case-insensitively, against the note plus the category, outcome,
 * weather condition, and location label so a single search box covers the
 * fields a user is likely to remember.
 */
export function filterHistoryEntries(
  entries: DecisionLogInput[],
  options: { category: HistoryCategoryFilter; query: string },
): DecisionLogInput[] {
  const query = options.query.trim().toLowerCase();
  return entries.filter((entry) => {
    if (options.category !== "all" && entry.decisionCategory !== options.category) {
      return false;
    }
    if (!query) {
      return true;
    }
    const haystack = [
      entry.note ?? "",
      entry.decisionCategory,
      entry.decisionOutcome,
      entry.weather.condition,
      entry.weather.locationLabel,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

export interface HistoryDayGroup {
  key: string;
  label: string;
  entries: DecisionLogInput[];
}

/**
 * Group check-ins into day buckets, preserving the incoming order (newest
 * first). The most recent two days read as "Today" and "Yesterday"; older days
 * use a short weekday-month-day label. `today` is injectable for testing.
 */
export function groupEntriesByDay(entries: DecisionLogInput[], today: Date = new Date()): HistoryDayGroup[] {
  const groups: HistoryDayGroup[] = [];
  const index = new Map<string, HistoryDayGroup>();
  for (const entry of entries) {
    const date = new Date(entry.timestamp);
    const key = dayKey(date);
    let group = index.get(key);
    if (!group) {
      group = { key, label: dayLabel(date, today), entries: [] };
      index.set(key, group);
      groups.push(group);
    }
    group.entries.push(entry);
  }
  return groups;
}

function dayKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function dayLabel(date: Date, today: Date): string {
  if (dayKey(date) === dayKey(today)) {
    return "Today";
  }
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(date) === dayKey(yesterday)) {
    return "Yesterday";
  }
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
