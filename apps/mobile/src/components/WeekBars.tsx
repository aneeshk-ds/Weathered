import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function WeekBars({ values }: { values: number[] }) {
  const max = Math.max(10, ...values);

  return (
    <View>
      <View style={styles.bars}>
        {values.map((value, index) => {
          const height = `${Math.round((value / max) * 100)}%` as const;
          const isPeak = value === Math.max(...values) && value > 0;
          return (
            <View key={index} style={styles.barTrack}>
              <View style={[styles.bar, { height }, isPeak && styles.barPeak]} />
            </View>
          );
        })}
      </View>
      <View style={styles.labels}>
        {DAYS.map((day, index) => (
          <Text key={index} style={styles.label}>
            {day}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bars: { flexDirection: "row", alignItems: "flex-end", height: 80, gap: 6 },
  barTrack: { flex: 1, height: "100%", justifyContent: "flex-end" },
  bar: { backgroundColor: colors.line, borderRadius: 3, width: "100%" },
  barPeak: { backgroundColor: colors.accent },
  labels: { flexDirection: "row", gap: 6, marginTop: 6 },
  label: { flex: 1, textAlign: "center", fontSize: 10, color: colors.dim },
});
