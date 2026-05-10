# Live Weather Setup

Weathered is currently live-ready, not live-connected. The app can select `live_ready`, show provider requirements, and fall back safely to local Bengaluru context.

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

- If live provider succeeds, return a normalized `WeatherSnapshot`.
- If provider fails, return the existing local fallback.
- Never block logging because weather lookup failed.

## 2.0 Gate

Weathered should move to `2.0` when:

- Live provider data is active in the app.
- Fallback behavior has been tested.
- At least one device/browser release flow has been verified end to end.
