import React, { useEffect, useMemo, useRef, useState } from "react";
import { AppState, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import {
  DECISION_OPTIONS,
  type DailyReflection,
  type DayFactor,
  type DayRating,
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
import { mergeSnapshots } from "./src/lib/sync";
import { clearRemoteData, deleteRemoteCheckIn, supabaseSync } from "./src/lib/supabaseSync";
import { isSupabaseConfigured } from "./src/lib/supabase";
import { cancelDailyReminders, scheduleDailyReminders } from "./src/lib/notifications";
import { startLocationNudge, stopLocationNudge } from "./src/lib/locationNudge";
import { buildLocalWeatherSnapshot, fetchLiveReadyWeatherSnapshot } from "./src/lib/weather";
import { buildBehavioralRead, buildDecisionReadiness, buildRecommendationNudges } from "./src/lib/behavior";
import { buildDecisionForecast } from "./src/lib/forecast";
import { buildInsight } from "./src/lib/insights";
import { personalizeNudges } from "./src/lib/personalize";
import { buildWeekDays } from "./src/lib/weekMood";
import { buildSummary } from "./src/lib/summary";
import { computeStreak, dominantWeeklyWeather, weeklyMoodDelta } from "./src/lib/homeStats";
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
import { TabBar, type TabId } from "./src/components/TabBar";
import { HomeScreen } from "./src/screens/HomeScreen";
import { Onboarding } from "./src/components/Onboarding";
import { HistoryScreen, type EditingState } from "./src/screens/HistoryScreen";
import { InsightsScreen } from "./src/screens/InsightsScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { LocationPermissionError } from "./src/lib/location";
import { dayRatingScore, localDayKey, reflectionForDay, upsertDailyReflection } from "./src/lib/reflections";

const APP_VERSION = "2.1.5";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [entries, setEntries] = useState<DecisionLogInput[]>([]);
  const [weatherSourceMode, setWeatherSourceMode] = useState<WeatherSourceMode>("live_ready");
  const [onboardingComplete, setOnboardingComplete] = useState(true);
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncStatus, setSyncStatus] = useState("");
  const syncedRef = useRef(false);
  const [remindersEnabled, setRemindersEnabled] = useState(false);
  const [reminderStatus, setReminderStatus] = useState("");
  const [locationNudgeEnabled, setLocationNudgeEnabled] = useState(false);
  const [locationNudgeStatus, setLocationNudgeStatus] = useState("");
  const [currentWeather, setCurrentWeather] = useState<WeatherSnapshot>(() => buildLocalWeatherSnapshot("live_ready"));
  const [weatherSyncing, setWeatherSyncing] = useState(false);
  const [mood, setMood] = useState(6);
  const [energy, setEnergy] = useState<EnergyLevel>("medium");
  const [category, setCategory] = useState<DecisionCategory>("social");
  const [outcome, setOutcome] = useState<DecisionOption>("go_out");
  const [note, setNote] = useState("");
  const [nudgeFeedback, setNudgeFeedback] = useState<RecommendationFeedback[]>([]);
  const [reflections, setReflections] = useState<DailyReflection[]>([]);
  const [dayRating, setDayRating] = useState<DayRating>("good");
  const [dayFactors, setDayFactors] = useState<DayFactor[]>([]);
  const [dayReflectionNote, setDayReflectionNote] = useState("");
  const [reflectionStatus, setReflectionStatus] = useState("");
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
      const [nextEntries, nextPreferences, nextFeedback, nextReflections, nextDiagnostics] = await Promise.all([
        repository.loadEntries(),
        repository.loadPreferences(),
        repository.loadFeedback(),
        repository.loadReflections(),
        loadDiagnostics(),
      ]);
      if (!mounted) return;
      setEntries(nextEntries);
      setWeatherSourceMode(nextPreferences.weatherSourceMode);
      setOnboardingComplete(nextPreferences.onboardingComplete);
      setThemeMode(nextPreferences.themeMode);
      setSyncEnabled(nextPreferences.syncEnabled && isSupabaseConfigured);
      setRemindersEnabled(nextPreferences.remindersEnabled);
      setLocationNudgeEnabled(nextPreferences.locationNudgeEnabled);
      setNudgeFeedback(nextFeedback);
      setReflections(nextReflections);
      const todayReflection = reflectionForDay(nextReflections);
      if (todayReflection) {
        setDayRating(todayReflection.rating);
        setDayFactors(todayReflection.factors);
        setDayReflectionNote(todayReflection.note ?? "");
      }
      setDiagnostics(nextDiagnostics);
      setIsHydrating(false);
    }
    hydrate();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (isHydrating) return;
    let mounted = true;

    async function reconcileReminders() {
      if (Platform.OS === "web") {
        if (mounted) {
          setReminderStatus(remindersEnabled ? "Reminders work on the installed app, not the web preview." : "");
        }
        return;
      }

      if (!remindersEnabled) {
        await cancelDailyReminders();
        if (mounted) setReminderStatus("");
        return;
      }

      const ok = await scheduleDailyReminders();
      if (mounted) {
        setReminderStatus(
          ok
            ? "Reminders active: 9am, 1pm, 6pm, and 9pm."
            : "Allow notifications in your system settings, then return to Weathered.",
        );
      }
    }

    void reconcileReminders();
    const subscription =
      Platform.OS === "web"
        ? null
        : AppState.addEventListener("change", (state) => {
            if (state === "active" && remindersEnabled) void reconcileReminders();
          });

    return () => {
      mounted = false;
      subscription?.remove();
    };
  }, [isHydrating, remindersEnabled]);

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
    repository
      .savePreferences({
        weatherSourceMode,
        onboardingComplete,
        themeMode,
        syncEnabled,
        remindersEnabled,
        locationNudgeEnabled,
      })
      .then((ok) => {
        if (!ok) void track("storage_write_failure", "Could not save local preferences.");
      });
  }, [
    weatherSourceMode,
    onboardingComplete,
    themeMode,
    syncEnabled,
    remindersEnabled,
    locationNudgeEnabled,
    isHydrating,
  ]);

  // Initial cloud sync when the user opts in: pull remote, merge with local
  // (last write wins), then push the merged result back. Runs once per enable.
  useEffect(() => {
    if (!syncEnabled) {
      syncedRef.current = false;
      setSyncStatus("");
      return;
    }
    if (isHydrating || syncedRef.current) return;
    let mounted = true;
    setSyncStatus("Syncing…");
    (async () => {
      const remote = await supabaseSync.pull();
      if (!mounted) return;
      if (!remote) {
        setSyncStatus("Sync unavailable right now. Working offline.");
        return;
      }
      const merged = mergeSnapshots({ entries, feedback: nudgeFeedback }, remote);
      setEntries(merged.entries);
      setNudgeFeedback(merged.feedback);
      const ok = await supabaseSync.push(merged);
      if (!mounted) return;
      syncedRef.current = true;
      setSyncStatus(ok ? "Synced to your private cloud." : "Downloaded; upload will retry.");
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncEnabled, isHydrating]);

  // Push later local changes to the cloud once the initial sync has completed.
  useEffect(() => {
    if (!syncEnabled || isHydrating || !syncedRef.current) return;
    supabaseSync.push({ entries, feedback: nudgeFeedback }).then((ok) => {
      if (!ok) setSyncStatus("Some changes did not upload. Will retry.");
    });
  }, [entries, nudgeFeedback, syncEnabled, isHydrating]);

  useEffect(() => {
    if (isHydrating) return;
    repository.saveFeedback(nudgeFeedback).then((ok) => {
      if (!ok) void track("storage_write_failure", "Could not save recommendation feedback.");
    });
  }, [nudgeFeedback, isHydrating]);

  useEffect(() => {
    if (isHydrating) return;
    repository.saveReflections(reflections).then((ok) => {
      if (!ok) void track("storage_write_failure", "Could not save daily reflections.");
    });
  }, [reflections, isHydrating]);

  const behavioralRead = useMemo(
    () => buildBehavioralRead({ mood, energy, weather: currentWeather }),
    [mood, energy, currentWeather],
  );
  const readiness = useMemo(
    () =>
      buildDecisionReadiness({
        read: behavioralRead,
        category,
        mood,
        energy,
        weather: currentWeather,
        entries,
        reflections,
      }),
    [behavioralRead, category, mood, energy, currentWeather, entries, reflections],
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
  const weekDays = useMemo(() => buildWeekDays(entries), [entries]);
  const streak = useMemo(() => computeStreak(entries), [entries]);
  const moodDelta = useMemo(() => weeklyMoodDelta(entries), [entries]);
  const weeklyWeather = useMemo(
    () => dominantWeeklyWeather(entries) ?? currentWeather.condition,
    [entries, currentWeather.condition],
  );
  const todayReflection = useMemo(() => reflectionForDay(reflections), [reflections]);

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

  function handleToggleDayFactor(factor: DayFactor) {
    setDayFactors((current) =>
      current.includes(factor) ? current.filter((item) => item !== factor) : [...current, factor],
    );
    setReflectionStatus("");
  }

  function handleSaveDailyReflection() {
    const now = new Date();
    const reflection: DailyReflection = {
      id: `reflection-${localDayKey(now)}`,
      userId: "local",
      rating: dayRating,
      factors: dayFactors,
      note: dayReflectionNote.trim() || undefined,
      timestamp: now.toISOString(),
    };
    setReflections((current) => upsertDailyReflection(current, reflection));
    setReflectionStatus(
      `Saved as ${dayRatingScore(dayRating)}/10. This reflection now informs readiness without overriding live signals.`,
    );
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
    const result = await exportBackup(entries, nudgeFeedback, reflections);
    await track(result.ok ? "backup_export_success" : "backup_export_failure", result.message);
    return result.message;
  }

  async function handleRestore() {
    const result = await importBackup();
    if (result.ok && result.entries) {
      setEntries(result.entries);
      setNudgeFeedback(result.feedback ?? []);
      const restoredReflections = result.reflections ?? [];
      setReflections(restoredReflections);
      const restoredToday = reflectionForDay(restoredReflections);
      setDayRating(restoredToday?.rating ?? "good");
      setDayFactors(restoredToday?.factors ?? []);
      setDayReflectionNote(restoredToday?.note ?? "");
    }
    await track(result.ok ? "backup_restore_success" : "backup_restore_failure", result.message);
    return result.message;
  }

  function handleRemindersChange(enabled: boolean) {
    setRemindersEnabled(enabled);
  }

  async function handleLocationNudgeChange(enabled: boolean) {
    if (Platform.OS === "web") {
      setLocationNudgeEnabled(false);
      setLocationNudgeStatus("Travel weather alerts work on the installed app, not the web preview.");
      return;
    }
    if (enabled) {
      const ok = await startLocationNudge();
      setLocationNudgeEnabled(ok);
      setLocationNudgeStatus(
        ok
          ? "Watching for meaningful place and weather changes while you travel."
          : "Allow background location and notifications in system settings, then turn this on again.",
      );
    } else {
      await stopLocationNudge();
      setLocationNudgeEnabled(false);
      setLocationNudgeStatus("");
    }
  }

  function handleClearAll() {
    setEntries([]);
    setNudgeFeedback([]);
    setReflections([]);
    setDayRating("good");
    setDayFactors([]);
    setDayReflectionNote("");
    setReflectionStatus("");
    if (syncEnabled) void clearRemoteData();
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
    <SafeAreaProvider>
      <ThemeProvider mode={themeMode}>
        <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
          <StatusBar barStyle={themeMode === "light" ? "dark-content" : "light-content"} backgroundColor={colors.bg} />
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
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
                    weekStats={{
                      averageMood: summary.averageMood,
                      trackedDays: summary.trackedDays,
                      streak,
                      deltaPct: moodDelta.deltaPct,
                      hasComparison: moodDelta.hasComparison,
                      hasEntries: entries.length > 0,
                      weatherCondition: weeklyWeather,
                    }}
                    reflection={{
                      rating: dayRating,
                      factors: dayFactors,
                      note: dayReflectionNote,
                      savedToday: todayReflection !== null,
                      status: reflectionStatus,
                      onRating: (rating) => {
                        setDayRating(rating);
                        setReflectionStatus("");
                      },
                      onToggleFactor: handleToggleDayFactor,
                      onNote: (value) => {
                        setDayReflectionNote(value);
                        setReflectionStatus("");
                      },
                      onSave: handleSaveDailyReflection,
                    }}
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
                  onDelete={(id) => {
                    setEntries((current) => current.filter((entry) => entry.id !== id));
                    if (syncEnabled) void deleteRemoteCheckIn(id);
                  }}
                  onClear={handleClearAll}
                />
              ) : null}

              {activeTab === "insights" ? (
                <InsightsScreen
                  insight={insight}
                  summary={summary}
                  entries={entries}
                  weekDays={weekDays}
                  readiness={readiness}
                  behavioralRead={behavioralRead}
                  nudges={nudges}
                  nudgeFeedback={nudgeFeedback}
                  onNudgeFeedback={handleNudgeFeedback}
                  forecast={forecast}
                  reflections={reflections}
                />
              ) : null}

              {activeTab === "settings" ? (
                <SettingsScreen
                  weatherSourceMode={weatherSourceMode}
                  onWeatherSourceChange={setWeatherSourceMode}
                  themeMode={themeMode}
                  onThemeChange={setThemeMode}
                  syncEnabled={syncEnabled}
                  syncAvailable={isSupabaseConfigured}
                  onSyncChange={(enabled) => setSyncEnabled(enabled && isSupabaseConfigured)}
                  syncStatus={syncStatus}
                  remindersEnabled={remindersEnabled}
                  onRemindersChange={handleRemindersChange}
                  reminderStatus={reminderStatus}
                  locationNudgeEnabled={locationNudgeEnabled}
                  onLocationNudgeChange={handleLocationNudgeChange}
                  locationNudgeStatus={locationNudgeStatus}
                  entryCount={entries.length}
                  reflectionCount={reflections.length}
                  version={APP_VERSION}
                  diagnostics={diagnostics}
                  onBackup={handleBackup}
                  onRestore={handleRestore}
                  onClear={handleClearAll}
                />
              ) : null}
            </ScrollView>
          </KeyboardAvoidingView>
          <TabBar active={activeTab} onChange={setActiveTab} />
        </SafeAreaView>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.bg },
    flex: { flex: 1 },
    scroll: { flex: 1 },
    content: { padding: 18, paddingBottom: 40 },
  });
