# Weathered Android Smoke Test

Use this record for the first physical-device APK test. Do not mark this gate passed until every required check has a dated result from a real Android device.

## Build Under Test

- Status: `not started`
- APK: https://expo.dev/artifacts/eas/a8B7JjQ7mA4XzmatpPPsYa.apk
- Workflow run: https://github.com/aneeshk-ds/Weathered/actions/runs/28255393259
- App version: `2.0.1`
- Test date:
- Tester:
- Device:
- Android version:
- Install method:

## Pass Rules

Weathered passes the Android smoke test only when:

- the APK installs and opens without a crash
- a new check-in can be saved and survives app restart
- History edit, delete, sample reload, and clear actions behave as expected
- Insights loads without blank or broken chart states
- location allow and deny flows both leave the app usable
- backup export and restore complete with a real file
- App health and support link are visible from Settings
- no blocker, data-loss, or privacy issue is found

## Test Steps

| Area | Step | Expected result | Result | Notes |
|---|---|---|---|---|
| Install | Install the APK from the link above. | App installs without warning beyond normal sideload prompts. |  |  |
| Launch | Open Weathered from the device launcher. | Home opens without a crash or blank screen. |  |  |
| Location allow | Allow location permission when prompted. | Weather updates from live provider or falls back gracefully. |  |  |
| Location deny | Reinstall or reset permission, then deny location. | App remains usable with local weather estimate. |  |  |
| Home | Save one check-in with mood, energy, category, outcome, and note. | Check-in saves and app moves to Insights. |  |  |
| Persistence | Fully close and reopen the app. | Saved check-in is still present. |  |  |
| History edit | Edit the saved check-in. | Updated mood, energy, category, outcome, or note is reflected. |  |  |
| History delete | Delete the edited check-in. | Entry disappears and no unrelated data changes. |  |  |
| History sample | Load sample entries. | Sample entries appear and can be inspected. |  |  |
| Insights | Open Insights with sample entries loaded. | Summary, readiness, rings, bars, and nudges render without overlap or blanks. |  |  |
| Backup export | Export a backup through the native share sheet. | A JSON backup file can be saved to Files, Drive, or another target. |  |  |
| Backup restore | Restore from the exported backup file. | Entries restore and invalid-file errors are friendly. |  |  |
| App health | Open Settings and inspect App health. | Weather, fallback, backup, and save issue counts are visible. |  |  |
| Support | Tap Open support page. | GitHub Issues opens or a clear fallback message appears. |  |  |
| Clear data | Clear all data from Settings. | User sees a confirmation; entries and feedback are removed after confirm. |  |  |

## Result

- Smoke test status: `not started`
- Release gate decision: do not call Android internal testing passed until this file has real results.
- Blockers found: none recorded yet.
- Follow-up fixes: none recorded yet.
