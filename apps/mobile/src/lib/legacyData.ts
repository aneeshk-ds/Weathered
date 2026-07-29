import type { DecisionLogInput } from "@weathered/shared";

const LEGACY_SAMPLE_ENTRY_IDS = new Set(["seed-1", "seed-2", "seed-3"]);

export function isLegacySampleEntry(entry: Pick<DecisionLogInput, "id">): boolean {
  return LEGACY_SAMPLE_ENTRY_IDS.has(entry.id);
}

export function removeLegacySampleEntries(entries: DecisionLogInput[]): DecisionLogInput[] {
  return entries.filter((entry) => !isLegacySampleEntry(entry));
}
