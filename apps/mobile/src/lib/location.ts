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

export async function resolveDeviceLocation(): Promise<ResolvedLocation> {
  const { status } = await Location.requestForegroundPermissionsAsync();

  if (status !== "granted") {
    throw new LocationPermissionError();
  }

  const position = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  });

  const { latitude, longitude } = position.coords;
  let label = "Current location";

  try {
    const places = await Location.reverseGeocodeAsync({ latitude, longitude });
    const place = places[0];

    if (place) {
      label = place.city || place.subregion || place.region || place.country || label;
    }
  } catch {
    // Reverse geocoding is best-effort; coordinates still drive the weather lookup.
  }

  return { latitude, longitude, label };
}
