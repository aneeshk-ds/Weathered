export const ENERGY_LEVELS = ["low", "medium", "high"] as const;
export const DECISION_CATEGORIES = ["social", "work", "spending", "other"] as const;

export const DECISION_OPTIONS = {
  social: ["go_out", "cancel"],
  work: ["work", "skip"],
  spending: ["buy", "avoid"],
  other: ["note_only"],
} as const;

export type EnergyLevel = (typeof ENERGY_LEVELS)[number];
export type DecisionCategory = (typeof DECISION_CATEGORIES)[number];
export type DecisionOption = (typeof DECISION_OPTIONS)[DecisionCategory][number];
export type WeatherCondition = "sunny" | "cloudy" | "rainy";
export type WeatherSourceMode = "daily_mock" | "seasonal_mock" | "live_ready";
export type ThemeMode = "dark" | "light";
export type InsightConfidence = "low" | "medium" | "high";
export type BehaviorSignalLevel = "low" | "moderate" | "strong";
export type RecommendationTone = "encourage" | "caution" | "reframe";
export type RecommendationFeedbackValue = "helpful" | "not_now";

export interface WeatherSnapshot {
  condition: WeatherCondition;
  temperatureC: number;
  humidity: number;
  locationLabel: string;
}

export interface DecisionLogInput {
  id: string;
  userId: string;
  mood: number;
  energy: EnergyLevel;
  decisionCategory: DecisionCategory;
  decisionOutcome: DecisionOption;
  note?: string;
  weather: WeatherSnapshot;
  timestamp: string;
}

export interface Insight {
  id: string;
  title: string;
  message: string;
  confidence: InsightConfidence;
}

export interface GuidanceCard {
  id: string;
  title: string;
  message: string;
}

export interface DecisionForecast {
  id: string;
  title: string;
  message: string;
  actionLabel: string;
  confidence: InsightConfidence;
  weatherCondition: WeatherCondition;
  categoryFocus: DecisionCategory;
  signalStrength: number;
}

export interface BehaviorSignal {
  id: string;
  label: string;
  level: BehaviorSignalLevel;
  message: string;
}

export interface BehavioralRead {
  title: string;
  summary: string;
  signals: BehaviorSignal[];
}

export interface DecisionReadiness {
  score: number;
  label: string;
  message: string;
  drivers: string[];
}

export interface RecommendationNudge {
  id: string;
  title: string;
  message: string;
  actionLabel: string;
  tone: RecommendationTone;
  evidenceLabel?: string;
}

export interface RecommendationFeedback {
  nudgeId: string;
  value: RecommendationFeedbackValue;
  timestamp: string;
}

export interface WeeklySummary {
  totalEntries: number;
  averageMood: number;
  decisionCounts: Record<string, number>;
  topInsights: Insight[];
  guidance: GuidanceCard[];
}
