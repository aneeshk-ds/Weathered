import type { WeatherSnapshot, WeatherSourceMode } from "@weathered/shared";

const conditions: WeatherSnapshot["condition"][] = ["sunny", "cloudy", "rainy"];

export function mockWeatherSnapshot(mode: WeatherSourceMode = "daily_mock"): WeatherSnapshot {
  if (mode === "live_ready") {
    return {
      ...seasonalWeatherSnapshot(),
      locationLabel: "Bengaluru live-ready fallback",
    };
  }

  if (mode === "seasonal_mock") {
    return seasonalWeatherSnapshot();
  }

  const condition = conditions[new Date().getDate() % conditions.length];

  return {
    condition,
    temperatureC: condition === "rainy" ? 22 : 29,
    humidity: condition === "rainy" ? 82 : 58,
    locationLabel: "Bengaluru",
  };
}

function seasonalWeatherSnapshot(): WeatherSnapshot {
  const month = new Date().getMonth();
  const isMonsoonLeaning = month >= 5 && month <= 8;
  const isWarmSeason = month >= 2 && month <= 4;
  const condition: WeatherSnapshot["condition"] = isMonsoonLeaning ? "rainy" : isWarmSeason ? "sunny" : "cloudy";

  return {
    condition,
    temperatureC: isWarmSeason ? 31 : isMonsoonLeaning ? 23 : 26,
    humidity: isMonsoonLeaning ? 86 : isWarmSeason ? 48 : 66,
    locationLabel: "Bengaluru",
  };
}
