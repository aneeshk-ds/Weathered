import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors, type Palette } from "../theme";
import { Card, PrimaryButton } from "./ui";

export function Onboarding({ onDone }: { onDone: () => void }) {
  const colors = useColors();
  const styles = makeStyles(colors);
  return (
    <Card style={styles.card}>
      <Text style={styles.eyebrow}>Welcome</Text>
      <Text style={styles.title}>Notice what shapes your decisions</Text>
      <Text style={styles.body}>
        Weathered takes a 20-second check-in on your mood, energy, and the choice in front of you, then attaches the
        current weather. Over time it shows how conditions line up with what you decide.
      </Text>
      <View style={styles.points}>
        <Text style={styles.pointText}>1. Log mood, energy, and a decision on Home.</Text>
        <Text style={styles.pointText}>2. Review and edit past check-ins in History.</Text>
        <Text style={styles.pointText}>3. See patterns and suggestions in Insights.</Text>
      </View>
      <Text style={styles.body}>Everything stays on this device. No account, no cloud sync.</Text>
      <View style={{ height: 12 }} />
      <PrimaryButton label="Start my first check-in" onPress={onDone} />
    </Card>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    card: { borderWidth: 1, borderColor: colors.accent },
    eyebrow: { fontSize: 11, letterSpacing: 1, color: colors.accent, textTransform: "uppercase", marginBottom: 4 },
    title: { fontSize: 19, fontWeight: "600", color: colors.text, marginBottom: 8 },
    body: { fontSize: 13, color: colors.muted, lineHeight: 20, marginBottom: 8 },
    points: { marginVertical: 4, gap: 4 },
    pointText: { fontSize: 13, color: colors.text, lineHeight: 20 },
  });
