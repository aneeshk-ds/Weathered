import type { WeatherSnapshot, WeatherSourceMode } from "@weathered/shared";

export const WEATHER_SOURCE_OPTIONS: WeatherSourceMode[] = ["daily_mock", "seasonal_mock", "live_ready"];

export interface WeatherSourceStatus {
  label: string;
  title: string;
  message: string;
  readiness: string;
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
      message: "Weathered is using the local fallback shape while the live weather API key and provider endpoint are wired in.",
      readiness: "Needs API key",
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

function buildLiveReadySnapshot(date: Date): WeatherSnapshot {
  return {
    ...buildSeasonalSnapshot(date),
    locationLabel: "Bengaluru live-ready fallback",
  };
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
