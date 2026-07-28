# Weathered

Weathered is a local-first Expo app for noticing how weather, mood, energy, and time relate to everyday decisions.

- [Live web app](https://aneeshk-ds.github.io/Weathered/)
- [Latest Android APK](https://github.com/aneeshk-ds/Weathered/releases/latest/download/weathered-latest.apk)
- [Privacy policy](docs/privacy-policy.md)
- [Release guide](docs/release.md)
- [Security policy](SECURITY.md)

## Features

- Fast mood, energy, activity, and decision check-ins
- Live Open-Meteo weather with an offline local estimate
- Pattern-based decision guidance that learns from older entries without requiring a perfect tracking streak
- Weekly mood and weather infographics
- Morning, afternoon, evening, and night insights
- End-of-day qualitative reflections
- Searchable, editable local history
- Four optional daily notification reminders
- Optional travel alerts when the place or weather changes meaningfully
- JSON backup and restore
- Optional anonymous Supabase sync, off by default
- Dark and light themes

## Architecture

The monorepo contains:

- `apps/mobile`: Expo React Native app
- `apps/mobile/src/components`: reusable interface and chart components
- `apps/mobile/src/screens`: Home, History, Insights, and Settings
- `apps/mobile/src/lib`: storage, weather, sync, notifications, and decision logic
- `packages/shared`: shared TypeScript data contracts
- `scripts`: deterministic validation and behavior tests

Data is stored in AsyncStorage. Optional sync uses anonymous Supabase Auth and row-level security scoped to `auth.uid()`. Open-Meteo supplies weather without an API key.

## Local Setup

Requirements: Node.js 22+ and an Android/iOS simulator or a device with Expo Go.

```bash
npm ci
npm run dev:mobile
```

Useful commands:

```bash
npm run dev:mobile:device
npm run export:web
npm run validate
npm run build:android:apk
npm run build:android:production
```

## Optional Cloud Sync

Cloud sync is disabled when Supabase configuration is absent. For local development, copy `.env.example` to `.env` and provide:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Only use a Supabase publishable key in the client. Never use a secret or `service_role` key. Client access must remain protected by row-level security.

GitHub Actions reads the same names from repository secrets. No project URL, API key, token, or credential is stored in the repository.

## Distribution

Pushing to `main` validates and deploys the web app through GitHub Pages. The manual **Android Build** workflow creates either:

- `preview-apk`: a GitHub-runner APK published at the stable download link above
- `production`: an EAS Android App Bundle, requiring the `EXPO_TOKEN` repository secret

See [docs/release.md](docs/release.md) before publishing or installing a release.

## Privacy and Support

No account is required. Check-ins remain on the device unless the user explicitly enables cloud sync or exports a backup. See the [privacy policy](docs/privacy-policy.md) for the complete data flow.

Report normal bugs through [GitHub Issues](https://github.com/aneeshk-ds/Weathered/issues). Report security concerns privately as described in [SECURITY.md](SECURITY.md).
