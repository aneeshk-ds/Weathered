# Weathered Release Checklist

Use this checklist before publishing Weathered beyond a local demo.

## Required Before Every Release

- Confirm the repo is clean or only contains intentional release changes.
- Run `npm ci`.
- Run `npm run verify:project`.
- Run `npm run typecheck`.
- Run `npm run export:web`.
- Smoke test Home, History, Insights, and Settings.
- Test location denied, offline weather fallback, and slow network behavior.
- Test backup export and restore with a real file.
- Confirm `README.md` and release notes mention the correct version.

## Web Preview

- Push to `main`.
- Confirm the GitHub Pages workflow completes.
- Open the live preview at `https://aneeshk-ds.github.io/Weathered/`.
- Check the app loads without console errors.
- Confirm the exported app uses relative asset paths on GitHub Pages.

## Android Internal APK

- Confirm Expo account access.
- Log in with `npx eas-cli login`, or set `EXPO_TOKEN` in CI.
- Run `npm run build:android:apk`.
- Install the APK on a physical Android device.
- Test location permission allow and deny flows.
- Test backup export through the native share sheet.
- Test restore through the native document picker.

## Android Production

- Confirm `apps/mobile/app.json` has the correct version and Android `versionCode`.
- Confirm icon, adaptive icon, and splash assets are present.
- Build the production app bundle with the `production` EAS profile.
- Complete Play Store data safety and privacy forms.
- Provide the privacy policy URL.
- Add screenshots, short description, full description, and release notes.
- Run a closed/internal Play Store test before public release.

## iOS Production

- Add the final iOS bundle identifier before release.
- Confirm Apple Developer account access.
- Configure signing and capabilities in EAS.
- Confirm the App Store privacy labels match the local-first behavior.
- Provide the privacy policy URL.
- Test on a physical iPhone before TestFlight.
- Run TestFlight before public release.

## Current Release Position

- Web preview: ready after CI checks pass.
- Android APK: ready for internal testing after EAS build succeeds.
- Android production: needs store listing, privacy forms, and production app bundle verification.
- iOS production: needs bundle identifier, Apple signing setup, and TestFlight validation.
