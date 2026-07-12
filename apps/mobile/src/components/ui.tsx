import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ScreenHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
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
  return (
    <View style={styles.moodRow}>
      <View
        style={styles.moodTrack}
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
        {Array.from({ length: 10 }, (_, index) => index + 1).map((step) => (
          <Pressable
            key={step}
            style={styles.moodCellWrap}
            onPress={() => onChange(step)}
            accessibilityRole="button"
            accessibilityLabel={`Set mood to ${step}`}
          >
            <View style={[styles.moodCell, step <= value && styles.moodCellOn]} />
          </Pressable>
        ))}
      </View>
      <Text style={styles.moodValue}>{value}</Text>
    </View>
  );
}

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
  moodTrack: { flex: 1, flexDirection: "row", gap: 4 },
  moodCellWrap: { flex: 1, paddingVertical: 6 },
  moodCell: { height: 6, borderRadius: 3, backgroundColor: colors.line },
  moodCellOn: { backgroundColor: colors.accent },
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
