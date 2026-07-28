import React, { useState } from "react";
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useColors, type Palette } from "../theme";

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  const styles = makeStyles(useColors());
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ScreenHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  const styles = makeStyles(useColors());
  return (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  const styles = makeStyles(useColors());
  return <Text style={styles.label}>{children}</Text>;
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const styles = makeStyles(useColors());
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={[styles.chip, selected && styles.chipOn]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  tone = "solid",
}: {
  label: string;
  onPress: () => void;
  tone?: "solid" | "ghost";
}) {
  const styles = makeStyles(useColors());
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.btn, tone === "ghost" && styles.btnGhost]}
    >
      <Text style={[styles.btnText, tone === "ghost" && styles.btnGhostText]}>{label}</Text>
    </Pressable>
  );
}

export function MoodScale({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  const styles = makeStyles(useColors());
  const [trackWidth, setTrackWidth] = useState(0);
  const fraction = (value - 1) / 9;
  const setFromPosition = (event: GestureResponderEvent) => {
    if (!trackWidth) return;
    const nextFraction = Math.max(0, Math.min(1, event.nativeEvent.locationX / trackWidth));
    onChange(Math.round(nextFraction * 9) + 1);
  };
  const onLayout = (event: LayoutChangeEvent) => setTrackWidth(event.nativeEvent.layout.width);

  return (
    <View style={styles.moodRow}>
      <View
        style={styles.moodTrack}
        onLayout={onLayout}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={setFromPosition}
        onResponderMove={setFromPosition}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Mood, 1 to 10"
        accessibilityValue={{ min: 1, max: 10, now: value }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "increment") onChange(Math.min(10, value + 1));
          if (event.nativeEvent.actionName === "decrement") onChange(Math.max(1, value - 1));
        }}
      >
        <View style={styles.moodRail} />
        <View style={[styles.moodFill, { width: `${fraction * 100}%` }]} />
        <View style={[styles.moodThumb, { left: `${fraction * 100}%` }]} />
      </View>
      <Text style={styles.moodValue}>{value}</Text>
    </View>
  );
}

export function MetricCard({ label, value }: { label: string; value: string }) {
  const styles = makeStyles(useColors());
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    card: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 14 },
    header: { marginBottom: 14 },
    eyebrow: { fontSize: 11, letterSpacing: 1, color: colors.accent, textTransform: "uppercase", marginBottom: 2 },
    title: { fontSize: 21, fontWeight: "600", color: colors.text, marginBottom: 3 },
    subtitle: { fontSize: 13, color: colors.muted, lineHeight: 19 },
    label: { fontSize: 13, color: colors.muted, marginBottom: 8, marginTop: 2 },
    chip: {
      backgroundColor: colors.card2,
      borderRadius: 16,
      paddingVertical: 8,
      paddingHorizontal: 15,
      marginRight: 8,
      marginBottom: 8,
    },
    chipOn: { backgroundColor: colors.accent },
    chipText: { fontSize: 13, color: colors.muted },
    chipTextOn: { color: colors.accentText, fontWeight: "600" },
    btn: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 13, alignItems: "center", marginTop: 4 },
    btnGhost: { backgroundColor: colors.card2 },
    btnText: { fontSize: 15, fontWeight: "600", color: colors.accentText },
    btnGhostText: { color: colors.muted },
    moodRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
    moodTrack: { flex: 1, height: 30, justifyContent: "center", position: "relative" },
    moodRail: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 8,
      borderRadius: 999,
      backgroundColor: colors.line,
    },
    moodFill: {
      position: "absolute",
      left: 0,
      height: 8,
      borderRadius: 999,
      backgroundColor: colors.accent,
    },
    moodThumb: {
      position: "absolute",
      width: 18,
      height: 18,
      marginLeft: -9,
      borderRadius: 9,
      backgroundColor: colors.text,
      borderWidth: 4,
      borderColor: colors.accent,
    },
    moodValue: { fontSize: 16, fontWeight: "600", color: colors.text, minWidth: 26, textAlign: "right" },
    metric: {
      flex: 1,
      backgroundColor: colors.card2,
      borderRadius: 11,
      paddingVertical: 13,
      paddingHorizontal: 8,
      alignItems: "center",
    },
    metricLabel: { fontSize: 11, color: colors.muted, marginBottom: 4 },
    metricValue: { fontSize: 22, fontWeight: "600", color: colors.text },
  });
