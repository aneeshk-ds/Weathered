# Weathered

Weathered is a local-first mobile app for understanding how weather, mood, energy, and time shape everyday decisions.

The current release is a working prototype focused on:

- fast personal check-ins
- local mood and decision logging
- mocked weather context
- 7-day summaries
- editorial infographic-style insight screens

## Current Version

`1.4`

Highlights:

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
- source persistence and live-provider handoff
- repository/storage abstraction for future sync
- richer optional notes and reflection

## Notes

This repo is intentionally optimized for rapid product iteration rather than backend completeness at this stage.
