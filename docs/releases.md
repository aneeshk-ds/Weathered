# Weathered Releases

## 1.29.0

Weathered 1.29.0 adds a one-command device test stack.

- Adds `npm run dev:device:stack`.
- Starts the API and the auto-LAN Expo command together.
- Updates the Device Release Check panel to make the stack command the primary path.

Validation:

```bash
npx expo install --check
npm run typecheck
npx expo export --platform web --output-dir dist-web
```

## 1.28.0

Weathered 1.28.0 adds an API preflight for Expo Go device testing.

- Adds `npm run dev:mobile:device:auto -- --check`.
- Checks the detected LAN `/health` endpoint before QR testing.
- Shows the preflight command in the Device Release Check panel.

Validation:

```bash
npx expo install --check
npm run typecheck
npx expo export --platform web --output-dir dist-web
```

## 1.27.0

Weathered 1.27.0 adds an auto-LAN Expo Go launch command.

- Adds `npm run dev:mobile:device:auto`.
- Detects the Mac LAN IP and sets `EXPO_PUBLIC_WEATHER_API_URL` automatically.
- Updates the Device Release Check panel to show the auto command.

Validation:

```bash
npx expo install --check
npm run typecheck
npx expo export --platform web --output-dir dist-web
```

## 1.26.0

Weathered 1.26.0 surfaces the Expo Go device command in-app.

- Adds the same-Wi-Fi device command to the Device Release Check panel.
- Updates the web preview checklist row to the current export version.
- Keeps the QR validation workflow visible where the remaining release gate lives.

Validation:

```bash
npx expo install --check
npm run typecheck
npx expo export --platform web --output-dir dist-web
```

## 1.25.0

Weathered 1.25.0 adds a same-Wi-Fi Expo Go start path.

- Adds `npm run dev:mobile:device` at the repo root.
- Adds `start:device` to the mobile workspace with Expo LAN mode on port 8081.
- Documents the `EXPO_PUBLIC_WEATHER_API_URL=http://YOUR_MAC_LAN_IP:4000` device test command.

Validation:

```bash
npx expo install --check
npm run typecheck
npx expo export --platform web --output-dir dist-web
```

## 1.24.0

Weathered 1.24.0 adds device guidance for live weather API testing.

- Shows an Expo Go hint when the API base URL is still localhost.
- Explains that phone testing needs the Mac LAN URL.
- Keeps the hint inside the Live Ready weather source card.

Validation:

```bash
npx expo install --check
npm run typecheck
npx expo export --platform web --output-dir dist-web
```

## 1.23.0

Weathered 1.23.0 makes the live weather blocker visible in-app.

- Shows the configured API base URL in the Live Ready weather source card.
- Updates the Live Ready copy to reflect Open-Meteo as the current provider.
- Reframes the remaining live-weather gate around device API reachability.

Validation:

```bash
npx expo install --check
npm run typecheck
npx expo export --platform web --output-dir dist-web
```

## 1.22.0

Weathered 1.22.0 adds an in-app device release checklist.

- Adds a Device Release Check panel below 2.0 Readiness.
- Tracks web preview, Expo Go QR, and core phone-flow validation.
- Keeps the remaining release gate visible in the Log flow.

Validation:

```bash
npx expo install --check
npm run typecheck
npx expo export --platform web --output-dir dist-web
```

## 1.21.0

Weathered 1.21.0 makes the remaining 2.0 readiness gates actionable.

- Adds short status details to each 2.0 readiness gate.
- Calls out the live provider key as the remaining live-weather blocker.
- Calls out a clean device QR run as the remaining release-flow blocker.

Validation:

```bash
npx expo install --check
npm run typecheck
npx expo export --platform web --output-dir dist-web
```

## 1.20.0

Weathered 1.20.0 uses feedback to tune recommendation order.

- Moves helpful nudges upward in the Recommendation Nudges panel.
- Moves "Not now" nudges lower without deleting the signal.
- Marks personalized nudge tuning as complete in the 2.0 readiness panel.

Validation:

```bash
npx expo install --check
npm run typecheck
npx expo export --platform web --output-dir dist-web
```

## 1.19.0

Weathered 1.19.0 makes recommendation feedback visible as a learning signal.

- Adds a compact nudge learning summary to the Recommendation Nudges panel.
- Shows total feedback, helpful responses, and paused recommendations.
- Keeps the existing local feedback storage model unchanged.

Validation:

```bash
npx expo install --check
npm run typecheck
npx expo export --platform web --output-dir dist-web
```

## 1.18.0

Weathered 1.18.0 makes Live Ready retry results easier to verify.

- Adds a last-checked timestamp to the Live Ready weather source card.
- Resets the timestamp while a retry is in progress.
- Keeps API, fallback, and timing state together for browser QA.

Validation:

```bash
npx expo install --check
npm run typecheck
npx expo export --platform web --output-dir dist-web
```

## 1.17.0

Weathered 1.17.0 adds a manual API retry control for Live Ready weather.

- Adds Retry API to the Live Ready weather source card.
- Lets users re-check API/fallback state without switching source modes.
- Keeps fallback behavior visible when the API is unavailable.

Validation:

```bash
npx expo install --check
npm run typecheck
npx expo export --platform web --output-dir dist-web
```

## 1.16.0

Weathered 1.16.0 connects mobile Live Ready mode to the API route.

- Fetches `/context/weather?mode=live_ready` when Live Ready is selected.
- Falls back to the local live-ready weather profile if the API is unavailable.
- Shows the weather sync state inside the Weather Source card.

Validation:

```bash
npx expo install --check
npm run typecheck
npx expo export --platform web --output-dir dist-web
```

## 1.15.0

Weathered 1.15.0 adds the first API-side live weather adapter.

- Adds an Open-Meteo request path for `GET /context/weather?mode=live_ready`.
- Normalizes Open-Meteo current weather into the shared `WeatherSnapshot` shape.
- Falls back to the local live-ready weather profile if provider fetch fails.

Validation:

```bash
npx expo install --check
npm run typecheck
```

## 1.14.1

Weathered 1.14.1 documents the live weather provider handoff.

- Adds `docs/live-weather-setup.md`.
- Captures provider options, environment keys, response contract, API route, fallback behavior, and 2.0 gate.
- Links the setup doc from the README.

Validation:

```bash
npx expo install --check
npm run typecheck
```

## 1.14.0

Weathered 1.14.0 makes the live weather handoff explicit.

- Shows provider, environment key, API route, and fallback details in the Live Ready source state.
- Keeps local fallback behavior visible so users understand why live weather is not active yet.
- Preserves Expo Go compatibility and offline web preview behavior.

Validation:

```bash
npx expo install --check
npm run typecheck
npx expo export --platform web --output-dir dist-web
```

## 1.13.0

Weathered 1.13.0 adds an in-app 2.0 readiness panel.

- Shows the remaining gates before a major version jump.
- Keeps live weather API, personalized nudge tuning, and device-tested release flow visible in the Log flow.
- Makes versioning intentional instead of stretching 1.x indefinitely.

Validation:

```bash
npx expo install --check
npm run typecheck
npx expo export --platform web --output-dir dist-web
```

## 1.12.0

Weathered 1.12.0 adds a live-ready weather source path.

- Adds a Live Ready source option in the Log flow.
- Keeps the app functional through a local fallback while a provider API key is added.
- Extends API and mobile weather source handling to accept the live-ready mode.

Validation:

```bash
npx expo install --check
npm run typecheck
npx expo export --platform web --output-dir dist-web
```

## 1.11.0

Weathered 1.11.0 adds a Decision Readiness Score before logging.

- Condenses mood, energy, weather, risk, and local history into a 0-100 readiness score.
- Shows a Ready, Steady, or Pause label with the main drivers behind the score.
- Keeps the score advisory and reversible, matching the nudge model.

Validation:

```bash
npx expo install --check
npm run typecheck
npx expo export --platform web --output-dir dist-web
```

## 1.10.0

Weathered 1.10.0 adds local feedback controls to recommendation nudges.

- Lets users mark each nudge as Helpful or Not now.
- Persists nudge feedback locally with AsyncStorage.
- Clears nudge feedback when local entries are cleared, keeping the prototype state coherent.

Validation:

```bash
npx expo install --check
npm run typecheck
npx expo export --platform web --output-dir dist-web
```

## 1.9.0

Weathered 1.9.0 makes recommendation nudges history-aware.

- Uses recent saved entries to add pattern-based recommendation evidence.
- Prioritizes matching weather and decision category when enough local data exists.
- Shows concise evidence labels directly inside Recommendation Nudges.

Validation:

```bash
npm run typecheck
npx expo export --platform web --output-dir dist-web
```

## 1.8.1

Weathered 1.8.1 fixes Expo Go compatibility for current devices.

- Upgrades mobile runtime dependencies from Expo SDK 53 to SDK 55.
- Aligns React Native, React, React DOM, AsyncStorage, Metro runtime, and React Native Web with Expo SDK 55.
- Keeps the 1.8 recommendation nudge UI intact after the runtime upgrade.

Validation:

```bash
npx expo install --check
npm run typecheck
npx expo export --platform web --output-dir dist-web
```

## 1.8.0

Weathered 1.8.0 adds recommendation nudges before logging.

- Converts behavioral reads into practical do, pause, and reframe nudges.
- Tunes nudges to the active decision type: social, work, spending, or other.
- Keeps guidance advisory and reversible, so the app supports judgment rather than taking over.

Validation:

```bash
npm run typecheck
```

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
