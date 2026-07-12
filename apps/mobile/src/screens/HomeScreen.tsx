import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import {
  DECISION_CATEGORIES,
  DECISION_OPTIONS,
  ENERGY_LEVELS,
  type DecisionCategory,
  type DecisionForecast,
  type DecisionOption,
  type EnergyLevel,
  type WeatherSnapshot,
} from "@weathered/shared";
import { useColors, type Palette } from "../theme";
import { CATEGORY_LABEL, ENERGY_LABEL, outcomeLabel, weatherEmoji } from "../format";
import { Card, Chip, Label, MoodScale, PrimaryButton, ScreenHeader } from "../components/ui";
import { ProgressRing } from "../components/Rings";
import { Sparkline } from "../components/Sparkline";
import { supportiveMoodCaption } from "../lib/homeStats";

const NOTE_LIMIT = 120;

export function HomeScreen({
  weather,
  weatherSyncing,
  forecast,
  mood,
  onMood,
  energy,
  onEnergy,
  category,
  onCategory,
  outcome,
  onOutcome,
  note,
  onNote,
  onSave,
  weekStats,
}: {
  weather: WeatherSnapshot;
  weatherSyncing: boolean;
  forecast: DecisionForecast;
  mood: number;
  onMood: (value: number) => void;
  energy: EnergyLevel;
  onEnergy: (value: EnergyLevel) => void;
  category: DecisionCategory;
  onCategory: (value: DecisionCategory) => void;
  outcome: DecisionOption;
  onOutcome: (value: DecisionOption) => void;
  note: string;
  onNote: (value: string) => void;
  onSave: () => void;
  weekStats: { averageMood: number; streak: number; weekMood: number[]; hasEntries: boolean };
}) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const outcomes = DECISION_OPTIONS[category];

  return (
    <View>
      <ScreenHeader
        eyebrow="Home"
        title="How are you right now?"
        subtitle="One quick check-in. Takes about 20 seconds."
      />

      <Card style={styles.weatherCard}>
        <Text style={styles.weatherIcon}>{weatherEmoji(weather.condition)}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.weatherMain}>
            {weather.condition[0].toUpperCase() + weather.condition.slice(1)}, {weather.temperatureC}°
          </Text>
          <Text style={styles.weatherSub}>
            {weatherSyncing ? "Updating…" : `${weather.locationLabel} · humidity ${weather.humidity}%`}
          </Text>
        </View>
      </Card>

      <Text style={styles.read}>◆ {forecast.title}</Text>

      {weekStats.hasEntries ? (
        <Card style={styles.weekCard}>
          <ProgressRing
            fraction={weekStats.averageMood / 10}
            value={weekStats.averageMood > 0 ? weekStats.averageMood.toFixed(1) : "-"}
            unit="/ 10"
            size={72}
          />
          <View style={styles.weekMid}>
            <Text style={styles.weekStreak}>
              {weekStats.streak > 0 ? `${weekStats.streak}-day streak` : "Start a streak today"}
            </Text>
            <Text style={styles.weekCaption}>{supportiveMoodCaption(weekStats.averageMood)}</Text>
          </View>
          <Sparkline values={weekStats.weekMood} />
        </Card>
      ) : null}

      <Label>Mood</Label>
      <MoodScale value={mood} onChange={onMood} />

      <Label>Energy</Label>
      <View style={styles.chipRow}>
        {ENERGY_LEVELS.map((level) => (
          <Chip key={level} label={ENERGY_LABEL[level]} selected={energy === level} onPress={() => onEnergy(level)} />
        ))}
      </View>

      <Label>What are you deciding?</Label>
      <View style={styles.chipRow}>
        {DECISION_CATEGORIES.map((item) => (
          <Chip key={item} label={CATEGORY_LABEL[item]} selected={category === item} onPress={() => onCategory(item)} />
        ))}
      </View>

      <Label>Your choice</Label>
      <View style={styles.chipRow}>
        {outcomes.map((item) => (
          <Chip key={item} label={outcomeLabel(item)} selected={outcome === item} onPress={() => onOutcome(item)} />
        ))}
      </View>

      <Label>Note (optional)</Label>
      <TextInput
        style={styles.note}
        value={note}
        onChangeText={onNote}
        maxLength={NOTE_LIMIT}
        multiline
        placeholder="Anything worth remembering…"
        placeholderTextColor={colors.dim}
      />

      <View style={{ height: 14 }} />
      <PrimaryButton label="Save check-in" onPress={onSave} />
      <View style={{ height: 8 }} />
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    weatherCard: { flexDirection: "row", alignItems: "center", gap: 12 },
    weekCard: { flexDirection: "row", alignItems: "center", gap: 12 },
    weekMid: { flex: 1 },
    weekStreak: { fontSize: 14, fontWeight: "600", color: colors.text },
    weekCaption: { fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 17 },
    weatherIcon: { fontSize: 30, width: 42, textAlign: "center" },
    weatherMain: { fontSize: 15, fontWeight: "600", color: colors.text },
    weatherSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
    read: { fontSize: 13, color: colors.accent, marginBottom: 14 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 6 },
    note: {
      backgroundColor: colors.card2,
      borderRadius: 10,
      color: colors.text,
      fontSize: 13,
      padding: 10,
      minHeight: 56,
      textAlignVertical: "top",
    },
  });
