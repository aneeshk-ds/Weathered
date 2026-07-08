# Weathered Release Checklist

Use this checklist before publishing Weathered beyond a local demo.

## Required Before Every Release

- Confirm the repo is clean or only contains intentional release changes.
- Run `npm ci`.
- Run `npm run verify:project`.
- Run `npm run typecheck`.
- Run `npm run test:data`.
- Run `npm run export:web`.
- Smoke test Home, History, Insights, and Settings; record Android results in `docs/android-smoke-test.md`.
- Confirm the Settings support link opens the support page.
- Test location denied, offline weather fallback, and slow network behavior.
- Test backup export and restore with a real file.
- Confirm `README.md` and release notes mention the correct version.
- Record user validation results in `docs/user-validation.md` before calling the product complete.

## Web Preview

- Push to `main`.
- Confirm the GitHub Pages workflow completes.
- Open the live preview at `https://aneeshk-ds.github.io/Weathered/`.
- Check the app loads without console errors.
- Confirm the exported app uses relative asset paths on GitHub Pages.

## Android Internal APK

- Confirm Expo account access.
- Log in with `npx eas-cli login`, or set `EXPO_TOKEN` in GitHub repository secrets.
- Run `npm run build:android:apk`, or manually run the **Android Build** GitHub Actions workflow with `preview-apk`.
- Install the APK on a physical Android device.
- Fill `docs/android-smoke-test.md` with device, Android version, and pass/fail notes.
- Test location permission allow and deny flows.
- Test backup export through the native share sheet.
- Test restore through the native document picker.

## Android Production

- Confirm `apps/mobile/app.json` has the correct version and Android `versionCode`.
- Confirm icon, adaptive icon, and splash assets are present.
- Build the production app bundle with `npm run build:android:production`, or manually run the **Android Build** GitHub Actions workflow with `production`.
- Complete Play Store data safety and privacy forms.
- Provide the privacy policy URL.
- Add screenshots, short description, full description, and release notes.
- Run a closed/internal Play Store test before public release.
- Confirm the user validation pass criteria have been met or explicitly deferred.

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
