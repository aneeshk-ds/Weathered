# Weathered Privacy Policy

Last updated: July 12, 2026

Weathered is a local-first app for understanding how weather, mood, and energy relate to everyday decisions. It is local-first and private by default: no account is required and data stays on your device. Optional cloud sync is off by default and is described below.

## Data Weathered Stores

Weathered stores your check-ins on your device using local app storage. A check-in can include:

- mood score
- energy level
- decision category and outcome
- optional note
- weather snapshot
- timestamp
- recommendation feedback such as "Helpful" or "Not now"

This data stays on your device unless you choose to export a backup file.

## Location And Weather

Weathered may ask for location permission so it can show current local weather with your check-ins.

When live weather is available, Weathered uses your device location to request current weather from Open-Meteo. Weathered does not require an Open-Meteo account or API key. If location permission, network access, or the weather provider is unavailable, Weathered falls back to a local seasonal estimate.

## Backups

Weathered lets you export a backup file. The file is created on your device and shared through your device's share sheet. You choose where that backup is saved, such as iCloud Drive, Google Drive, or local files.

Weathered does not control or manage the privacy of third-party storage locations you choose for backups.

## Cloud Sync (Optional)

Cloud sync is off by default. When you turn it on in Settings:

- Weathered creates an anonymous sign-in for this device. No email, name, or password is collected.
- Your check-ins and recommendation feedback are uploaded to a Supabase database.
- Every row is protected by row-level security tied to your anonymous device identity, so only your device can read or write its own data.
- Turning sync off stops further uploads. Clearing all data, or deleting a check-in while sync is on, also deletes the matching rows from the cloud.

When sync is off, none of the above happens and no check-in data leaves your device.

## What Weathered Does Not Do

Weathered does not:

- create named accounts or collect an email, name, or password
- sync anything while cloud sync is off
- sell personal data
- use advertising identifiers
- include third-party analytics SDKs

## Deleting Data

You can delete individual check-ins from History. You can also clear all local app data from Settings. When cloud sync is on, both actions also delete the matching rows from the cloud.

If you exported backup files, delete those files from wherever you saved them.

## Changes

This policy may be updated as Weathered adds features. If future versions add accounts, sync, analytics, or server-side storage, this policy should be updated before release.
