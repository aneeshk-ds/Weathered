# Weathered Privacy Policy

Last updated: July 29, 2026

Weathered is local-first and private by default. No named account is required, and optional cloud sync is off by default.

## Data Stored

Weathered can store the following on the device:

- mood and energy
- activity, decision, and outcome
- optional notes and end-of-day reflections
- weather snapshots and timestamps
- recommendation feedback
- preferences and local diagnostic counters

This data remains on the device unless the user enables cloud sync or exports a backup.

## Location and Weather

When live weather is enabled, Weathered may request foreground location and send coordinates to Open-Meteo to retrieve current conditions. No Weathered account identifier or secret API key is sent.

Travel-weather alerts are optional. When enabled on a supported installed app, Weathered requests background location and notification permission, checks for meaningful travel or weather changes, and stores the latest travel-weather state locally. The web preview cannot perform this background behavior.

If permission, connectivity, or the provider is unavailable, Weathered uses a local weather estimate.

## Notifications

Optional check-in reminders are scheduled on the device for morning, afternoon, evening, and night. Weathered does not use advertising notifications.

## Backups

Backup export creates a JSON file and opens the device share sheet. The user chooses where to save or send it. Third-party storage selected by the user is governed by that provider’s privacy practices.

## Optional Cloud Sync

When cloud sync is enabled:

- Weathered creates an anonymous Supabase Auth identity without collecting a name, email, or password.
- Check-ins and recommendation feedback are uploaded to Supabase.
- Row-level security restricts rows to the authenticated anonymous identity.
- Turning sync off stops future uploads.
- Deleting a synced check-in or clearing data while sync is enabled also requests deletion of the corresponding cloud rows.

Anonymous sync is scoped to the app identity stored on the device; it is not a named multi-device account or recovery service.

## What Weathered Does Not Do

Weathered does not:

- sell personal data
- use advertising identifiers
- include third-party analytics or remote crash-reporting SDKs
- collect named-account credentials
- upload check-ins while cloud sync is off

## Deletion

Individual check-ins can be deleted from History. All local data can be cleared from Settings. When sync is enabled, Weathered also requests deletion of synced rows.

Exported backup files must be deleted separately from wherever the user saved them.

## Changes

This policy will be updated before a release that materially changes data collection, sharing, authentication, analytics, or storage behavior.
