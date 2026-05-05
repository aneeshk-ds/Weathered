# Weathered Releases

## 1.7.0

Weathered 1.7.0 adds the first behavioral read layer before logging.

- Translates current weather, mood, and energy into focus, social, and decision-risk signals.
- Shows a practical behavioral read in the Log flow before the user saves an entry.
- Keeps the language advisory and agency-preserving, setting up future recommendations.

Validation:

```bash
npm run typecheck
```

## 1.6.0

Weathered 1.6.0 adds a visible weather source readiness read before logging.

- Adds source status copy for daily and seasonal local weather modes.
- Shows whether the current source is prototype stable or live-provider ready.
- Keeps the source explanation close to the selector in the Log flow.

Validation:

```bash
npm run typecheck
```

## 1.5.0

Weathered 1.5.0 makes the selected weather source a remembered local preference.

- Adds local preference storage with AsyncStorage.
- Restores the selected weather source when the app hydrates.
- Persists weather source changes independently from decision entries.
- Keeps the selectable source model ready for a live weather provider.

Validation:

```bash
npm run typecheck
```

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
