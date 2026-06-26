# Weathered System Design

Weathered is a local-first mobile app. It helps a user log mood, energy, decisions, and weather context, then shows simple patterns over time.

## Who Uses It

Weathered is for people who want lightweight self-awareness without journaling heavily. The first version is designed for one person using one device.

## Main User Flow

1. The user opens the app.
2. Weathered loads saved check-ins from device storage.
3. Weathered tries to get live local weather.
4. If live weather is unavailable, Weathered uses a local estimate.
5. The user logs mood, energy, decision type, decision outcome, and an optional note.
6. The app saves the entry on the device.
7. The Insights screen summarizes recent patterns.

## App Structure

- `apps/mobile/App.tsx` coordinates app state and screen routing.
- `apps/mobile/src/screens` contains Home, History, Insights, and Settings.
- `apps/mobile/src/components` contains shared visual pieces.
- `apps/mobile/src/lib` contains business logic, storage, weather, diagnostics, backup, and restore behavior.
- `packages/shared/src` contains shared data types and decision contracts.

## Data Storage

Weathered stores data on the user's device with AsyncStorage.

Stored data includes:

- check-ins
- local preferences
- recommendation feedback
- local diagnostic counters

Weathered does not currently use a backend database, user accounts, or cloud sync.

## Sensitive Data

Potentially sensitive data includes:

- mood
- energy
- decision notes
- location-derived weather context

This data stays on the device unless the user exports a backup file.

## Weather

Weathered asks for foreground location permission when live weather is enabled. It uses the device location to request current weather from Open-Meteo.

Open-Meteo does not require a secret API key in this app.

If location permission is denied, the network fails, or the weather provider returns bad data, Weathered falls back to a local weather estimate.

## Backup And Restore

The Settings screen lets the user export a JSON backup through the device share sheet.

Restore uses the device document picker. Restored files are validated before data is loaded into the app. Invalid moods, categories, weather snapshots, timestamps, and malformed entries are rejected.

## Diagnostics

Weathered keeps local diagnostic counters so support and debugging are not pure guesswork.

The app tracks:

- successful live weather updates
- weather fallback events
- location permission denials
- backup export and restore outcomes
- local storage write failures

The Settings screen shows an App health card with these signals.

## Failure Behavior

- If live weather fails, the app keeps working with a local estimate.
- If backup export fails, the user sees a plain-language message.
- If restore fails, the user sees a plain-language message and existing data remains unchanged.
- If local storage write fails, the app records a local diagnostic issue.

## Release Pipeline

The web preview deploy runs through GitHub Actions.

The deploy workflow runs:

1. `npm ci`
2. `npm run typecheck`
3. `npm run test:core`
4. `npm run verify:project`
5. `npm run export:web`
6. GitHub Pages deployment

Android builds run through the manual **Android Build** workflow. The workflow requires an `EXPO_TOKEN` repository secret.

## Current Limits

Weathered does not yet include:

- backend sync
- multi-device accounts
- remote crash reporting
- push notifications
- advanced analytics
- automated end-to-end device tests

These are intentional limits for the current local-first version.

## Future Backend Path

If Weathered adds accounts or sync later, the next architecture should include:

- authenticated users
- server-side ownership checks
- encrypted transport
- per-user data boundaries
- conflict handling for multi-device edits
- deletion/export requests that include cloud data
