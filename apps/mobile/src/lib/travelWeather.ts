import type { WeatherSnapshot } from "@weathered/shared";

export const TRAVEL_GEOFENCE_RADIUS_M = 5000;
export const TRAVEL_NOTIFICATION_COOLDOWN_MS = 90 * 60 * 1000;
export const TRAVEL_TEMPERATURE_CHANGE_C = 4;
export const TRAVEL_HUMIDITY_CHANGE_PERCENT = 20;

export interface TravelWeatherSample {
  latitude: number;
  longitude: number;
  capturedAt: string;
  weather: WeatherSnapshot;
}

export interface TravelWeatherState {
  lastSample?: TravelWeatherSample;
  lastNotifiedAt?: string;
}

export interface TravelWeatherAssessment {
  shouldNotify: boolean;
  title?: string;
  body?: string;
  nextState: TravelWeatherState;
  reasons: Array<"new_place" | "condition" | "temperature" | "humidity" | "cooldown">;
}

const GENERIC_LOCATION_LABELS = new Set(["current location", "new place", "local estimate", "unknown"]);

/**
 * Decide whether a new travel sample deserves a notification. Geofencing
 * supplies the movement signal; this function adds weather/place comparison
 * and a cooldown so driving through nearby areas does not create notification
 * spam.
 */
export function assessTravelWeather(
  previousState: TravelWeatherState,
  currentSample: TravelWeatherSample,
  now: Date = new Date(),
): TravelWeatherAssessment {
  const previous = previousState.lastSample;
  const reasons: TravelWeatherAssessment["reasons"] = [];
  const lastNotifiedAt = parseTimestamp(previousState.lastNotifiedAt);
  const inCooldown = lastNotifiedAt !== null && now.getTime() - lastNotifiedAt < TRAVEL_NOTIFICATION_COOLDOWN_MS;

  if (!previous) {
    reasons.push("new_place");
  } else {
    if (hasSpecificPlaceChanged(previous.weather.locationLabel, currentSample.weather.locationLabel)) {
      reasons.push("new_place");
    }
    if (previous.weather.condition !== currentSample.weather.condition) {
      reasons.push("condition");
    }
    if (
      Math.abs(previous.weather.temperatureC - currentSample.weather.temperatureC) >=
      TRAVEL_TEMPERATURE_CHANGE_C
    ) {
      reasons.push("temperature");
    }
    if (
      Math.abs(previous.weather.humidity - currentSample.weather.humidity) >=
      TRAVEL_HUMIDITY_CHANGE_PERCENT
    ) {
      reasons.push("humidity");
    }
  }

  const changeReasons = reasons.filter((reason) => reason !== "cooldown");
  if (inCooldown && changeReasons.length > 0) {
    reasons.push("cooldown");
  }
  const shouldNotify = changeReasons.length > 0 && !inCooldown;
  const nextState: TravelWeatherState = {
    lastSample: currentSample,
    lastNotifiedAt: shouldNotify ? now.toISOString() : previousState.lastNotifiedAt,
  };

  if (!shouldNotify) {
    return { shouldNotify, nextState, reasons };
  }

  const weatherChanged = changeReasons.some((reason) => reason !== "new_place");
  return {
    shouldNotify,
    title: weatherChanged
      ? `Weather changed in ${currentSample.weather.locationLabel}`
      : `Weather in ${currentSample.weather.locationLabel}`,
    body: buildNotificationBody(previous, currentSample, changeReasons),
    nextState,
    reasons,
  };
}

export function normalizeTravelWeatherState(value: unknown): TravelWeatherState {
  if (!isRecord(value)) {
    return {};
  }

  const lastSample = isTravelWeatherSample(value.lastSample) ? value.lastSample : undefined;
  const lastNotifiedAt =
    typeof value.lastNotifiedAt === "string" && parseTimestamp(value.lastNotifiedAt) !== null
      ? value.lastNotifiedAt
      : undefined;
  const normalized: TravelWeatherState = {};

  if (lastSample) normalized.lastSample = lastSample;
  if (lastNotifiedAt) normalized.lastNotifiedAt = lastNotifiedAt;
  return normalized;
}

function buildNotificationBody(
  previous: TravelWeatherSample | undefined,
  current: TravelWeatherSample,
  reasons: TravelWeatherAssessment["reasons"],
): string {
  const currentCondition = capitalize(current.weather.condition);
  const currentSummary = `${currentCondition}, ${current.weather.temperatureC}°C`;

  if (!previous) {
    return `${currentSummary} in ${current.weather.locationLabel}. Check in and adjust your plans for this place.`;
  }

  if (reasons.includes("condition")) {
    return `Conditions shifted from ${previous.weather.condition} to ${current.weather.condition}; it is ${current.weather.temperatureC}°C now.`;
  }

  if (reasons.includes("temperature")) {
    const difference = current.weather.temperatureC - previous.weather.temperatureC;
    return `${currentSummary} — ${Math.abs(difference)}° ${difference > 0 ? "warmer" : "cooler"} than ${previous.weather.locationLabel}.`;
  }

  if (reasons.includes("humidity")) {
    return `${currentSummary}, with humidity now ${current.weather.humidity}%. Conditions feel different here.`;
  }

  return `${currentSummary}. A new place can shift your mood and decisions—take a quick check-in.`;
}

function hasSpecificPlaceChanged(previousLabel: string, currentLabel: string): boolean {
  const previous = previousLabel.trim().toLocaleLowerCase();
  const current = currentLabel.trim().toLocaleLowerCase();

  return (
    previous.length > 0 &&
    current.length > 0 &&
    previous !== current &&
    !GENERIC_LOCATION_LABELS.has(previous) &&
    !GENERIC_LOCATION_LABELS.has(current)
  );
}

function isTravelWeatherSample(value: unknown): value is TravelWeatherSample {
  if (!isRecord(value) || !isRecord(value.weather)) {
    return false;
  }

  return (
    typeof value.latitude === "number" &&
    Number.isFinite(value.latitude) &&
    value.latitude >= -90 &&
    value.latitude <= 90 &&
    typeof value.longitude === "number" &&
    Number.isFinite(value.longitude) &&
    value.longitude >= -180 &&
    value.longitude <= 180 &&
    typeof value.capturedAt === "string" &&
    parseTimestamp(value.capturedAt) !== null &&
    (value.weather.condition === "sunny" ||
      value.weather.condition === "cloudy" ||
      value.weather.condition === "rainy") &&
    typeof value.weather.temperatureC === "number" &&
    Number.isFinite(value.weather.temperatureC) &&
    typeof value.weather.humidity === "number" &&
    Number.isFinite(value.weather.humidity) &&
    typeof value.weather.locationLabel === "string" &&
    value.weather.locationLabel.trim().length > 0
  );
}

function parseTimestamp(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
