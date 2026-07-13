import { Platform } from "react-native";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";

export const LOCATION_NUDGE_TASK = "weathered-location-nudge";
const GEOFENCE_RADIUS_M = 500;

async function anchorGeofence(latitude: number, longitude: number): Promise<void> {
  await Location.startGeofencingAsync(LOCATION_NUDGE_TASK, [
    {
      identifier: "weathered-here",
      latitude,
      longitude,
      radius: GEOFENCE_RADIUS_M,
      notifyOnEnter: false,
      notifyOnExit: true,
    },
  ]);
}

// Registered at module load on native so the OS can invoke it in the background,
// even after the app is killed. On exit from the current area we nudge a check-in
// and re-anchor the geofence around the new location so it keeps working.
if (Platform.OS !== "web") {
  TaskManager.defineTask<{ eventType: Location.GeofencingEventType; region: Location.LocationRegion }>(
    LOCATION_NUDGE_TASK,
    async ({ data, error }) => {
      if (error || !data) {
        return;
      }
      if (data.eventType !== Location.GeofencingEventType.Exit) {
        return;
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Somewhere new?",
          body: "You have moved to a new place. How does it feel here? A quick check-in.",
        },
        trigger: null,
      });
      try {
        const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        await anchorGeofence(position.coords.latitude, position.coords.longitude);
      } catch {
        // If we cannot re-anchor right now, the existing geofence stays active.
      }
    },
  );
}

/** Request foreground then background location permission. Returns whether both are granted. */
export async function ensureLocationNudgePermissions(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (!foreground.granted) {
    return false;
  }
  const background = await Location.requestBackgroundPermissionsAsync();
  return background.granted;
}

/** Start watching for a location change from the current spot. */
export async function startLocationNudge(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }
  const granted = await ensureLocationNudgePermissions();
  if (!granted) {
    return false;
  }
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const alreadyRunning = await Location.hasStartedGeofencingAsync(LOCATION_NUDGE_TASK).catch(() => false);
  if (alreadyRunning) {
    await Location.stopGeofencingAsync(LOCATION_NUDGE_TASK);
  }
  await anchorGeofence(position.coords.latitude, position.coords.longitude);
  return true;
}

/** Stop watching for location changes. */
export async function stopLocationNudge(): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }
  const running = await Location.hasStartedGeofencingAsync(LOCATION_NUDGE_TASK).catch(() => false);
  if (running) {
    await Location.stopGeofencingAsync(LOCATION_NUDGE_TASK);
  }
}
