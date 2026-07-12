import type { DecisionLogInput, RecommendationFeedback } from "@weathered/shared";
import {
  ensureSchemaVersion,
  loadEntries,
  loadPreferences,
  loadRecommendationFeedback,
  saveEntries,
  savePreferences,
  saveRecommendationFeedback,
  type LocalPreferences,
} from "./storage";

/**
 * The single data-access seam for the app. Screens and App state talk to a
 * WeatheredRepository, never to storage directly, so the backing store can be
 * swapped (local device now, an optional sync-backed store later) without
 * touching UI or business logic.
 */
export interface WeatheredRepository {
  ensureSchemaVersion(): Promise<number>;
  loadEntries(seedEntries: DecisionLogInput[]): Promise<DecisionLogInput[]>;
  saveEntries(entries: DecisionLogInput[]): Promise<boolean>;
  loadPreferences(): Promise<LocalPreferences>;
  savePreferences(preferences: LocalPreferences): Promise<boolean>;
  loadFeedback(): Promise<RecommendationFeedback[]>;
  saveFeedback(feedback: RecommendationFeedback[]): Promise<boolean>;
}

/** Local-first implementation backed by on-device AsyncStorage. */
export const localRepository: WeatheredRepository = {
  ensureSchemaVersion,
  loadEntries,
  saveEntries,
  loadPreferences,
  savePreferences,
  loadFeedback: loadRecommendationFeedback,
  saveFeedback: saveRecommendationFeedback,
};
