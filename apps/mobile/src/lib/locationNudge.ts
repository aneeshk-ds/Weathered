import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import { resolveLocationLabel } from "./location";
import { ensureNotificationPermission } from "./notifications";
import { fetchOpenMeteoCurrentWeather } from "./weather";
import {
  assessTravelWeather,
  normalizeTravelWeatherState,
  TRAVEL_GEOFENCE_RADIUS_M,
  type TravelWeatherSample,
  type TravelWeatherState,
} from "./travelWeather";

export const LOCATION_NUDGE_TASK = "weathered-location-nudge";
const TRAVEL_WEATHER_STATE_KEY = "weathered.local.travel-weather.v1";
const TRAVEL_NOTIFICATION_CHANNEL_ID = "travel-weather";

async function anchorGeofence(latitude: number, longitude: number): Promise<void> {
  await Location.startGeofencingAsync(LOCATION_NUDGE_TASK, [
    {
      identifier: "weathered-here",
      latitude,
      longitude,
      radius: TRAVEL_GEOFENCE_RADIUS_M,
      notifyOnEnter: false,
      notifyOnExit: true,
    },
  ]);
}

async function loadTravelWeatherState(): Promise<TravelWeatherState> {
  try {
    const raw = await AsyncStorage.getItem(TRAVEL_WEATHER_STATE_KEY);
    return raw ? normalizeTravelWeatherState(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

async function saveTravelWeatherState(state: TravelWeatherState): Promise<void> {
  await AsyncStorage.setItem(TRAVEL_WEATHER_STATE_KEY, JSON.stringify(state)).catch(() => undefined);
}

async function sampleWeather(latitude: number, longitude: number): Promise<TravelWeatherSample> {
  const label = await resolveLocationLabel(latitude, longitude);
  const weather = await fetchOpenMeteoCurrentWeather({ latitude, longitude, label });

  return {
    latitude,
    longitude,
    capturedAt: new Date().toISOString(),
    weather,
  };
}

async function ensureTravelNotificationChannel(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(TRAVEL_NOTIFICATION_CHANNEL_ID, {
    name: "Travel weather",
    description: "Weather changes detected while travelling",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

async function handleTravelWeatherChange(latitude: number, longitude: number): Promise<void> {
  const [previousState, currentSample] = await Promise.all([
    loadTravelWeatherState(),
    sampleWeather(latitude, longitude),
  ]);
  const assessment = assessTravelWeather(previousState, currentSample);

  if (assessment.shouldNotify && assessment.title && assessment.body) {
    await ensureTravelNotificationChannel();
    await Notifications.scheduleNotificationAsync({
      content: {
        title: assessment.title,
        body: assessment.body,
        data: { source: "travel-weather", location: currentSample.weather.locationLabel },
      },
      trigger: null,
    });
  }

  await saveTravelWeatherState(assessment.nextState);
}

// Registered at module load on native so the OS can invoke it in the background,
// even after the app is killed. Leaving a 5 km area refreshes weather for the
// destination, compares it with the previous place, and re-anchors monitoring.
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

      let position: Location.LocationObject;
      try {
        position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      } catch {
        return;
      }

      try {
        await handleTravelWeatherChange(position.coords.latitude, position.coords.longitude);
      } catch {
        // A temporary weather/network failure should not stop location monitoring.
      }

      try {
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
  if (!background.granted) {
    return false;
  }
  return ensureNotificationPermission();
}

/** Start watching for travel and weather changes from the current place. */
export async function startLocationNudge(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }
  const granted = await ensureLocationNudgePermissions();
  if (!granted) {
    return false;
  }
  const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
  const existingState = await loadTravelWeatherState();
  if (!existingState.lastSample) {
    try {
      const baseline = await sampleWeather(position.coords.latitude, position.coords.longitude);
      await saveTravelWeatherState({ ...existingState, lastSample: baseline });
    } catch {
      // Monitoring can still start; the first successful destination sample
      // becomes the baseline and produces a useful current-weather alert.
    }
  }
  const alreadyRunning = await Location.hasStartedGeofencingAsync(LOCATION_NUDGE_TASK).catch(() => false);
  if (alreadyRunning) {
    await Location.stopGeofencingAsync(LOCATION_NUDGE_TASK);
  }
  await ensureTravelNotificationChannel();
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
  await AsyncStorage.removeItem(TRAVEL_WEATHER_STATE_KEY).catch(() => undefined);
}
