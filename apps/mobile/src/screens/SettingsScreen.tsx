import React, { useState } from "react";
import { Alert, Linking, StyleSheet, Text, View } from "react-native";
import type { WeatherSourceMode } from "@weathered/shared";
import type { AppDiagnostics } from "../lib/diagnostics";
import { summarizeHealth } from "../lib/diagnostics";
import { colors } from "../theme";
import { WEATHER_SOURCE_OPTIONS, describeWeatherSource } from "../lib/weather";
import { Card, Chip, PrimaryButton, ScreenHeader } from "../components/ui";

const SUPPORT_URL = "https://github.com/aneeshk-ds/Weathered/issues";

export function SettingsScreen({
  weatherSourceMode,
  onWeatherSourceChange,
  entryCount,
  version,
  diagnostics,
  onBackup,
  onRestore,
  onClear,
}: {
  weatherSourceMode: WeatherSourceMode;
  onWeatherSourceChange: (mode: WeatherSourceMode) => void;
  entryCount: number;
  version: string;
  diagnostics: AppDiagnostics;
  onBackup: () => Promise<string>;
  onRestore: () => Promise<string>;
  onClear: () => void;
}) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const health = summarizeHealth(diagnostics);

  async function run(action: () => Promise<string>) {
    if (busy) return;
    setBusy(true);
    setStatus("");
    const message = await action();
    setStatus(message);
    setBusy(false);
  }

  function confirmClear() {
    Alert.alert("Clear all data?", "This removes every check-in on this device. This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: onClear },
    ]);
  }

  async function openSupport() {
    try {
      await Linking.openURL(SUPPORT_URL);
    } catch {
      setStatus("Could not open the support page. Visit github.com/aneeshk-ds/Weathered/issues.");
    }
  }

  return (
    <View>
      <ScreenHeader
        eyebrow="Settings"
        title="Backup & data"
        subtitle="Weathered keeps everything on this device. Back up to your cloud to move it to another."
      />

      <Card>
        <Text style={styles.cardTitle}>Weather source</Text>
        <Text style={styles.cardBody}>{describeWeatherSource(weatherSourceMode).message}</Text>
        <View style={styles.sourceRow}>
          {WEATHER_SOURCE_OPTIONS.map((mode) => (
            <Chip
              key={mode}
              label={describeWeatherSource(mode).label}
              selected={mode === weatherSourceMode}
              onPress={() => onWeatherSourceChange(mode)}
            />
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Back up to your cloud</Text>
        <Text style={styles.cardBody}>
          Saves a backup file you can drop into iCloud Drive or Google Drive from the share sheet.
        </Text>
        <View style={{ height: 12 }} />
        <PrimaryButton label={busy ? "Working…" : "Back up now"} onPress={() => run(onBackup)} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Restore from a backup</Text>
        <Text style={styles.cardBody}>
          Pick a Weathered backup file from your cloud or files to load it onto this device.
        </Text>
        <View style={{ height: 12 }} />
        <PrimaryButton label="Restore from a file" onPress={() => run(onRestore)} tone="ghost" />
      </Card>

      {status ? <Text style={styles.status}>{status}</Text> : null}

      <Card>
        <Text style={styles.cardTitle}>App health</Text>
        <Text style={styles.healthLabel}>{health.label}</Text>
        <Text style={styles.cardBody}>{health.message}</Text>
        <View style={styles.healthGrid}>
          <View style={styles.healthCell}>
            <Text style={styles.healthValue}>{diagnostics.weather.successCount}</Text>
            <Text style={styles.healthCaption}>weather ok</Text>
          </View>
          <View style={styles.healthCell}>
            <Text style={styles.healthValue}>{diagnostics.weather.failureCount}</Text>
            <Text style={styles.healthCaption}>fallbacks</Text>
          </View>
          <View style={styles.healthCell}>
            <Text style={styles.healthValue}>
              {diagnostics.backup.exportSuccessCount + diagnostics.backup.restoreSuccessCount}
            </Text>
            <Text style={styles.healthCaption}>backup ops</Text>
          </View>
          <View style={styles.healthCell}>
            <Text style={styles.healthValue}>{diagnostics.storage.writeFailureCount}</Text>
            <Text style={styles.healthCaption}>save issues</Text>
          </View>
        </View>
        {diagnostics.weather.lastMessage ? (
          <Text style={styles.cardBody}>Weather: {diagnostics.weather.lastMessage}</Text>
        ) : null}
        {diagnostics.backup.lastMessage ? (
          <Text style={styles.cardBody}>Backup: {diagnostics.backup.lastMessage}</Text>
        ) : null}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Your data</Text>
        <Text style={styles.cardBody}>
          {entryCount} check-in{entryCount === 1 ? "" : "s"} stored on this device.
        </Text>
        <View style={{ height: 12 }} />
        <PrimaryButton label="Clear all data" onPress={confirmClear} tone="ghost" />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>About</Text>
        <Text style={styles.cardBody}>Weathered {version}</Text>
        <Text style={styles.cardBody}>
          Local-first: no accounts, no cloud sync. Live weather uses your device location via Open-Meteo.
        </Text>
        <Text style={styles.cardBody}>
          Support: include the app version, check-in count, and App health details when reporting an issue.
        </Text>
        <View style={{ height: 12 }} />
        <PrimaryButton label="Open support page" onPress={openSupport} tone="ghost" />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: 15, fontWeight: "600", color: colors.text, marginBottom: 4 },
  sourceRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
  cardBody: { fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: 2 },
  status: { fontSize: 13, color: colors.accent, marginBottom: 14, lineHeight: 19 },
  healthLabel: { fontSize: 18, fontWeight: "700", color: colors.accent, marginBottom: 4 },
  healthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginVertical: 10 },
  healthCell: { backgroundColor: colors.card2, borderRadius: 8, minWidth: 92, flex: 1, padding: 10 },
  healthValue: { fontSize: 20, fontWeight: "700", color: colors.text, marginBottom: 2 },
  healthCaption: { fontSize: 11, color: colors.muted },
});
