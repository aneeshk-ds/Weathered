import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors, type Palette } from "../theme";
import type { WeekDay } from "../lib/weekMood";

export function WeekBars({ days }: { days: WeekDay[] }) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const max = Math.max(10, ...days.map((day) => day.value));

  return (
    <View>
      <View style={styles.bars}>
        {days.map((day) => {
          const height = `${Math.round((day.value / max) * 100)}%` as const;
          return (
            <View key={day.key} style={styles.barTrack}>
              <View style={[styles.bar, { height }, day.isToday && styles.barToday]} />
            </View>
          );
        })}
      </View>
      <View style={styles.labels}>
        {days.map((day) => (
          <Text key={day.key} style={[styles.label, day.isToday && styles.labelToday]}>
            {day.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    bars: { flexDirection: "row", alignItems: "flex-end", height: 80, gap: 6 },
    barTrack: { flex: 1, height: "100%", justifyContent: "flex-end" },
    bar: { backgroundColor: colors.line, borderRadius: 3, width: "100%" },
    barToday: { backgroundColor: colors.accent },
    labels: { flexDirection: "row", gap: 6, marginTop: 6 },
    label: { flex: 1, textAlign: "center", fontSize: 10, color: colors.dim },
    labelToday: { color: colors.accent, fontWeight: "700" },
  });
