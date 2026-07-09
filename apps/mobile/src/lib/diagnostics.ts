const DIAGNOSTICS_KEY = "weathered.local.diagnostics.v1";

interface AsyncStorageApi {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
}

export type DiagnosticEvent =
  | "weather_sync_success"
  | "weather_sync_failure"
  | "location_permission_denied"
  | "backup_export_success"
  | "backup_export_failure"
  | "backup_restore_success"
  | "backup_restore_failure"
  | "storage_write_failure";

export interface AppDiagnostics {
  updatedAt?: string;
  weather: {
    status: "not_checked" | "ok" | "fallback" | "permission_denied";
    successCount: number;
    failureCount: number;
    permissionDeniedCount: number;
    lastCheckedAt?: string;
    lastMessage?: string;
  };
  backup: {
    exportSuccessCount: number;
    exportFailureCount: number;
    restoreSuccessCount: number;
    restoreFailureCount: number;
    lastCheckedAt?: string;
    lastMessage?: string;
  };
  storage: {
    writeFailureCount: number;
    lastFailureAt?: string;
    lastMessage?: string;
  };
}

export const emptyDiagnostics: AppDiagnostics = {
  weather: {
    status: "not_checked",
    successCount: 0,
    failureCount: 0,
    permissionDeniedCount: 0,
  },
  backup: {
    exportSuccessCount: 0,
    exportFailureCount: 0,
    restoreSuccessCount: 0,
    restoreFailureCount: 0,
  },
  storage: {
    writeFailureCount: 0,
  },
};

async function getAsyncStorage(): Promise<AsyncStorageApi> {
  const module = await import("@react-native-async-storage/async-storage");
  return module.default;
}

export async function loadDiagnostics(): Promise<AppDiagnostics> {
  try {
    const AsyncStorage = await getAsyncStorage();
    const raw = await AsyncStorage.getItem(DIAGNOSTICS_KEY);
    if (!raw) return emptyDiagnostics;

    const parsed = JSON.parse(raw) as Partial<AppDiagnostics>;
    return normalizeDiagnostics(parsed);
  } catch {
    return emptyDiagnostics;
  }
}

export async function recordDiagnosticEvent(event: DiagnosticEvent, message?: string): Promise<AppDiagnostics> {
  const current = await loadDiagnostics();
  const updated = applyEvent(current, event, message);

  try {
    const AsyncStorage = await getAsyncStorage();
    await AsyncStorage.setItem(DIAGNOSTICS_KEY, JSON.stringify(updated));
  } catch {
    return updated;
  }

  return updated;
}

export function summarizeHealth(diagnostics: AppDiagnostics) {
  if (diagnostics.storage.writeFailureCount > 0) {
    return {
      label: "Needs attention",
      message: "A local save failed recently. Export a backup before making more changes.",
    };
  }

  if (diagnostics.weather.status === "permission_denied") {
    return {
      label: "Location off",
      message: "Weathered is using a local weather estimate because location permission is off.",
    };
  }

  if (diagnostics.weather.status === "fallback") {
    return {
      label: "Offline-ready",
      message: "Live weather recently failed, but local estimates are keeping check-ins usable.",
    };
  }

  return {
    label: "Healthy",
    message: "Local storage and core app checks look normal.",
  };
}

function applyEvent(diagnostics: AppDiagnostics, event: DiagnosticEvent, message?: string): AppDiagnostics {
  const now = new Date().toISOString();
  const next: AppDiagnostics = normalizeDiagnostics(diagnostics);
  next.updatedAt = now;

  if (event === "weather_sync_success") {
    next.weather.status = "ok";
    next.weather.successCount += 1;
    next.weather.lastCheckedAt = now;
    next.weather.lastMessage = message || "Live weather updated.";
  }

  if (event === "weather_sync_failure") {
    next.weather.status = "fallback";
    next.weather.failureCount += 1;
    next.weather.lastCheckedAt = now;
    next.weather.lastMessage = message || "Live weather unavailable; local estimate used.";
  }

  if (event === "location_permission_denied") {
    next.weather.status = "permission_denied";
    next.weather.permissionDeniedCount += 1;
    next.weather.lastCheckedAt = now;
    next.weather.lastMessage = message || "Location permission denied; local estimate used.";
  }

  if (event === "backup_export_success") {
    next.backup.exportSuccessCount += 1;
    next.backup.lastCheckedAt = now;
    next.backup.lastMessage = message || "Backup export completed.";
  }

  if (event === "backup_export_failure") {
    next.backup.exportFailureCount += 1;
    next.backup.lastCheckedAt = now;
    next.backup.lastMessage = message || "Backup export failed.";
  }

  if (event === "backup_restore_success") {
    next.backup.restoreSuccessCount += 1;
    next.backup.lastCheckedAt = now;
    next.backup.lastMessage = message || "Backup restore completed.";
  }

  if (event === "backup_restore_failure") {
    next.backup.restoreFailureCount += 1;
    next.backup.lastCheckedAt = now;
    next.backup.lastMessage = message || "Backup restore failed.";
  }

  if (event === "storage_write_failure") {
    next.storage.writeFailureCount += 1;
    next.storage.lastFailureAt = now;
    next.storage.lastMessage = message || "Local storage write failed.";
  }

  return next;
}

function normalizeDiagnostics(value: Partial<AppDiagnostics>): AppDiagnostics {
  return {
    updatedAt: typeof value.updatedAt === "string" ? value.updatedAt : undefined,
    weather: {
      status: isWeatherStatus(value.weather?.status) ? value.weather.status : emptyDiagnostics.weather.status,
      successCount: numberOrZero(value.weather?.successCount),
      failureCount: numberOrZero(value.weather?.failureCount),
      permissionDeniedCount: numberOrZero(value.weather?.permissionDeniedCount),
      lastCheckedAt: typeof value.weather?.lastCheckedAt === "string" ? value.weather.lastCheckedAt : undefined,
      lastMessage: typeof value.weather?.lastMessage === "string" ? value.weather.lastMessage : undefined,
    },
    backup: {
      exportSuccessCount: numberOrZero(value.backup?.exportSuccessCount),
      exportFailureCount: numberOrZero(value.backup?.exportFailureCount),
      restoreSuccessCount: numberOrZero(value.backup?.restoreSuccessCount),
      restoreFailureCount: numberOrZero(value.backup?.restoreFailureCount),
      lastCheckedAt: typeof value.backup?.lastCheckedAt === "string" ? value.backup.lastCheckedAt : undefined,
      lastMessage: typeof value.backup?.lastMessage === "string" ? value.backup.lastMessage : undefined,
    },
    storage: {
      writeFailureCount: numberOrZero(value.storage?.writeFailureCount),
      lastFailureAt: typeof value.storage?.lastFailureAt === "string" ? value.storage.lastFailureAt : undefined,
      lastMessage: typeof value.storage?.lastMessage === "string" ? value.storage.lastMessage : undefined,
    },
  };
}

function isWeatherStatus(value: unknown): value is AppDiagnostics["weather"]["status"] {
  return value === "not_checked" || value === "ok" || value === "fallback" || value === "permission_denied";
}

function numberOrZero(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0;
}
