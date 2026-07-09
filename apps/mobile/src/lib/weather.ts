import type { WeatherSnapshot, WeatherSourceMode } from "@weathered/shared";

export const WEATHER_SOURCE_OPTIONS: WeatherSourceMode[] = ["live_ready", "seasonal_mock", "daily_mock"];

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
const OPEN_METEO_CURRENT_FIELDS = "temperature_2m,relative_humidity_2m,weather_code";
const WEATHER_REQUEST_TIMEOUT_MS = 8000;
const WEATHER_REQUEST_RETRIES = 1;

interface WeatherLocation {
  latitude: number;
  longitude: number;
  label: string;
}

interface WeatherResponseLike {
  ok: boolean;
  status: number;
  json(): Promise<OpenMeteoCurrentResponse>;
}

type WeatherFetcher = (url: string, init?: RequestInit) => Promise<WeatherResponseLike>;

export interface WeatherSourceStatus {
  label: string;
  title: string;
  message: string;
  readiness: string;
  provider?: string;
  fallback?: string;
}

export function buildLocalWeatherSnapshot(mode: WeatherSourceMode, date: Date = new Date()): WeatherSnapshot {
  if (mode === "seasonal_mock" || mode === "live_ready") {
    return buildSeasonalSnapshot(date);
  }

  return buildDailySnapshot(date);
}

export function formatWeatherSource(mode: WeatherSourceMode) {
  if (mode === "live_ready") {
    return "live";
  }

  return mode === "seasonal_mock" ? "seasonal" : "daily";
}

export function describeWeatherSource(mode: WeatherSourceMode): WeatherSourceStatus {
  if (mode === "live_ready") {
    return {
      label: "Live",
      title: "Live weather is active",
      message:
        "Weathered reads your current conditions from Open-Meteo using your device location, and falls back to a local estimate if it cannot reach the network.",
      readiness: "Live provider connected",
      provider: "Open-Meteo",
      fallback: "Local seasonal estimate",
    };
  }

  if (mode === "seasonal_mock") {
    return {
      label: "Local Seasonal",
      title: "Seasonal estimate is active",
      message: "Weathered is using a local seasonal profile instead of live data.",
      readiness: "Offline-friendly estimate",
    };
  }

  return {
    label: "Local Daily",
    title: "Daily rotating estimate is active",
    message: "Weathered is using a date-based local cycle so patterns can be tested without network data.",
    readiness: "Prototype mode",
  };
}

export function buildOpenMeteoCurrentUrl(location: Pick<WeatherLocation, "latitude" | "longitude">) {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    current: OPEN_METEO_CURRENT_FIELDS,
    timezone: "auto",
  });

  return `${OPEN_METEO_URL}?${params.toString()}`;
}

interface OpenMeteoCurrentResponse {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
  };
}

export function normalizeOpenMeteoCurrentResponse(
  payload: OpenMeteoCurrentResponse,
  locationLabel: string,
): WeatherSnapshot {
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
    locationLabel,
  };
}

export async function fetchOpenMeteoCurrentWeather(
  location: WeatherLocation,
  fetcher: WeatherFetcher = fetch,
): Promise<WeatherSnapshot> {
  const payload = await fetchOpenMeteoPayload(buildOpenMeteoCurrentUrl(location), fetcher);
  return normalizeOpenMeteoCurrentResponse(payload, location.label);
}

export async function fetchLiveReadyWeatherSnapshot(): Promise<WeatherSnapshot> {
  const { resolveDeviceLocation } = await import("./location");
  const location = await resolveDeviceLocation();
  return fetchOpenMeteoCurrentWeather(location);
}

async function fetchOpenMeteoPayload(url: string, fetcher: WeatherFetcher): Promise<OpenMeteoCurrentResponse> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= WEATHER_REQUEST_RETRIES; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, fetcher);

      if (!response.ok) {
        throw new Error(`Open-Meteo request failed: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Open-Meteo request failed");
}

async function fetchWithTimeout(url: string, fetcher: WeatherFetcher): Promise<WeatherResponseLike> {
  const controller = typeof AbortController === "function" ? new AbortController() : null;
  const timeout = controller
    ? setTimeout(() => {
        controller.abort();
      }, WEATHER_REQUEST_TIMEOUT_MS)
    : null;

  try {
    return await fetcher(url, controller ? { signal: controller.signal } : undefined);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
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

function buildDailySnapshot(date: Date): WeatherSnapshot {
  const conditions: WeatherSnapshot["condition"][] = ["sunny", "cloudy", "rainy"];
  const condition = conditions[date.getDate() % conditions.length];

  return {
    condition,
    temperatureC: condition === "rainy" ? 22 : 29,
    humidity: condition === "rainy" ? 82 : 58,
    locationLabel: "Local estimate",
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
    locationLabel: "Local estimate",
  };
}
