import * as Location from "expo-location";

export interface ResolvedLocation {
  latitude: number;
  longitude: number;
  label: string;
}

export class LocationPermissionError extends Error {
  constructor(message = "Location permission was not granted") {
    super(message);
    this.name = "LocationPermissionError";
  }
}

export async function resolveLocationLabel(latitude: number, longitude: number): Promise<string> {
  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = places[0];

    if (place) {
      return place.city || place.subregion || place.region || place.country || "Current location";
    }
  } catch {
    // Reverse geocoding is best-effort; coordinates still drive the weather lookup.
  }

  return "Current location";
}

export async function resolveDeviceLocation(): Promise<ResolvedLocation> {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    throw new LocationPermissionError();
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const { latitude, longitude } = position.coords;
  const label = await resolveLocationLabel(latitude, longitude);

  return { latitude, longitude, label };
}
