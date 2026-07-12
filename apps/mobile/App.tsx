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
import { localRepository as repository } from "./src/lib/repository";
import { buildLocalWeatherSnapshot, fetchLiveReadyWeatherSnapshot } from "./src/lib/weather";
import { buildBehavioralRead, buildDecisionReadiness, buildRecommendationNudges } from "./src/lib/behavior";
import { buildDecisionForecast } from "./src/lib/forecast";
import { buildInsight } from "./src/lib/insights";
import { personalizeNudges } from "./src/lib/personalize";
import { buildWeekMood } from "./src/lib/weekMood";
import { buildSummary } from "./src/lib/summary";
import { exportBackup, importBackup } from "./src/lib/backup";
import {
  emptyDiagnostics,
  loadDiagnostics,
  recordDiagnosticEvent,
  type AppDiagnostics,
  type DiagnosticEvent,
} from "./src/lib/diagnostics";
import { paletteFor, ThemeProvider, type Palette } from "./src/theme";
import type { ThemeMode } from "@weathered/shared";
import { seedEntries } from "./src/seed";
import { TabBar, type TabId } from "./src/components/TabBar";
import { HomeScreen } from "./src/screens/HomeScreen";
import { Onboarding } from "./src/components/Onboarding";
import { HistoryScreen, type EditingState } from "./src/screens/HistoryScreen";
import { InsightsScreen } from "./src/screens/InsightsScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { LocationPermissionError } from "./src/lib/location";

const APP_VERSION = "2.0.1";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [entries, setEntries] = useState<DecisionLogInput[]>([]);
  const [weatherSourceMode, setWeatherSourceMode] = useState<WeatherSourceMode>("live_ready");
  const [onboardingComplete, setOnboardingComplete] = useState(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
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
  const [diagnostics, setDiagnostics] = useState<AppDiagnostics>(emptyDiagnostics);

  async function track(event: DiagnosticEvent, message?: string) {
    const next = await recordDiagnosticEvent(event, message);
    setDiagnostics(next);
  }

  useEffect(() => {
    let mounted = true;
    async function hydrate() {
      await repository.ensureSchemaVersion();
      const [nextEntries, nextPreferences, nextFeedback, nextDiagnostics] = await Promise.all([
        repository.loadEntries(seedEntries),
        repository.loadPreferences(),
        repository.loadFeedback(),
        loadDiagnostics(),
      ]);
      if (!mounted) return;
      setEntries(nextEntries);
      setWeatherSourceMode(nextPreferences.weatherSourceMode);
      setOnboardingComplete(nextPreferences.onboardingComplete);
      setThemeMode(nextPreferences.themeMode);
      setNudgeFeedback(nextFeedback);
      setDiagnostics(nextDiagnostics);
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
    if (weatherSourceMode !== "live_ready") {
      setWeatherSyncing(false);
      return;
    }
    setWeatherSyncing(true);
    fetchLiveReadyWeatherSnapshot()
      .then((snapshot) => {
        if (mounted) {
          setCurrentWeather(snapshot);
          void track("weather_sync_success", `Live weather updated for ${snapshot.locationLabel}.`);
        }
      })
      .catch((error: unknown) => {
        if (!mounted) return;
        const event = error instanceof LocationPermissionError ? "location_permission_denied" : "weather_sync_failure";
        const message =
          event === "location_permission_denied"
            ? "Location permission denied; local weather estimate used."
            : "Live weather unavailable; local weather estimate used.";
        void track(event, message);
      })
      .finally(() => {
        if (mounted) setWeatherSyncing(false);
      });
    return () => {
      mounted = false;
    };
  }, [weatherSourceMode]);

  useEffect(() => {
    if (isHydrating) return;
    repository.saveEntries(entries).then((ok) => {
      if (!ok) void track("storage_write_failure", "Could not save check-ins locally.");
    });
  }, [entries, isHydrating]);

  useEffect(() => {
    if (isHydrating) return;
    repository.savePreferences({ weatherSourceMode, onboardingComplete, themeMode }).then((ok) => {
      if (!ok) void track("storage_write_failure", "Could not save local preferences.");
    });
  }, [weatherSourceMode, onboardingComplete, themeMode, isHydrating]);

  useEffect(() => {
    if (isHydrating) return;
    repository.saveFeedback(nudgeFeedback).then((ok) => {
      if (!ok) void track("storage_write_failure", "Could not save recommendation feedback.");
    });
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
      personalizeNudges(
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

  async function handleBackup() {
    const result = await exportBackup(entries, nudgeFeedback);
    await track(result.ok ? "backup_export_success" : "backup_export_failure", result.message);
    return result.message;
  }

  async function handleRestore() {
    const result = await importBackup();
    if (result.ok && result.entries) {
      setEntries(result.entries);
      setNudgeFeedback(result.feedback ?? []);
    }
    await track(result.ok ? "backup_restore_success" : "backup_restore_failure", result.message);
    return result.message;
  }

  function handleClearAll() {
    setEntries([]);
    setNudgeFeedback([]);
  }

  function handleNudgeFeedback(id: string, value: RecommendationFeedbackValue) {
    setNudgeFeedback((current) => [
      { nudgeId: id, value, timestamp: new Date().toISOString() },
      ...current.filter((item) => item.nudgeId !== id),
    ]);
  }

  const colors = paletteFor(themeMode);
  const styles = makeStyles(colors);

  return (
    <ThemeProvider mode={themeMode}>
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle={themeMode === "light" ? "dark-content" : "light-content"} backgroundColor={colors.bg} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {activeTab === "home" ? (
            <>
              {onboardingComplete ? null : <Onboarding onDone={() => setOnboardingComplete(true)} />}
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
            </>
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
              behavioralRead={behavioralRead}
              nudges={nudges}
              nudgeFeedback={nudgeFeedback}
              onNudgeFeedback={handleNudgeFeedback}
              forecast={forecast}
            />
          ) : null}

          {activeTab === "settings" ? (
            <SettingsScreen
              weatherSourceMode={weatherSourceMode}
              onWeatherSourceChange={setWeatherSourceMode}
              themeMode={themeMode}
              onThemeChange={setThemeMode}
              entryCount={entries.length}
              version={APP_VERSION}
              diagnostics={diagnostics}
              onBackup={handleBackup}
              onRestore={handleRestore}
              onClear={handleClearAll}
            />
          ) : null}
        </ScrollView>
        <TabBar active={activeTab} onChange={setActiveTab} />
      </SafeAreaView>
    </ThemeProvider>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    scroll: { flex: 1 },
    content: { padding: 18, paddingBottom: 28 },
  });
