# Weathered Data and Backend

This document describes how Weathered stores data today and the architecture that
lets an optional cloud sync be added later without changing the core model.

## Current State

Weathered is local-first. All data stays on the device in AsyncStorage:

- check-ins (`weathered.local.entries.v1`)
- preferences (`weathered.local.preferences.v1`)
- recommendation feedback (`weathered.local.nudge-feedback.v1`)
- schema version marker (`weathered.local.schema-version`)

No account, no network writes of personal data. Live weather is the only network
call, and it sends only coarse location to Open-Meteo, with no identifier.

## Repository Layer

`src/lib/repository.ts` defines `WeatheredRepository`, the single data-access
seam. App state and screens call the repository, never storage directly. The
default `localRepository` is backed by on-device storage. A future
sync-backed repository can implement the same interface and be swapped in one
place, with no UI or business-logic changes.

## Schema Versioning

`src/lib/storage.ts` exposes `STORAGE_SCHEMA_VERSION` (currently 1), a
`schema-version` marker, and `ensureSchemaVersion()`, which runs on app start.
Installs with no marker are treated as version 1. There are no migrations at
version 1; the runner and marker exist so a future change to the stored shape
has an ordered, testable upgrade path. `resolveStoredVersion()` is a pure helper
covered by tests.

## Optional Sync Architecture

`src/lib/sync.ts` defines `SyncBackend` (`push`, `pull`) and a `SyncSnapshot`
(entries plus feedback). The default `localOnlySync` is a no-op: nothing leaves
the device. `mergeSnapshots()` is a pure, tested last-write-wins merge keyed by
stable ids with the newest timestamp winning; it is the conflict strategy any
real backend would reuse.

Sync is off by default. It is turned on by an explicit opt-in in Settings, which
signs the device in anonymously and syncs through the Supabase backend below.

## Supabase Adapter (implemented)

Cloud sync is implemented as an optional, off-by-default Supabase backend
(`src/lib/supabase.ts`, `src/lib/supabaseSync.ts`, `src/lib/syncMappers.ts`),
wired behind the `syncEnabled` preference and a Settings toggle. The provisioned
project uses the following.

### Tables

- `check_ins`: columns matching `DecisionLogInput` (`id` text primary key,
  `user_id` uuid, `mood` int, `energy` text, `decision_category` text,
  `decision_outcome` text, `note` text null, `weather` jsonb, `timestamp`
  timestamptz, `updated_at` timestamptz).
- `nudge_feedback`: `nudge_id` text, `user_id` uuid, `value` text, `timestamp`
  timestamptz, primary key (`user_id`, `nudge_id`).

### Row-Level Security

RLS on, with a policy that restricts every row to `auth.uid() = user_id` for
select, insert, update, and delete. This enforces per-user isolation, which is
the main safeguard against cross-user data exposure.

### Auth

Sync requires a signed-in user so rows can be scoped. The app uses Supabase
anonymous sign-in: each device gets a stable `auth.uid()` with no email or
password. Named accounts can be layered on later for multi-device recovery.

### Keys

Only the Supabase project URL and the anon public key would ship in the client.
Those are safe to expose when RLS is enforced. No service-role key is ever placed
in the app.

### Opt-in and Privacy

Cloud sync moves mood, energy, notes, and location-derived weather off the
device. That contradicts the current "no cloud sync" statement in `README.md`.
Before enabling sync, the app must:

1. Add a clear opt-in in Settings that is off by default.
2. Update `README.md` and the privacy policy to describe what syncs and where.
3. Provide export and delete controls that also clear remote data.

## Testing

- `resolveStoredVersion` and `mergeSnapshots` are covered in
  `scripts/test-core.mjs`.
- The repository and `localOnlySync` delegate to already-tested storage
  functions and pure helpers.
