# Android APK Testing

Weathered can be tested as a direct-install Android APK before Play Store publishing.

## Build

Log in to Expo once:

```bash
npx eas-cli login
```

Then start the APK build:

```bash
npm run build:android:apk
```

This uses the `preview-apk` EAS profile in `apps/mobile/eas.json` and produces an installable APK for internal testing.

If building from CI or another non-interactive terminal, set `EXPO_TOKEN` instead of using `eas login`.

## GitHub Actions Build

You can also build Android from GitHub:

1. Add `EXPO_TOKEN` as a repository secret.
2. Open the **Android Build** workflow in GitHub Actions.
3. Click **Run workflow**.
4. Choose `preview-apk` for an internal APK, or `production` for a Play Store app bundle.

The workflow runs:

```bash
npm ci
npm run verify:project
npm run typecheck
npx eas-cli@latest build --platform android --profile <profile> --non-interactive
```

## Production App Bundle

For Play Store production builds, run:

```bash
npm run build:android:production
```

This uses the `production` EAS profile and creates an Android app bundle.

## What Works Offline

- Local check-ins
- Local history
- Edit and delete flows
- Weekly summaries
- Recommendation nudges based on saved local entries
- Fallback weather context

## Notes

- Live weather may still need network access.
- EAS cloud builds require an Expo account, even for a free internal APK.
- Play Store publishing is separate from APK testing.
- iOS standalone distribution requires Apple developer setup.
