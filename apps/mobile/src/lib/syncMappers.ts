import type { DecisionLogInput, RecommendationFeedback } from "@weathered/shared";

export interface RemoteCheckIn {
  user_id?: string;
  id: string;
  mood: number;
  energy: string;
  decision_category: string;
  decision_outcome: string;
  note: string | null;
  weather: unknown;
  timestamp: string;
}

export interface RemoteFeedback {
  user_id?: string;
  nudge_id: string;
  value: string;
  timestamp: string;
}

export function toRemoteCheckIn(entry: DecisionLogInput, userId: string): RemoteCheckIn {
  return {
    user_id: userId,
    id: entry.id,
    mood: entry.mood,
    energy: entry.energy,
    decision_category: entry.decisionCategory,
    decision_outcome: entry.decisionOutcome,
    note: entry.note ?? null,
    weather: entry.weather,
    timestamp: entry.timestamp,
  };
}

export function fromRemoteCheckIn(row: RemoteCheckIn): DecisionLogInput {
  return {
    id: row.id,
    userId: "local",
    mood: row.mood,
    energy: row.energy as DecisionLogInput["energy"],
    decisionCategory: row.decision_category as DecisionLogInput["decisionCategory"],
    decisionOutcome: row.decision_outcome as DecisionLogInput["decisionOutcome"],
    note: row.note ?? undefined,
    weather: row.weather as DecisionLogInput["weather"],
    timestamp: row.timestamp,
  };
}

export function toRemoteFeedback(item: RecommendationFeedback, userId: string): RemoteFeedback {
  return {
    user_id: userId,
    nudge_id: item.nudgeId,
    value: item.value,
    timestamp: item.timestamp,
  };
}

export function fromRemoteFeedback(row: RemoteFeedback): RecommendationFeedback {
  return {
    nudgeId: row.nudge_id,
    value: row.value as RecommendationFeedback["value"],
    timestamp: row.timestamp,
  };
}
