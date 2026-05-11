import type { WeatherSnapshot, WeatherSourceMode } from "@weathered/shared";

declare const process: {
  env?: {
    EXPO_PUBLIC_WEATHER_API_URL?: string;
  };
};

export const WEATHER_SOURCE_OPTIONS: WeatherSourceMode[] = ["daily_mock", "seasonal_mock", "live_ready"];
const defaultWeatherApiBaseUrl = "http://localhost:4000";

export interface WeatherSourceStatus {
  label: string;
  title: string;
  message: string;
  readiness: string;
  provider?: string;
  apiBaseUrl?: string;
  deviceHint?: string;
  envKey?: string;
  endpoint?: string;
  fallback?: string;
}

export function buildLocalWeatherSnapshot(
  mode: WeatherSourceMode,
  date: Date = new Date(),
): WeatherSnapshot {
  if (mode === "live_ready") {
    return buildLiveReadySnapshot(date);
  }

  if (mode === "seasonal_mock") {
    return buildSeasonalSnapshot(date);
  }

  return buildDailySnapshot(date);
}

export function formatWeatherSource(mode: WeatherSourceMode) {
  if (mode === "live_ready") {
    return "live ready";
  }

  return mode === "seasonal_mock" ? "seasonal" : "daily";
}

export function describeWeatherSource(mode: WeatherSourceMode): WeatherSourceStatus {
  if (mode === "live_ready") {
    return {
      label: "Live Ready",
      title: "Provider handoff is prepared",
      message: "Weathered calls the API route for Open-Meteo weather, then falls back locally if the device cannot reach it.",
      readiness: "Needs reachable API",
      provider: "Open-Meteo",
      apiBaseUrl: getWeatherApiBaseUrl(),
      deviceHint: getWeatherApiDeviceHint(),
      envKey: "EXPO_PUBLIC_WEATHER_API_URL",
      endpoint: "/context/weather?mode=live_ready",
      fallback: "Seasonal Bengaluru profile",
    };
  }

  if (mode === "seasonal_mock") {
    return {
      label: "Local Seasonal",
      title: "Seasonal context is active",
      message: "Weathered is using a local Bengaluru seasonal profile to make the check-in feel less static.",
      readiness: "Live-provider ready",
    };
  }

  return {
    label: "Local Daily",
    title: "Daily rotating context is active",
    message: "Weathered is using a date-based local weather cycle so patterns can be tested without network data.",
    readiness: "Prototype stable",
  };
}

export async function fetchLiveReadyWeatherSnapshot(): Promise<WeatherSnapshot> {
  const apiBaseUrl = getWeatherApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/context/weather?mode=live_ready`);

  if (!response.ok) {
    throw new Error(`Weather API request failed: ${response.status}`);
  }

  return normalizeWeatherSnapshot(await response.json());
}

export function getWeatherApiBaseUrl() {
  return process.env?.EXPO_PUBLIC_WEATHER_API_URL || defaultWeatherApiBaseUrl;
}

function getWeatherApiDeviceHint() {
  const apiBaseUrl = getWeatherApiBaseUrl();

  if (apiBaseUrl.includes("localhost") || apiBaseUrl.includes("127.0.0.1")) {
    return "Expo Go needs your Mac LAN URL, for example http://192.168.x.x:4000.";
  }

  return "Device URL is configured for network testing.";
}

function buildLiveReadySnapshot(date: Date): WeatherSnapshot {
  return {
    ...buildSeasonalSnapshot(date),
    locationLabel: "Bengaluru live-ready fallback",
  };
}

function normalizeWeatherSnapshot(value: unknown): WeatherSnapshot {
  const snapshot = value as Partial<WeatherSnapshot>;

  if (
    !isWeatherCondition(snapshot.condition) ||
    typeof snapshot.temperatureC !== "number" ||
    typeof snapshot.humidity !== "number" ||
    typeof snapshot.locationLabel !== "string"
  ) {
    throw new Error("Weather API returned an invalid snapshot");
  }

  return {
    condition: snapshot.condition,
    temperatureC: Math.round(snapshot.temperatureC),
    humidity: Math.round(snapshot.humidity),
    locationLabel: snapshot.locationLabel,
  };
}

function isWeatherCondition(value: unknown): value is WeatherSnapshot["condition"] {
  return value === "sunny" || value === "cloudy" || value === "rainy";
}

function buildDailySnapshot(date: Date): WeatherSnapshot {
  const conditions: WeatherSnapshot["condition"][] = ["sunny", "cloudy", "rainy"];
  const condition = conditions[date.getDate() % conditions.length];

  return {
    condition,
    temperatureC: condition === "rainy" ? 22 : 29,
    humidity: condition === "rainy" ? 82 : 58,
    locationLabel: "Bengaluru",
  };
}

function buildSeasonalSnapshot(date: Date): WeatherSnapshot {
  const month = date.getMonth();
  const isMonsoonLeaning = month >= 5 && month <= 8;
  const isWarmSeason = month >= 2 && month <= 4;
  const condition = isMonsoonLeaning ? "rainy" : isWarmSeason ? "sunny" : "cloudy";

  return {
    condition,
    temperatureC: isWarmSeason ? 31 : isMonsoonLeaning ? 23 : 26,
    humidity: isMonsoonLeaning ? 86 : isWarmSeason ? 48 : 66,
    locationLabel: "Bengaluru",
  };
}
