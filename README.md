# Weathered

A local-first mobile app for understanding how weather, mood, and energy shape your everyday decisions.

Live app -> https://aneeshk-ds.github.io/Weathered/

Android APK (latest build) -> https://github.com/aneeshk-ds/Weathered/releases/latest/download/weathered-latest.apk

The APK link points to the newest build. It is published automatically to the `latest-apk` GitHub Release each time the Android Build workflow runs with the `preview-apk` profile. If the link 404s, no build has been published yet: run the workflow (or `npm run build:android:apk`) once. Build and publish guide -> [docs/android-apk.md](docs/android-apk.md). See build results -> [docs/build-results.md](docs/build-results.md).

Built as a personal tool. Local-first and private by default: no account is required and data stays on the device. Optional cloud sync (anonymous, scoped per device with row-level security) can be turned on in Settings.

Product goals -> [docs/product-goals.md](docs/product-goals.md)

Privacy policy -> [docs/privacy-policy.md](docs/privacy-policy.md)

Release checklist -> [docs/release-checklist.md](docs/release-checklist.md)

System design -> [docs/system-design.md](docs/system-design.md)

Data and backend -> [docs/data-backend.md](docs/data-backend.md)

User validation plan -> [docs/user-validation.md](docs/user-validation.md)

Build results -> [docs/build-results.md](docs/build-results.md)

Android smoke test -> [docs/android-smoke-test.md](docs/android-smoke-test.md)

Support -> https://github.com/aneeshk-ds/Weathered/issues

---

## What It Does

- Fast 20-second check-ins for mood, energy, and the decision you're making
- Live local weather from Open-Meteo using your device location
- A plain-language daily read on whether it's a good moment to decide
- A Home "This week" summary: a mood ring, current streak, and week-over-week mood change
- Local history you can search, filter, edit, and delete, with sample data to explore
- An Insights view with ring and bar infographics, a 7-day chart through today with the current day highlighted and updating live, weekly patterns, and suggestions
- Optional daily check-in reminders at four times of day
- An optional location-change nudge that invites a check-in when you move to a new place
- Optional anonymous cloud sync with per-device row-level security
- Dark and light themes

---

## Screens

Three tabs, one job each:

- **Home**: the check-in, today's weather, a one-line read, and the This week summary
- **History**: your past check-ins, searchable, filterable, and editable
- **Insights**: patterns, mood rings, decision breakdown, the weekly chart, and suggestions

---

## Settings and Personalization

Everything below is off by default and controlled from the Settings tab:

- **Appearance**: switch between dark and light themes
- **Weather source**: live location weather or a local estimate
- **Cloud sync (beta)**: anonymous sign-in, data scoped to your device with row-level security
- **Daily reminders**: four check-in nudges across the day
- **Location nudge (beta)**: a background geofence that prompts a check-in when you move to a new area, using all-the-time location permission

---

## Stack

| Layer | Library |
|---|---|
| Framework | Expo (React Native) |
| Language | TypeScript |
| Charts | react-native-svg |
| Location | expo-location |
| Weather | Open-Meteo (no key) |
| Storage | On-device (AsyncStorage) |
| Optional sync | Supabase (anonymous auth, row-level security) |
| Reminders | expo-notifications |
| Background nudge | expo-task-manager, expo-location geofencing |

Code is organised into `src/components`, `src/screens`, and `src/lib` (logic),
with shared types in `packages/shared`.

---

## Run Locally

```bash
npm install
npm run dev:mobile        # iOS/Android simulator
npm run dev:mobile:device # On a connected device
npm run build:android:apk # Android APK preview build
```

Requires Node 18+, Expo CLI, and either an iOS simulator or Android emulator.
Live weather needs location permission; without it the app falls back to a local estimate.
