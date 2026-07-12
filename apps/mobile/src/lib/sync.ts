import type { DecisionLogInput, RecommendationFeedback } from "@weathered/shared";

/** A full snapshot of the user's data that a sync backend moves in and out. */
export interface SyncSnapshot {
  entries: DecisionLogInput[];
  feedback: RecommendationFeedback[];
}

/**
 * The seam a cloud provider (for example Supabase) implements to make the
 * local-first data optionally sync. The default is local-only: nothing leaves
 * the device unless the user explicitly opts in and a real backend is wired.
 */
export interface SyncBackend {
  readonly id: string;
  push(snapshot: SyncSnapshot): Promise<boolean>;
  pull(): Promise<SyncSnapshot | null>;
}

export const localOnlySync: SyncBackend = {
  id: "local-only",
  async push() {
    return true;
  },
  async pull() {
    return null;
  },
};

function latestById<T>(items: T[], id: (item: T) => string, timestamp: (item: T) => string): T[] {
  const byId = new Map<string, T>();
  for (const item of items) {
    const key = id(item);
    const existing = byId.get(key);
    if (!existing || Date.parse(timestamp(item)) >= Date.parse(timestamp(existing))) {
      byId.set(key, item);
    }
  }
  return [...byId.values()];
}

/**
 * Deterministic last-write-wins merge of a local and remote snapshot, keyed by
 * stable ids with the newest timestamp winning. Pure and side-effect free so it
 * can back any future sync backend and be tested in isolation.
 */
export function mergeSnapshots(local: SyncSnapshot, remote: SyncSnapshot): SyncSnapshot {
  return {
    entries: latestById(
      [...local.entries, ...remote.entries],
      (entry) => entry.id,
      (entry) => entry.timestamp,
    ).sort((left, right) => Date.parse(right.timestamp) - Date.parse(left.timestamp)),
    feedback: latestById(
      [...local.feedback, ...remote.feedback],
      (item) => item.nudgeId,
      (item) => item.timestamp,
    ),
  };
}
