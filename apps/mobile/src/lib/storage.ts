import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DecisionLogInput } from "@weathered/shared";

const STORAGE_KEY = "weathered.local.entries.v1";

function withIds(entries: DecisionLogInput[]): DecisionLogInput[] {
  return entries.map((entry, index) => ({
    ...entry,
    id: entry.id || `migrated-${entry.timestamp}-${index}`,
  }));
}

export async function loadEntries(seedEntries: DecisionLogInput[]): Promise<DecisionLogInput[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);

    if (!raw) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seedEntries));
      return seedEntries;
    }

    const parsed = JSON.parse(raw) as DecisionLogInput[];
    return Array.isArray(parsed) ? withIds(parsed) : seedEntries;
  } catch {
    return seedEntries;
  }
}

export async function saveEntries(entries: DecisionLogInput[]): Promise<boolean> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    return true;
  } catch {
    return false;
  }
}
