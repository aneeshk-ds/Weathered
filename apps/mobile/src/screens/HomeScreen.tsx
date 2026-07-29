import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import {
  DECISION_CATEGORIES,
  DECISION_OPTIONS,
  ENERGY_LEVELS,
  type DecisionCategory,
  type DecisionForecast,
  type DecisionOption,
  type DayFactor,
  type DayRating,
  type EnergyLevel,
  type WeatherSnapshot,
} from "@weathered/shared";
import { appText, useColors, type Palette } from "../theme";
import { CATEGORY_LABEL, ENERGY_LABEL, outcomeLabel, weatherEmoji } from "../format";
import { Card, Chip, Label, MoodScale, PrimaryButton, ScreenHeader } from "../components/ui";
import { WeatherMoodRing } from "../components/Rings";
import { supportiveMoodCaption } from "../lib/homeStats";
import { DailyReflectionCard } from "../components/DailyReflectionCard";

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
  reflection,
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
  reflection: {
    rating: DayRating;
    factors: DayFactor[];
    note: string;
    savedToday: boolean;
    status: string;
    onRating: (rating: DayRating) => void;
    onToggleFactor: (factor: DayFactor) => void;
    onNote: (note: string) => void;
    onSave: () => void;
  };
  weekStats: {
    averageMood: number;
    trackedDays: number;
    streak: number;
    deltaPct: number;
    hasComparison: boolean;
    hasEntries: boolean;
    weatherCondition: WeatherSnapshot["condition"];
  };
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
          <WeatherMoodRing mood={weekStats.averageMood} weather={weekStats.weatherCondition} />
          <View style={styles.weekMid}>
            <Text style={styles.weekLabel}>This week</Text>
            <Text style={styles.weekStreak}>{weekStats.trackedDays} of 7 days tracked</Text>
            <Text style={styles.weekWeather}>
              {weatherEmoji(weekStats.weatherCondition)} Mostly {weekStats.weatherCondition}
            </Text>
            {weekStats.hasComparison ? (
              <Text style={styles.weekCaption}>
                Mood{" "}
                <Text style={{ color: weekStats.deltaPct >= 0 ? colors.accent : colors.muted }}>
                  {weekStats.deltaPct >= 0 ? "↑" : "↓"}
                  {Math.abs(weekStats.deltaPct)}%
                </Text>{" "}
                vs last week
                {weekStats.streak > 1 ? ` · ${weekStats.streak}-day rhythm` : ""}
              </Text>
            ) : (
              <Text style={styles.weekCaption}>
                {supportiveMoodCaption(weekStats.averageMood)}
                {weekStats.streak > 1 ? ` ${weekStats.streak}-day rhythm.` : ""}
              </Text>
            )}
          </View>
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
      <View style={{ height: 16 }} />

      <DailyReflectionCard
        rating={reflection.rating}
        factors={reflection.factors}
        note={reflection.note}
        savedToday={reflection.savedToday}
        status={reflection.status}
        onRating={reflection.onRating}
        onToggleFactor={reflection.onToggleFactor}
        onNote={reflection.onNote}
        onSave={reflection.onSave}
      />
      <View style={{ height: 8 }} />
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    weatherCard: { flexDirection: "row", alignItems: "center", gap: 12 },
    weekCard: { flexDirection: "row", alignItems: "center", gap: 12 },
    weekMid: { flex: 1 },
    weekLabel: { ...appText, fontSize: 10, textTransform: "uppercase", color: colors.muted, marginBottom: 3 },
    weekStreak: { ...appText, fontSize: 14, fontWeight: "600", color: colors.text },
    weekWeather: { ...appText, fontSize: 11, color: colors.accent, marginTop: 2, textTransform: "capitalize" },
    weekCaption: { ...appText, fontSize: 12, color: colors.muted, marginTop: 3, lineHeight: 17 },
    weatherIcon: { fontSize: 30, width: 42, textAlign: "center" },
    weatherMain: { ...appText, fontSize: 15, fontWeight: "600", color: colors.text },
    weatherSub: { ...appText, fontSize: 12, color: colors.muted, marginTop: 2 },
    read: { ...appText, fontSize: 13, color: colors.accent, marginBottom: 14 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 6 },
    note: {
      backgroundColor: colors.card2,
      borderRadius: 10,
      color: colors.text,
      ...appText,
      fontSize: 13,
      padding: 10,
      minHeight: 56,
      textAlignVertical: "top",
    },
  });
