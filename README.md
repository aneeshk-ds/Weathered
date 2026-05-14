# Weathered

Weathered is a local-first mobile app for understanding how weather, mood, energy, and time shape everyday decisions.

The current release is a working prototype focused on:

- fast personal check-ins
- local mood and decision logging
- mocked weather context
- 7-day summaries
- editorial infographic-style insight screens

## Current Version

`1.33`

Highlights:

- dynamic 2.0 device gate status
- in-app phone pass result tracker
- device test checklist document
- QR-ready device release checklist
- one-command API plus Expo device stack
- API preflight for Expo Go device testing
- auto-LAN Expo Go device command
- in-app Expo Go device command
- Expo Go LAN start command
- Expo Go API URL device hint
- visible live weather API base URL
- in-app device release checklist
- actionable 2.0 readiness gate details
- feedback-tuned recommendation ordering
- recommendation nudge learning summary
- visible Live Ready last-checked status
- manual Live Ready API retry control
- mobile Live Ready API fetch with fallback
- API-side Open-Meteo adapter for live-ready weather
- provider handoff checklist for live weather
- 2.0 readiness milestone panel
- live-ready weather source with local fallback
- decision readiness score for the current choice window
- local feedback controls for recommendation nudges
- personalized recommendation evidence from saved local history
- Expo Go compatibility updated to SDK 55
- recommendation nudges for do, pause, and reframe choices
- behavioral read cards for focus, social energy, and decision risk
- weather source readiness panel in the Log flow
- persisted local weather source preference
- selectable local weather sources for daily and seasonal context
- API weather context can now request a source mode
- local decision forecast layer for next-step guidance
- next-read cards across logging and weekly summary views
- dark editorial summary mode
- richer infographic cards and trend panels
- local create, edit, and delete flows
- on-device persistence with AsyncStorage
- rule-based insights with gentle analytical language

## Repo Structure

- `apps/mobile`: Expo React Native app
- `apps/api`: lightweight Express API scaffold
- `packages/shared`: shared TypeScript types and contracts
- `docs`: product goals and planning notes
- `docs/releases.md`: version history and validation notes
- `docs/live-weather-setup.md`: live weather provider handoff contract
- `docs/device-test-checklist.md`: Expo Go validation checklist

## Run Locally

Requirements:

- Node.js
- npm

Install:

```bash
npm install
```

Start mobile:

```bash
npm run dev:mobile
```

Start mobile with tunnel:

```bash
npm run dev:mobile:tunnel
```

Start mobile for a same-Wi-Fi Expo Go test:

```bash
npm run dev:device:stack
```

Mobile-only auto fallback:

```bash
npm run dev:mobile:device:auto
```

Check API reachability first:

```bash
npm run dev:mobile:device:auto -- --check
```

Manual fallback:

```bash
EXPO_PUBLIC_WEATHER_API_URL=http://YOUR_MAC_LAN_IP:4000 npm run dev:mobile:device
```

The auto command detects your Mac LAN IP and sets `EXPO_PUBLIC_WEATHER_API_URL` before opening Expo in LAN mode. Use the manual fallback only if the detected IP is wrong.

Start API scaffold:

```bash
npm run dev:api
```

Typecheck:

```bash
npm run typecheck
```

## Product Direction

- mobile-only first
- local-first before auth or sync
- mocked weather until the UX stabilizes
- structured so sync, live weather, and deeper intelligence can be layered in later

## What’s Next

- live weather integration
- connect provider from `docs/live-weather-setup.md`
- personalized nudge tuning from saved decision patterns
- repository/storage abstraction for future sync
- richer optional notes and reflection

## Notes

This repo is intentionally optimized for rapid product iteration rather than backend completeness at this stage.
