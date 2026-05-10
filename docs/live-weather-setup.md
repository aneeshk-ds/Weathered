# Live Weather Setup

Weathered is live-ready in the mobile app and has an API-side Open-Meteo adapter for no-key prototyping. The mobile app still uses local fallback until it is pointed at the API.

## Target Provider

Use one of these first:

- Open-Meteo for no-key prototyping
- Tomorrow.io when API-key based provider behavior is needed

## Environment

Expected public mobile key:

```bash
EXPO_PUBLIC_WEATHER_API_KEY=
```

Server-side key, if the API owns provider calls later:

```bash
WEATHER_API_KEY=
```

## Contract

The mobile app and API should keep returning the existing shared shape:

```ts
interface WeatherSnapshot {
  condition: "sunny" | "cloudy" | "rainy";
  temperatureC: number;
  humidity: number;
  locationLabel: string;
}
```

## API Route

Current route:

```text
GET /context/weather?mode=live_ready
```

Expected behavior:

- If Open-Meteo succeeds, return a normalized `WeatherSnapshot`.
- If Open-Meteo fails, return the existing local fallback.
- Never block logging because weather lookup failed.

## 2.0 Gate

Weathered should move to `2.0` when:

- Live provider data is active in the app.
- Fallback behavior has been tested.
- At least one device/browser release flow has been verified end to end.
