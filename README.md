# Weathered

A local-first mobile app for understanding how weather, mood, energy, and time shape everyday decisions.

Built as a personal tool — no accounts, no cloud sync. All data stays on the device.

---

## What it does

- Fast personal check-ins: mood, energy, focus, and decision quality
- Local logging with mocked weather context
- 7-day summaries with editorial infographic-style insight screens
- Signals overview — spot patterns across mood, energy, and conditions
- History band and check-in progress strip

---

## Current version

`1.50` — production-hardened prototype

---

## Stack

| Layer | Library |
|---|---|
| Framework | Expo (React Native) |
| Language | TypeScript |
| Architecture | Monorepo (apps / packages / scripts) |
| Storage | Local-only |

---

## Run locally

```bash
npm install
npm run dev:mobile        # iOS/Android simulator
npm run dev:mobile:device # On a connected device
```

Requires Node 18+, Expo CLI, and either an iOS simulator or Android emulator.
