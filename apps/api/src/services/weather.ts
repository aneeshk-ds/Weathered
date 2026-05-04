import type { WeatherSnapshot } from "@weathered/shared";

const conditions: WeatherSnapshot["condition"][] = ["sunny", "cloudy", "rainy"];

export function mockWeatherSnapshot(): WeatherSnapshot {
  const condition = conditions[new Date().getDate() % conditions.length];

  return {
    condition,
    temperatureC: condition === "rainy" ? 22 : 29,
    humidity: condition === "rainy" ? 82 : 58,
    locationLabel: "Bengaluru",
  };
}

