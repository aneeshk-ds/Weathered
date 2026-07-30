export const ENERGY_LEVELS = ["low", "medium", "high"] as const;
export const DECISION_CATEGORIES = [
  "social",
  "work",
  "spending",
  "scrolling",
  "watching_tv",
  "gaming",
  "exercise",
  "eating",
  "other",
] as const;

export const DECISION_OPTIONS = {
  social: ["go_out", "stay_in", "message_someone", "later", "cancel"],
  work: ["work", "do_less", "take_break", "later", "skip"],
  spending: ["buy", "compare", "later", "avoid"],
  scrolling: ["do_now", "do_less", "later", "stop"],
  watching_tv: ["do_now", "do_less", "later", "stop"],
  gaming: ["do_now", "do_less", "later", "stop"],
  exercise: ["do_now", "do_less", "later", "rest"],
  eating: ["do_now", "do_less", "later", "skip"],
  other: ["do_now", "do_less", "later", "skip", "note_only"],
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
export type RecommendationSource = "live" | "history" | "category";
export type RecommendationFeedbackValue = "helpful" | "not_now";
export type DayRating = "rough" | "mixed" | "good" | "great";
export type DayFactor = "weather" | "work" | "people" | "screen_time" | "movement" | "food" | "rest";

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
  source: RecommendationSource;
  confidence: InsightConfidence;
  evidenceLabel?: string;
  purposeLabel?: string;
}

export interface RecommendationFeedback {
  nudgeId: string;
  value: RecommendationFeedbackValue;
  timestamp: string;
}

export interface DailyReflection {
  id: string;
  userId: string;
  rating: DayRating;
  factors: DayFactor[];
  note?: string;
  timestamp: string;
}

export interface WeeklySummary {
  totalEntries: number;
  trackedDays: number;
  averageMood: number;
  decisionCounts: Record<string, number>;
  topInsights: Insight[];
  guidance: GuidanceCard[];
}
