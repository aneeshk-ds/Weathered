# Weathered Releases

## 1.4.0

Weathered 1.4.0 turns the weather context from a fixed mock into a selectable local source.

- Adds daily and seasonal local weather source modes in the mobile Log flow.
- Uses the selected local source when saving new decision entries.
- Lets the forecast layer read against the active weather context.
- Adds API support for `/context/weather?mode=seasonal_mock`.
- Keeps the app local-first while preparing the weather layer for a live provider.

Validation:

```bash
npm run typecheck
```

## 1.3.0

Weathered 1.3.0 introduced local decision forecasts.

- Adds a forecast helper that reads recent mood, weather, energy, and decision patterns.
- Adds Next Read cards to the Log and Summary flows.
- Extends shared types with `DecisionForecast`.
