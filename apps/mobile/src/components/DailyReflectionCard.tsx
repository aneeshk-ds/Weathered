import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import type { DayFactor, DayRating } from "@weathered/shared";
import { Card, Chip, Label, PrimaryButton } from "./ui";
import { DayPartVisual } from "./DayPartVisual";
import { DAY_FACTORS, DAY_FACTOR_LABELS, DAY_RATINGS, DAY_RATING_LABELS, dayRatingScore } from "../lib/reflections";
import { appText, useColors, type Palette } from "../theme";

export const REFLECTION_NOTE_LIMIT = 240;

export function DailyReflectionCard({
  rating,
  factors,
  note,
  savedToday,
  status,
  onRating,
  onToggleFactor,
  onNote,
  onSave,
}: {
  rating: DayRating;
  factors: DayFactor[];
  note: string;
  savedToday: boolean;
  status: string;
  onRating: (rating: DayRating) => void;
  onToggleFactor: (factor: DayFactor) => void;
  onNote: (note: string) => void;
  onSave: () => void;
}) {
  const colors = useColors();
  const styles = makeStyles(colors);

  return (
    <Card style={styles.card}>
      <View style={styles.headingRow}>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>End-of-day reflection</Text>
          <Text style={styles.title}>How was your day?</Text>
          <Text style={styles.body}>
            Turn the feel of the day into a small, transparent signal for better-timed decisions.
          </Text>
        </View>
        <DayPartVisual part="night" width={112} height={56} idSuffix="reflection-night" />
      </View>

      <Label>Overall</Label>
      <View style={styles.chipRow}>
        {DAY_RATINGS.map((item) => (
          <Chip key={item} label={DAY_RATING_LABELS[item]} selected={rating === item} onPress={() => onRating(item)} />
        ))}
      </View>
      <Text style={styles.scoreNote}>
        {DAY_RATING_LABELS[rating]} maps to {dayRatingScore(rating)}/10. It can move readiness by at most 6 points.
      </Text>

      <Label>What shaped it?</Label>
      <View style={styles.chipRow}>
        {DAY_FACTORS.map((factor) => (
          <Chip
            key={factor}
            label={DAY_FACTOR_LABELS[factor]}
            selected={factors.includes(factor)}
            onPress={() => onToggleFactor(factor)}
          />
        ))}
      </View>

      <Label>In your words (optional)</Label>
      <TextInput
        style={styles.note}
        value={note}
        onChangeText={onNote}
        maxLength={REFLECTION_NOTE_LIMIT}
        multiline
        placeholder="What helped, what was difficult, or what would you change?"
        placeholderTextColor={colors.dim}
        accessibilityLabel="End-of-day reflection note"
      />
      <Text style={styles.privacyNote}>Your words stay as context; Weathered scores only the rating you chose.</Text>

      <PrimaryButton label={savedToday ? "Update today's reflection" : "Save daily reflection"} onPress={onSave} />
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </Card>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    card: { borderWidth: 1, borderColor: colors.line, marginTop: 8 },
    headingRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
    headingCopy: { flex: 1 },
    eyebrow: {
      ...appText,
      fontSize: 10,
      color: colors.accent,
      textTransform: "uppercase",
      marginBottom: 3,
    },
    title: { ...appText, fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 4 },
    body: { ...appText, fontSize: 12, lineHeight: 17, color: colors.muted },
    chipRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 2 },
    scoreNote: { ...appText, fontSize: 11, color: colors.accent, lineHeight: 16, marginBottom: 12 },
    note: {
      backgroundColor: colors.card2,
      borderRadius: 10,
      color: colors.text,
      ...appText,
      fontSize: 13,
      padding: 10,
      minHeight: 72,
      textAlignVertical: "top",
    },
    privacyNote: { ...appText, fontSize: 10, color: colors.dim, lineHeight: 15, marginTop: 6, marginBottom: 10 },
    status: { ...appText, fontSize: 12, color: colors.accent, lineHeight: 17, marginTop: 10 },
  });
