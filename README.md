# Weathered

Weathered is a decision intelligence app that helps users notice how weather, mood, energy, and time affect everyday decisions.

This repository is scaffolded as a monorepo with:

- `apps/mobile`: Expo React Native client
- `apps/api`: Express API for logs and insights
- `packages/shared`: shared TypeScript types and constants
- `docs`: product goals, scope, and open questions

## Current Product Direction

- Mobile-only for the first usable version
- Local-first so the app can be tested personally before sync or auth exists
- Mock weather/context until the UI and flows stabilize
- Structured to expand into persistence, sync, and smarter insights later

## Current Mobile State

- Local entry creation, editing, and deletion
- 7-day summary view
- Mock weather context
- On-device persistence using AsyncStorage
- `1.2` includes a darker editorial summary mode with richer infographics

## Getting Started

This is an active local prototype scaffold.

### Planned stack

- Mobile: Expo + React Native + TypeScript
- API: Node.js + Express + TypeScript
- Database: PostgreSQL

### Suggested next steps

1. Refine the visual system and dashboard storytelling.
2. Connect a weather provider.
3. Add a database-ready repository layer.
4. Wire sync/API later when local usage feels right.
