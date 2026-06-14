# Weathered

A local-first mobile app for understanding how weather, mood, and energy shape your everyday decisions.

Live app → https://aneeshk-ds.github.io/Weathered/

Android APK preview → https://expo.dev/artifacts/eas/a8B7JjQ7mA4XzmatpPPsYa.apk

Built as a personal tool: no accounts, no cloud sync. All data stays on the device.

---

## What It Does

- Fast 20-second check-ins for mood, energy, and the decision you're making
- Live local weather from Open-Meteo using your device location
- A plain-language daily read on whether it's a good moment to decide
- Local history you can edit and delete, with sample data to explore
- An Insights view with ring and bar infographics, weekly patterns, and suggestions

---

## Screens

Three tabs, one job each:

- **Home** — the check-in plus today's weather and a one-line read
- **History** — your past check-ins, editable
- **Insights** — patterns, mood rings, decision breakdown, and suggestions

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
