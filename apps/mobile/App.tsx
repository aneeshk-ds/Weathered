import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StatusBar, StyleSheet } from "react-native";
import {
  DECISION_OPTIONS,
  type DecisionCategory,
  type DecisionLogInput,
  type DecisionOption,
  type EnergyLevel,
  type RecommendationFeedback,
  type RecommendationFeedbackValue,
  type WeatherSnapshot,
  type WeatherSourceMode,
} from "@weathered/shared";
import {
  loadEntries,
  loadPreferences,
  loadRecommendationFeedback,
  saveEntries,
  savePreferences,
  saveRecommendationFeedback,
} from "./src/lib/storage";
import { buildLocalWeatherSnapshot, fetchLiveReadyWeatherSnapshot } from "./src/lib/weather";
import { buildBehavioralRead, buildDecisionReadiness, buildRecommendationNudges } from "./src/lib/behavior";
import { buildDecisionForecast } from "./src/lib/forecast";
import { buildInsight } from "./src/lib/insights";
import { buildSummary } from "./src/lib/summary";
import { colors } from "./src/theme";
import { seedEntries } from "./src/seed";
import { TabBar, type TabId } from "./src/components/TabBar";
import { HomeScreen } from "./src/screens/HomeScreen";
import { HistoryScreen, type EditingState } from "./src/screens/HistoryScreen";
import { InsightsScreen } from "./src/screens/InsightsScreen";

function personalize(
  nudges: ReturnType<typeof buildRecommendationNudges>,
  feedback: RecommendationFeedback[],
) {
  const value = new Map(feedback.map((item) => [item.nudgeId, item.value]));
  const score = (id: string) => {
    const choice = value.get(id);
    return choice === "helpful" ? 1 : choice === "not_now" ? -1 : 0;
  };
  return [...nudges].sort((left, right) => score(right.id) - score(left.id));
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildWeekMood(entries: DecisionLogInput[]): number[] {
  const today = new Date();
  const week: number[] = [];
  for (let offset = 6; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - offset);
    const dayEntries = entries.filter((entry) => sameDay(new Date(entry.timestamp), day));
    const avg = dayEntries.length
      ? dayEntries.reduce((sum, entry) => sum + entry.mood, 0) / dayEntries.length
      : 0;
    week.push(Math.round(avg * 10) / 10);
  }
  return week;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [entries, setEntries] = useState<DecisionLogInput[]>([]);
  const [weatherSourceMode] = useState<WeatherSourceMode>("live_ready");
  const [currentWeather, setCurrentWeather] = useState<WeatherSnapshot>(() => buildLocalWeatherSnapshot("live_ready"));
  const [weatherSyncing, setWeatherSyncing] = useState(false);
  const [mood, setMood] = useState(6);
  const [energy, setEnergy] = useState<EnergyLevel>("medium");
  const [category, setCategory] = useState<DecisionCategory>("social");
  const [outcome, setOutcome] = useState<DecisionOption>("go_out");
  const [note, setNote] = useState("");
  const [nudgeFeedback, setNudgeFeedback] = useState<RecommendationFeedback[]>([]);
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function hydrate() {
      const [nextEntries, , nextFeedback] = await Promise.all([
        loadEntries(seedEntries),
        loadPreferences(),
        loadRecommendationFeedback(),
      ]);
      if (!mounted) return;
      setEntries(nextEntries);
      setNudgeFeedback(nextFeedback);
      setIsHydrating(false);
    }
    hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    setCurrentWeather(buildLocalWeatherSnapshot(weatherSourceMode));
    if (weatherSourceMode !== "live_ready") return;
    setWeatherSyncing(true);
    fetchLiveReadyWeatherSnapshot()
      .then((snapshot) => {
        if (mounted) setCurrentWeather(snapshot);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setWeatherSyncing(false);
      });
    return () => {
      mounted = false;
    };
  }, [weatherSourceMode]);

  useEffect(() => {
    if (isHydrating) return;
    saveEntries(entries);
  }, [entries, isHydrating]);

  useEffect(() => {
    if (isHydrating) return;
    savePreferences({ weatherSourceMode });
  }, [weatherSourceMode, isHydrating]);

  useEffect(() => {
    if (isHydrating) return;
    saveRecommendationFeedback(nudgeFeedback);
  }, [nudgeFeedback, isHydrating]);

  const behavioralRead = useMemo(
    () => buildBehavioralRead({ mood, energy, weather: currentWeather }),
    [mood, energy, currentWeather],
  );
  const readiness = useMemo(
    () => buildDecisionReadiness({ read: behavioralRead, category, mood, energy, weather: currentWeather, entries }),
    [behavioralRead, category, mood, energy, currentWeather, entries],
  );
  const nudges = useMemo(
    () =>
      personalize(
        buildRecommendationNudges({ read: behavioralRead, category, mood, energy, weather: currentWeather, entries }),
        nudgeFeedback,
      ).slice(0, 3),
    [behavioralRead, category, mood, energy, currentWeather, entries, nudgeFeedback],
  );
  const forecast = useMemo(
    () => buildDecisionForecast(entries, currentWeather, { mood, energy }),
    [entries, currentWeather, mood, energy],
  );
  const summary = useMemo(() => buildSummary(entries), [entries]);
  const insight = useMemo(() => (entries.length ? buildInsight(entries[0], entries) : null), [entries]);
  const weekMood = useMemo(() => buildWeekMood(entries), [entries]);

  function handleCategory(next: DecisionCategory) {
    setCategory(next);
    setOutcome(DECISION_OPTIONS[next][0]);
  }

  function handleSave() {
    const entry: DecisionLogInput = {
      id: `entry-${Date.now()}`,
      userId: "local",
      mood,
      energy,
      decisionCategory: category,
      decisionOutcome: outcome,
      note: note.trim() || undefined,
      weather: currentWeather,
      timestamp: new Date().toISOString(),
    };
    setEntries((current) => [entry, ...current]);
    setNote("");
    setActiveTab("insights");
  }

  function handleStartEdit(entry: DecisionLogInput) {
    setEditing({
      id: entry.id,
      mood: entry.mood,
      energy: entry.energy,
      category: entry.decisionCategory,
      outcome: entry.decisionOutcome,
      note: entry.note || "",
    });
  }

  function handleSaveEdit() {
    if (!editing) return;
    setEntries((current) =>
      current.map((entry) =>
        entry.id === editing.id
          ? {
              ...entry,
              mood: editing.mood,
              energy: editing.energy,
              decisionCategory: editing.category,
              decisionOutcome: editing.outcome,
              note: editing.note.trim() || undefined,
            }
          : entry,
      ),
    );
    setEditing(null);
  }

  function handleNudgeFeedback(id: string, value: RecommendationFeedbackValue) {
    setNudgeFeedback((current) => [
      { nudgeId: id, value, timestamp: new Date().toISOString() },
      ...current.filter((item) => item.nudgeId !== id),
    ]);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bg} />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {activeTab === "home" ? (
          <HomeScreen
            weather={currentWeather}
            weatherSyncing={weatherSyncing}
            forecast={forecast}
            mood={mood}
            onMood={setMood}
            energy={energy}
            onEnergy={setEnergy}
            category={category}
            onCategory={handleCategory}
            outcome={outcome}
            onOutcome={setOutcome}
            note={note}
            onNote={setNote}
            onSave={handleSave}
          />
        ) : null}

        {activeTab === "history" ? (
          <HistoryScreen
            entries={entries}
            editing={editing}
            onStartEdit={handleStartEdit}
            onChangeEditing={(patch) => setEditing((current) => (current ? { ...current, ...patch } : current))}
            onSaveEdit={handleSaveEdit}
            onCancelEdit={() => setEditing(null)}
            onDelete={(id) => setEntries((current) => current.filter((entry) => entry.id !== id))}
            onLoadSample={() => setEntries(seedEntries)}
            onClear={() => {
              setEntries([]);
              setNudgeFeedback([]);
            }}
          />
        ) : null}

        {activeTab === "insights" ? (
          <InsightsScreen
            insight={insight}
            summary={summary}
            entries={entries}
            weekMood={weekMood}
            readiness={readiness}
            nudges={nudges}
            nudgeFeedback={nudgeFeedback}
            onNudgeFeedback={handleNudgeFeedback}
            forecast={forecast}
          />
        ) : null}
      </ScrollView>
      <TabBar active={activeTab} onChange={setActiveTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  content: { padding: 18, paddingBottom: 28 },
});
