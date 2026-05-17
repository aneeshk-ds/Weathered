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
