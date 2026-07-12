# Weathered Build Results

## Distribution

The Android preview APK is distributed through GitHub Releases. The Android Build
workflow, run with the `preview-apk` profile, builds the APK on EAS, downloads
the artifact, and publishes it to the `latest-apk` release. This gives a stable
download link that always points to the newest build:

https://github.com/aneeshk-ds/Weathered/releases/latest/download/weathered-latest.apk

To produce a build:

- Locally: `npm run build:android:apk` (runs `eas build`; `eas login` once).
- Or run the **Android Build** GitHub Actions workflow with `preview-apk`
  (requires the `EXPO_TOKEN` repository secret).

## Current Position

- App version `2.1.0`, Android `versionCode` 202.
- The published APK reflects the latest workflow run. Earlier manual artifact
  links are superseded by the `latest-apk` release link above.

## Next Required Validation

- Install the latest APK on a physical Android device.
- Run the release checklist smoke test.
- Record the device, Android version, APK link, and pass/fail notes in
  `docs/android-smoke-test.md`.
