import React, { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";
import { Card, PrimaryButton, ScreenHeader } from "../components/ui";

export function SettingsScreen({
  entryCount,
  version,
  onBackup,
  onRestore,
  onClear,
}: {
  entryCount: number;
  version: string;
  onBackup: () => Promise<string>;
  onRestore: () => Promise<string>;
  onClear: () => void;
}) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

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

  return (
    <View>
      <ScreenHeader eyebrow="Settings" title="Backup & data" subtitle="Weathered keeps everything on this device. Back up to your cloud to move it to another." />

      <Card>
        <Text style={styles.cardTitle}>Back up to your cloud</Text>
        <Text style={styles.cardBody}>Saves a backup file you can drop into iCloud Drive or Google Drive from the share sheet.</Text>
        <View style={{ height: 12 }} />
        <PrimaryButton label={busy ? "Working…" : "Back up now"} onPress={() => run(onBackup)} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Restore from a backup</Text>
        <Text style={styles.cardBody}>Pick a Weathered backup file from your cloud or files to load it onto this device.</Text>
        <View style={{ height: 12 }} />
        <PrimaryButton label="Restore from a file" onPress={() => run(onRestore)} tone="ghost" />
      </Card>

      {status ? <Text style={styles.status}>{status}</Text> : null}

      <Card>
        <Text style={styles.cardTitle}>Your data</Text>
        <Text style={styles.cardBody}>{entryCount} check-in{entryCount === 1 ? "" : "s"} stored on this device.</Text>
        <View style={{ height: 12 }} />
        <PrimaryButton label="Clear all data" onPress={confirmClear} tone="ghost" />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>About</Text>
        <Text style={styles.cardBody}>Weathered {version}</Text>
        <Text style={styles.cardBody}>Local-first: no accounts, no cloud sync. Live weather uses your device location via Open-Meteo.</Text>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitle: { fontSize: 15, fontWeight: "600", color: colors.text, marginBottom: 4 },
  cardBody: { fontSize: 13, color: colors.muted, lineHeight: 19, marginBottom: 2 },
  status: { fontSize: 13, color: colors.accent, marginBottom: 14, lineHeight: 19 },
});
