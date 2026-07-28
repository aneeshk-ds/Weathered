# Release Guide

## Validate

From a clean checkout:

```bash
npm ci
npm run validate
npm run export:web
```

`validate` runs repository checks, linting, formatting, TypeScript, smoke tests, data stress tests, and behavior tests.

Before releasing, confirm that no `.env`, signing key, APK, generated native project, or credential file is tracked.

## Web

Push to `main`. The **Deploy Web Preview** workflow validates, exports, and deploys GitHub Pages.

Verify:

- the live app loads without console errors
- Home, History, Insights, and Settings render
- asset paths work under the `/Weathered/` GitHub Pages path
- sync is clearly unavailable when build configuration is absent

## Android APK

Run the **Android Build** workflow with `preview-apk`. GitHub generates the native project, builds an installable release APK, and replaces the `latest-apk` GitHub Release.

Required GitHub Actions secrets for optional cloud sync:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The build still succeeds without them; sync is then disabled.

Install the APK on a physical Android device and verify:

- launch and onboarding
- a check-in survives restart
- History search, edit, and delete
- weekly and time-of-day insights
- end-of-day reflection
- notification permission and four daily reminders
- location denied and offline weather fallbacks
- travel-weather notification permission and behavior
- backup export and restore
- optional sync and remote deletion, when configured
- clear-all confirmation

## Production Android

Run **Android Build** with `production`. This uses the EAS `production` profile and requires the `EXPO_TOKEN` repository secret.

Before store submission:

- increment the app version and Android `versionCode`
- configure production signing outside the repository
- complete Play Store privacy and data-safety forms
- provide the privacy-policy URL
- run an internal Play Store test on physical devices

Never commit signing material or an Expo access token.
