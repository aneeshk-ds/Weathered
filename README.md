# Weathered

A local-first mobile app for understanding how weather, mood, energy, and time shape everyday decisions.

Built as a personal tool: no accounts, no cloud sync. All data stays on the device.

---

## What It Does

- Fast personal check-ins for mood, energy, weather context, and decision moments
- Decision signals that connect current weather to focus, risk, and recommendation nudges
- Local history with create, edit, delete, and sample-data flows
- Weekly summaries with calmer infographic-style insight screens
- Audience-facing app navigation for Today, Check-in, Signals, History, and Summary
- Dev-only Release checks hidden behind the preview flag

---

## Current Version

`2.0.0` — production-ready app shell

Highlights:

- soothing dark-first palette for lower-glare weather and decision review
- app-style screen segregation with a calmer wellness-inspired flow
- audience navigation hides dev-only Release checks by default
- production-ready 2.0 release state across app, docs, and package versions
- Expo Go SDK 55 compatibility checked

---

## Stack

| Layer | Library |
|---|---|
| Framework | Expo (React Native) |
| Language | TypeScript |
| Architecture | Monorepo (apps / packages / scripts) |
| Storage | Local-only |

---

## Run Locally

```bash
npm install
npm run dev:mobile        # iOS/Android simulator
npm run dev:mobile:device # On a connected device
```

Requires Node 18+, Expo CLI, and either an iOS simulator or Android emulator.
