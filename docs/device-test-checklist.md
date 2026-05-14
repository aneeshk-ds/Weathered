# Weathered Device Test Checklist

Use this checklist for the final Expo Go validation before marking the device release gate complete.

## Start

```bash
npm run dev:device:stack
```

If the API is already running and you only need Expo:

```bash
npm run dev:mobile:device:auto
```

Before scanning the QR, confirm API reachability:

```bash
npm run dev:mobile:device:auto -- --check
```

## Pass Criteria

- Expo Go opens Weathered without an SDK compatibility warning.
- The app shows the current version.
- Log screen opens without layout overlap.
- Live Ready can be selected.
- Retry API completes without crashing.
- Recommendation feedback buttons respond.
- A local entry can be saved.
- History shows the saved entry.

## Result

2026-05-14: Expo Go device test passed after installing an Expo Go build compatible with SDK 55. The app opened from the LAN QR flow and the device release gate can be marked complete in-app.
