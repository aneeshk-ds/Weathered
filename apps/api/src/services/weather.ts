import type { WeatherSnapshot, WeatherSourceMode } from "@weathered/shared";

const conditions: WeatherSnapshot["condition"][] = ["sunny", "cloudy", "rainy"];
const bengaluruCoordinates = {
  latitude: 12.9716,
  longitude: 77.5946,
};

interface OpenMeteoCurrentResponse {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
  };
}

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

export async function weatherSnapshot(mode: WeatherSourceMode = "daily_mock"): Promise<WeatherSnapshot> {
  if (mode !== "live_ready") {
    return mockWeatherSnapshot(mode);
  }

  return fetchOpenMeteoSnapshot().catch(() => mockWeatherSnapshot("live_ready"));
}

async function fetchOpenMeteoSnapshot(): Promise<WeatherSnapshot> {
  const params = new URLSearchParams({
    latitude: String(bengaluruCoordinates.latitude),
    longitude: String(bengaluruCoordinates.longitude),
    current: "temperature_2m,relative_humidity_2m,weather_code",
    timezone: "auto",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Open-Meteo request failed: ${response.status}`);
  }

  const payload = (await response.json()) as OpenMeteoCurrentResponse;
  const current = payload.current;

  if (
    typeof current?.temperature_2m !== "number" ||
    typeof current.relative_humidity_2m !== "number" ||
    typeof current.weather_code !== "number"
  ) {
    throw new Error("Open-Meteo response missing current weather fields");
  }

  return {
    condition: mapOpenMeteoCondition(current.weather_code),
    temperatureC: Math.round(current.temperature_2m),
    humidity: Math.round(current.relative_humidity_2m),
    locationLabel: "Bengaluru live via Open-Meteo",
  };
}

function mapOpenMeteoCondition(code: number): WeatherSnapshot["condition"] {
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 99)) {
    return "rainy";
  }

  if (code >= 1 && code <= 3) {
    return "cloudy";
  }

  return "sunny";
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
