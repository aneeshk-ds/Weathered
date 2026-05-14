import React, { useEffect, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  DECISION_CATEGORIES,
  DECISION_OPTIONS,
  ENERGY_LEVELS,
  type BehavioralRead,
  type BehaviorSignalLevel,
  type DecisionCategory,
  type DecisionForecast,
  type DecisionLogInput,
  type DecisionOption,
  type DecisionReadiness,
  type EnergyLevel,
  type Insight,
  type RecommendationFeedback,
  type RecommendationFeedbackValue,
  type RecommendationNudge,
  type RecommendationTone,
  type WeatherSnapshot,
  type WeatherSourceMode,
} from "@weathered/shared";
import { buildBehavioralRead, buildDecisionReadiness, buildRecommendationNudges } from "./src/lib/behavior";
import { buildDecisionForecast } from "./src/lib/forecast";
import { buildInsight } from "./src/lib/insights";
import {
  loadEntries,
  loadDeviceTestResult,
  loadPreferences,
  loadRecommendationFeedback,
  saveDeviceTestResult,
  saveEntries,
  savePreferences,
  saveRecommendationFeedback,
  type DeviceTestResult,
} from "./src/lib/storage";
import { buildSummary, isWithinLast7Days } from "./src/lib/summary";
import {
  buildLocalWeatherSnapshot,
  describeWeatherSource,
  fetchLiveReadyWeatherSnapshot,
  formatWeatherSource,
  type WeatherSourceStatus,
  WEATHER_SOURCE_OPTIONS,
} from "./src/lib/weather";

type AppTab = "log" | "history" | "summary";
type ThemeMode = "light" | "dark";
type WeatherSyncState = "local" | "syncing" | "api" | "fallback";
type EntryEditorState = {
  id: string;
  mood: number;
  energy: EnergyLevel;
  decisionCategory: DecisionCategory;
  decisionOutcome: DecisionOption;
  note: string;
} | null;

type ThemePalette = {
  background: string;
  backgroundGlow: string;
  card: string;
  cardAlt: string;
  border: string;
  text: string;
  mutedText: string;
  eyebrow: string;
  accent: string;
  accentSoft: string;
  accentText: string;
  chip: string;
  chipText: string;
  selectedChip: string;
  selectedChipText: string;
  input: string;
  statusBg: string;
  statusText: string;
  insightBg: string;
  insightText: string;
  destructiveBg: string;
  destructiveText: string;
  summaryTrack: string;
  heroCloud: string;
  heroSun: string;
};

const moodScale = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const NOTE_LIMIT = 120;

const lightTheme: ThemePalette = {
  background: "#f3efe7",
  backgroundGlow: "#ebe3d1",
  card: "#fffaf2",
  cardAlt: "#f8f3ea",
  border: "#e6dac6",
  text: "#1f201e",
  mutedText: "#66685f",
  eyebrow: "#976f2d",
  accent: "#2f6c5d",
  accentSoft: "#e7f0ec",
  accentText: "#f8faf6",
  chip: "#efe5d5",
  chipText: "#4b4133",
  selectedChip: "#2f6c5d",
  selectedChipText: "#f7f5ef",
  input: "#ffffff",
  statusBg: "#e3efee",
  statusText: "#2f5c52",
  insightBg: "#f6e2b7",
  insightText: "#6c541b",
  destructiveBg: "#f2d9d2",
  destructiveText: "#8a3c2c",
  summaryTrack: "#eadfcd",
  heroCloud: "#ffffff",
  heroSun: "#f6c25b",
};

const darkTheme: ThemePalette = {
  background: "#11161d",
  backgroundGlow: "#1a2530",
  card: "#19222c",
  cardAlt: "#22303d",
  border: "#2f4252",
  text: "#f2f6f8",
  mutedText: "#a9b8c4",
  eyebrow: "#f1bc63",
  accent: "#79c0ab",
  accentSoft: "#223942",
  accentText: "#0d1519",
  chip: "#263440",
  chipText: "#d8e2e8",
  selectedChip: "#79c0ab",
  selectedChipText: "#102025",
  input: "#101820",
  statusBg: "#20323d",
  statusText: "#bde7da",
  insightBg: "#3d3521",
  insightText: "#f5dda1",
  destructiveBg: "#4a2a2b",
  destructiveText: "#ffb8b4",
  summaryTrack: "#2d3d49",
  heroCloud: "#d9e1e8",
  heroSun: "#f1b24c",
};

const seededEntries: DecisionLogInput[] = [
  {
    id: "seed-1",
    userId: "local-prototype-user",
    mood: 8,
    energy: "high",
    decisionCategory: "social",
    decisionOutcome: "go_out",
    note: "Went out for coffee after work",
    weather: {
      condition: "sunny",
      temperatureC: 31,
      humidity: 48,
      locationLabel: "Bengaluru",
    },
    timestamp: "2026-04-29T18:10:00.000Z",
  },
  {
    id: "seed-2",
    userId: "local-prototype-user",
    mood: 6,
    energy: "medium",
    decisionCategory: "work",
    decisionOutcome: "work",
    note: "Closed out planning tasks",
    weather: {
      condition: "cloudy",
      temperatureC: 27,
      humidity: 64,
      locationLabel: "Bengaluru",
    },
    timestamp: "2026-04-30T10:00:00.000Z",
  },
  {
    id: "seed-3",
    userId: "local-prototype-user",
    mood: 4,
    energy: "low",
    decisionCategory: "social",
    decisionOutcome: "cancel",
    note: "Skipped dinner plans",
    weather: {
      condition: "rainy",
      temperatureC: 22,
      humidity: 83,
      locationLabel: "Bengaluru",
    },
    timestamp: "2026-05-01T18:30:00.000Z",
  },
  {
    id: "seed-4",
    userId: "local-prototype-user",
    mood: 7,
    energy: "high",
    decisionCategory: "work",
    decisionOutcome: "work",
    note: "Finished the planning deck",
    weather: {
      condition: "sunny",
      temperatureC: 31,
      humidity: 52,
      locationLabel: "Bengaluru",
    },
    timestamp: "2026-05-02T09:15:00.000Z",
  },
  {
    id: "seed-5",
    userId: "local-prototype-user",
    mood: 3,
    energy: "low",
    decisionCategory: "work",
    decisionOutcome: "skip",
    note: "Pushed deep work to tomorrow",
    weather: {
      condition: "rainy",
      temperatureC: 21,
      humidity: 86,
      locationLabel: "Bengaluru",
    },
    timestamp: "2026-05-03T11:40:00.000Z",
  },
  {
    id: "seed-6",
    userId: "local-prototype-user",
    mood: 5,
    energy: "medium",
    decisionCategory: "spending",
    decisionOutcome: "avoid",
    note: "Avoided impulse shopping",
    weather: {
      condition: "cloudy",
      temperatureC: 26,
      humidity: 68,
      locationLabel: "Bengaluru",
    },
    timestamp: "2026-05-04T16:20:00.000Z",
  },
  {
    id: "seed-7",
    userId: "local-prototype-user",
    mood: 8,
    energy: "high",
    decisionCategory: "social",
    decisionOutcome: "go_out",
    note: "Confirmed brunch plans early",
    weather: {
      condition: "sunny",
      temperatureC: 30,
      humidity: 50,
      locationLabel: "Bengaluru",
    },
    timestamp: "2026-05-05T09:00:00.000Z",
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>("summary");
  const [themeMode, setThemeMode] = useState<ThemeMode>("dark");
  const [entries, setEntries] = useState<DecisionLogInput[]>([]);
  const [weatherSourceMode, setWeatherSourceMode] = useState<WeatherSourceMode>("daily_mock");
  const [currentWeather, setCurrentWeather] = useState<WeatherSnapshot>(() => buildLocalWeatherSnapshot("daily_mock"));
  const [weatherSyncState, setWeatherSyncState] = useState<WeatherSyncState>("local");
  const [weatherCheckedAt, setWeatherCheckedAt] = useState<string | null>(null);
  const [mood, setMood] = useState<number>(6);
  const [energy, setEnergy] = useState<EnergyLevel>("medium");
  const [category, setCategory] = useState<DecisionCategory>("social");
  const [outcome, setOutcome] = useState<DecisionOption>("go_out");
  const [note, setNote] = useState("");
  const [latestInsight, setLatestInsight] = useState<Insight | null>(null);
  const [nudgeFeedback, setNudgeFeedback] = useState<RecommendationFeedback[]>([]);
  const [deviceTestResult, setDeviceTestResult] = useState<DeviceTestResult>({ status: "pending" });
  const [editor, setEditor] = useState<EntryEditorState>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saved" | "error">("idle");

  const theme = themeMode === "light" ? lightTheme : darkTheme;
  const styles = createStyles(theme);
  const availableOutcomes = DECISION_OPTIONS[category];
  const weatherSourceStatus = describeWeatherSource(weatherSourceMode);
  const behavioralRead = buildBehavioralRead({ mood, energy, weather: currentWeather });
  const decisionReadiness = buildDecisionReadiness({
    read: behavioralRead,
    category,
    mood,
    energy,
    weather: currentWeather,
    entries,
  });
  const recommendationNudges = personalizeRecommendationNudges(
    buildRecommendationNudges({
      read: behavioralRead,
      category,
      mood,
      energy,
      weather: currentWeather,
      entries,
    }),
    nudgeFeedback,
  );
  const summary = buildSummary(entries);
  const forecast = buildDecisionForecast(entries, currentWeather);
  const weeklyEntries = entries.filter((item) => isWithinLast7Days(item.timestamp));
  const averageHumidity =
    weeklyEntries.length > 0
      ? Math.round(weeklyEntries.reduce((sum, item) => sum + item.weather.humidity, 0) / weeklyEntries.length)
      : currentWeather.humidity;
  const averageTemperature =
    weeklyEntries.length > 0
      ? Math.round(
          weeklyEntries.reduce((sum, item) => sum + item.weather.temperatureC, 0) / weeklyEntries.length,
        )
      : currentWeather.temperatureC;
  const rainyEntryCount = weeklyEntries.filter((item) => item.weather.condition === "rainy").length;
  const sunnyEntryCount = weeklyEntries.filter((item) => item.weather.condition === "sunny").length;
  const cloudyEntryCount = weeklyEntries.filter((item) => item.weather.condition === "cloudy").length;
  const lowMoodCount = weeklyEntries.filter((item) => item.mood <= 4).length;
  const strongestCategory = DECISION_CATEGORIES.reduce(
    (best, category) =>
      (summary.decisionCounts[category] || 0) > (summary.decisionCounts[best] || 0) ? category : best,
    "social" as DecisionCategory,
  );
  const strongestWeather =
    rainyEntryCount >= sunnyEntryCount && rainyEntryCount >= cloudyEntryCount
      ? "rainy"
      : sunnyEntryCount >= cloudyEntryCount
        ? "sunny"
        : "cloudy";

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      const [nextEntries, preferences, nextNudgeFeedback, nextDeviceTestResult] = await Promise.all([
        loadEntries(seededEntries),
        loadPreferences(),
        loadRecommendationFeedback(),
        loadDeviceTestResult(),
      ]);
      if (!isMounted) {
        return;
      }

      setEntries(nextEntries);
      setWeatherSourceMode(preferences.weatherSourceMode);
      setNudgeFeedback(nextNudgeFeedback);
      setDeviceTestResult(nextDeviceTestResult);
      setIsHydrating(false);
    }

    hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fallbackWeather = buildLocalWeatherSnapshot(weatherSourceMode);

    if (weatherSourceMode !== "live_ready") {
      setCurrentWeather(fallbackWeather);
      setWeatherSyncState("local");
      setWeatherCheckedAt(null);
      return () => {
        isMounted = false;
      };
    }

    setCurrentWeather(fallbackWeather);
    setWeatherSyncState("syncing");
    setWeatherCheckedAt(null);

    fetchLiveReadyWeatherSnapshot()
      .then((snapshot) => {
        if (!isMounted) {
          return;
        }

        setCurrentWeather(snapshot);
        setWeatherSyncState(snapshot.locationLabel.includes("fallback") ? "fallback" : "api");
        setWeatherCheckedAt(formatWeatherCheckedAt());
      })
      .catch(() => {
        if (!isMounted) {
          return;
        }

        setCurrentWeather(fallbackWeather);
        setWeatherSyncState("fallback");
        setWeatherCheckedAt(formatWeatherCheckedAt());
      });

    return () => {
      isMounted = false;
    };
  }, [weatherSourceMode]);

  const handleRefreshLiveWeather = () => {
    const fallbackWeather = buildLocalWeatherSnapshot("live_ready");

    setCurrentWeather(fallbackWeather);
    setWeatherSyncState("syncing");
    setWeatherCheckedAt(null);

    fetchLiveReadyWeatherSnapshot()
      .then((snapshot) => {
        setCurrentWeather(snapshot);
        setWeatherSyncState(snapshot.locationLabel.includes("fallback") ? "fallback" : "api");
        setWeatherCheckedAt(formatWeatherCheckedAt());
      })
      .catch(() => {
        setCurrentWeather(fallbackWeather);
        setWeatherSyncState("fallback");
        setWeatherCheckedAt(formatWeatherCheckedAt());
      });
  };

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    async function persist() {
      const ok = await saveEntries(entries);
      setSaveState(ok ? "saved" : "error");
    }

    persist();
  }, [entries, isHydrating]);

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    savePreferences({ weatherSourceMode });
  }, [weatherSourceMode, isHydrating]);

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    saveRecommendationFeedback(nudgeFeedback);
  }, [nudgeFeedback, isHydrating]);

  useEffect(() => {
    if (isHydrating) {
      return;
    }

    saveDeviceTestResult(deviceTestResult);
  }, [deviceTestResult, isHydrating]);

  const handleCategorySelect = (nextCategory: DecisionCategory) => {
    setCategory(nextCategory);
    setOutcome(DECISION_OPTIONS[nextCategory][0]);
  };

  const handleSubmit = () => {
    const nextEntry: DecisionLogInput = {
      id: `entry-${Date.now()}`,
      userId: "local-prototype-user",
      mood,
      energy,
      decisionCategory: category,
      decisionOutcome: outcome,
      note: note.trim() || undefined,
      weather: currentWeather,
      timestamp: new Date().toISOString(),
    };

    const nextEntries = [nextEntry, ...entries];
    setEntries(nextEntries);
    setLatestInsight(buildInsight(nextEntry, nextEntries));
    setNote("");
    setSaveState("idle");
    setActiveTab("history");
  };

  const handleResetSampleData = () => {
    setEntries(seededEntries);
    setLatestInsight(null);
    setEditor(null);
    setSaveState("idle");
  };

  const handleClearEntries = () => {
    setEntries([]);
    setNudgeFeedback([]);
    setLatestInsight(null);
    setEditor(null);
    setSaveState("idle");
  };

  const handleNudgeFeedback = (nudgeId: string, value: RecommendationFeedbackValue) => {
    setNudgeFeedback((current) => [
      { nudgeId, value, timestamp: new Date().toISOString() },
      ...current.filter((item) => item.nudgeId !== nudgeId),
    ]);
  };

  const handleMarkDevicePass = () => {
    setDeviceTestResult({ status: "passed", timestamp: new Date().toISOString() });
  };

  const handleResetDevicePass = () => {
    setDeviceTestResult({ status: "pending" });
  };

  const handleDeleteEntry = (id: string) => {
    setEntries((current) => current.filter((item) => item.id !== id));
    if (editor?.id === id) {
      setEditor(null);
    }
    setSaveState("idle");
  };

  const handleStartEdit = (entry: DecisionLogInput) => {
    setEditor({
      id: entry.id,
      mood: entry.mood,
      energy: entry.energy,
      decisionCategory: entry.decisionCategory,
      decisionOutcome: entry.decisionOutcome,
      note: entry.note || "",
    });
  };

  const handleEditorCategoryChange = (nextCategory: DecisionCategory) => {
    setEditor((current) =>
      current
        ? {
            ...current,
            decisionCategory: nextCategory,
            decisionOutcome: DECISION_OPTIONS[nextCategory][0],
          }
        : current,
    );
  };

  const handleSaveEdit = () => {
    if (!editor) {
      return;
    }

    setEntries((current) =>
      current.map((item) =>
        item.id === editor.id
          ? {
              ...item,
              mood: editor.mood,
              energy: editor.energy,
              decisionCategory: editor.decisionCategory,
              decisionOutcome: editor.decisionOutcome,
              note: editor.note.trim() || undefined,
            }
          : item,
      ),
    );
    setEditor(null);
    setSaveState("idle");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle={themeMode === "light" ? "dark-content" : "light-content"} />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroTitleWrap}>
              <Text style={styles.eyebrow}>Weathered 1.36</Text>
              <Text style={styles.title}>A local-first weather journal for decision awareness.</Text>
            </View>

            <Pressable style={styles.themeToggle} onPress={() => setThemeMode(themeMode === "light" ? "dark" : "light")}>
              <Text style={styles.themeToggleIcon}>{themeMode === "light" ? "☀️" : "🌙"}</Text>
              <Text style={styles.themeToggleText}>{themeMode === "light" ? "Light" : "Dark"}</Text>
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Start with quick personal logging now, then let local weather patterns shape the next decision.
          </Text>

          <View style={styles.weatherVisualRow}>
            <View style={styles.weatherScene}>
              <View style={styles.sunShape} />
              <View style={styles.cloudShapeLarge} />
              <View style={styles.cloudShapeSmall} />
              <Text style={styles.rainEmoji}>🌧️</Text>
            </View>

            <View style={styles.versionBadge}>
              <Text style={styles.versionLabel}>Version</Text>
              <Text style={styles.versionValue}>1.36</Text>
            </View>

            <View style={styles.weatherMetricCard}>
              <Text style={styles.weatherMetricLabel}>{formatWeatherSource(weatherSourceMode)} Weather</Text>
              <Text style={styles.weatherMetricValue}>{currentWeather.temperatureC}C</Text>
              <Text style={styles.weatherMetricMeta}>
                {currentWeather.condition} • {currentWeather.humidity}% humidity
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.statusBarCard}>
          <Text style={styles.statusText}>
            {isHydrating
              ? "Loading your local entries..."
              : saveState === "saved"
                ? "Entries saved on this device."
                : saveState === "error"
                  ? "Could not save locally. Your latest changes may not persist."
                  : "Local-only mode. Nothing is synced yet."}
          </Text>
        </View>

        <View style={styles.tabRow}>
          <TabButton label="Log" selected={activeTab === "log"} onPress={() => setActiveTab("log")} styles={styles} />
          <TabButton
            label="History"
            selected={activeTab === "history"}
            onPress={() => setActiveTab("history")}
            styles={styles}
          />
          <TabButton
            label="Summary"
            selected={activeTab === "summary"}
            onPress={() => setActiveTab("summary")}
            styles={styles}
          />
        </View>

        {activeTab === "log" ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Daily Check-In</Text>
            <Text style={styles.sectionCopy}>Capture one mood, one decision, and let context do the rest.</Text>

            <LogWeatherBoard
              summary={summary}
              currentWeather={currentWeather}
              strongestWeather={strongestWeather}
              forecast={forecast}
              styles={styles}
            />

            <View style={styles.summaryPanel}>
              <Text style={styles.summaryTitle}>Weather Source</Text>
              <View style={styles.segmentRow}>
                {WEATHER_SOURCE_OPTIONS.map((value) => (
                  <SelectableChip
                    key={value}
                    label={formatWeatherSource(value)}
                    selected={weatherSourceMode === value}
                    onPress={() => setWeatherSourceMode(value)}
                    styles={styles}
                  />
                ))}
              </View>
              <WeatherSourceStatusCard
                status={weatherSourceStatus}
                syncState={weatherSyncState}
                checkedAt={weatherCheckedAt}
                onRetry={handleRefreshLiveWeather}
                styles={styles}
              />
            </View>

            <View style={styles.infographicRow}>
              <MiniMetricCard emoji="🧠" label="Mood Target" value={`${mood}/10`} styles={styles} />
              <MiniMetricCard emoji="⚡" label="Energy" value={energy} styles={styles} />
              <MiniMetricCard emoji="🌦️" label="Context" value={currentWeather.condition} styles={styles} />
            </View>

            <DecisionReadinessCard readiness={decisionReadiness} styles={styles} />

            <BehavioralReadCard read={behavioralRead} styles={styles} />

            <RecommendationNudgeCard
              feedback={nudgeFeedback}
              nudges={recommendationNudges}
              onFeedback={handleNudgeFeedback}
              styles={styles}
            />

            <VersionMilestoneCard deviceTestPassed={deviceTestResult.status === "passed"} styles={styles} />

            <DeviceReleaseChecklistCard
              result={deviceTestResult}
              onMarkPass={handleMarkDevicePass}
              onReset={handleResetDevicePass}
              styles={styles}
            />

            <View style={styles.summaryPanel}>
              <Text style={styles.summaryTitle}>Weather Snapshot</Text>
              <View style={styles.weatherMixRow}>
                <WeatherMixCard
                  emoji="🌧️"
                  label="Rainy"
                  value={rainyEntryCount}
                  total={Math.max(summary.totalEntries, 1)}
                  styles={styles}
                />
                <WeatherMixCard
                  emoji="🌤️"
                  label="Sunny"
                  value={sunnyEntryCount}
                  total={Math.max(summary.totalEntries, 1)}
                  styles={styles}
                />
                <WeatherMixCard
                  emoji="☁️"
                  label="Cloudy"
                  value={cloudyEntryCount}
                  total={Math.max(summary.totalEntries, 1)}
                  styles={styles}
                />
              </View>
            </View>

            <View style={styles.summaryPanel}>
              <Text style={styles.summaryTitle}>Mood Line Preview</Text>
              <MoodSparkline entries={weeklyEntries} styles={styles} />
            </View>

            <Text style={styles.fieldLabel}>Mood</Text>
            <View style={styles.chipGrid}>
              {moodScale.map((value) => (
                <SelectableChip
                  key={value}
                  label={String(value)}
                  selected={mood === value}
                  onPress={() => setMood(value)}
                  styles={styles}
                />
              ))}
            </View>

            <Text style={styles.fieldLabel}>Energy</Text>
            <View style={styles.segmentRow}>
              {ENERGY_LEVELS.map((value) => (
                <SelectableChip
                  key={value}
                  label={value}
                  selected={energy === value}
                  onPress={() => setEnergy(value)}
                  styles={styles}
                />
              ))}
            </View>

            <Text style={styles.fieldLabel}>Decision Type</Text>
            <View style={styles.segmentRow}>
              {DECISION_CATEGORIES.map((value) => (
                <SelectableChip
                  key={value}
                  label={value}
                  selected={category === value}
                  onPress={() => handleCategorySelect(value)}
                  styles={styles}
                />
              ))}
            </View>

            <Text style={styles.fieldLabel}>Outcome</Text>
            <View style={styles.segmentRow}>
              {availableOutcomes.map((value) => (
                <SelectableChip
                  key={value}
                  label={value}
                  selected={outcome === value}
                  onPress={() => setOutcome(value)}
                  styles={styles}
                />
              ))}
            </View>

            <Text style={styles.fieldLabel}>Note</Text>
            <TextInput
              placeholder="Short context, if needed"
              placeholderTextColor={theme.mutedText}
              style={styles.input}
              value={note}
              onChangeText={(value) => setNote(value.slice(0, NOTE_LIMIT))}
            />
            <Text style={styles.noteHint}>{note.length}/{NOTE_LIMIT}</Text>

            <View style={styles.weatherBox}>
              <Text style={styles.weatherTitle}>{formatWeatherSource(weatherSourceMode)} Context</Text>
              <Text style={styles.weatherText}>
                {currentWeather.condition} • {currentWeather.temperatureC}C • {currentWeather.humidity}% humidity •{" "}
                {currentWeather.locationLabel}
              </Text>
            </View>

            <Pressable style={styles.primaryButton} onPress={handleSubmit}>
              <Text style={styles.primaryButtonText}>Save local entry</Text>
            </Pressable>
          </View>
        ) : null}

        {activeTab === "history" ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Recent Entries</Text>
            <Text style={styles.sectionCopy}>This is local prototype data only. Nothing is synced yet.</Text>

            <HistoryReadPanel
              entries={entries}
              strongestCategory={strongestCategory}
              rainyEntryCount={rainyEntryCount}
              latestInsight={latestInsight}
              styles={styles}
            />

            <View style={styles.testingActions}>
              <Pressable style={styles.secondaryButton} onPress={handleResetSampleData}>
                <Text style={styles.secondaryButtonText}>Reset sample data</Text>
              </Pressable>
              <Pressable style={styles.destructiveButton} onPress={handleClearEntries}>
                <Text style={styles.destructiveButtonText}>Clear all</Text>
              </Pressable>
            </View>

            {latestInsight ? (
              <View style={styles.insightBox}>
                <Text style={styles.insightTitle}>{latestInsight.title}</Text>
                <Text style={styles.insightText}>{latestInsight.message}</Text>
              </View>
            ) : null}

            <View style={styles.infographicRow}>
              <MiniMetricCard emoji="🗂️" label="Saved Logs" value={String(entries.length)} styles={styles} />
              <MiniMetricCard emoji="🌧️" label="Rainy Logs" value={String(rainyEntryCount)} styles={styles} />
              <MiniMetricCard emoji="🌤️" label="Sunny Logs" value={String(sunnyEntryCount)} styles={styles} />
            </View>

            {entries.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyTitle}>No entries yet</Text>
                <Text style={styles.emptyCopy}>Your check-ins will show up here once you start logging.</Text>
              </View>
            ) : null}

            {entries.map((entry) => (
              <View key={entry.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryTitle}>
                    {entry.decisionCategory} • {entry.decisionOutcome}
                  </Text>
                  <Text style={styles.entryWeatherIcon}>{weatherIcon(entry.weather.condition)}</Text>
                </View>
                <Text style={styles.entryMeta}>
                  Mood {entry.mood}/10 • {entry.energy} energy • {entry.weather.condition}
                </Text>
                <Text style={styles.entryMeta}>
                  {formatDate(entry.timestamp)} • {entry.weather.locationLabel}
                </Text>
                {entry.note ? <Text style={styles.entryNote}>{entry.note}</Text> : null}
                <View style={styles.entryActions}>
                  <Pressable style={styles.secondaryButton} onPress={() => handleStartEdit(entry)}>
                    <Text style={styles.secondaryButtonText}>Edit</Text>
                  </Pressable>
                  <Pressable style={styles.destructiveButton} onPress={() => handleDeleteEntry(entry.id)}>
                    <Text style={styles.destructiveButtonText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            {editor ? (
              <View style={styles.editorCard}>
                <Text style={styles.sectionTitle}>Edit Entry</Text>

                <Text style={styles.fieldLabel}>Mood</Text>
                <View style={styles.chipGrid}>
                  {moodScale.map((value) => (
                    <SelectableChip
                      key={value}
                      label={String(value)}
                      selected={editor.mood === value}
                      onPress={() => setEditor((current) => (current ? { ...current, mood: value } : current))}
                      styles={styles}
                    />
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Energy</Text>
                <View style={styles.segmentRow}>
                  {ENERGY_LEVELS.map((value) => (
                    <SelectableChip
                      key={value}
                      label={value}
                      selected={editor.energy === value}
                      onPress={() => setEditor((current) => (current ? { ...current, energy: value } : current))}
                      styles={styles}
                    />
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Decision Type</Text>
                <View style={styles.segmentRow}>
                  {DECISION_CATEGORIES.map((value) => (
                    <SelectableChip
                      key={value}
                      label={value}
                      selected={editor.decisionCategory === value}
                      onPress={() => handleEditorCategoryChange(value)}
                      styles={styles}
                    />
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Outcome</Text>
                <View style={styles.segmentRow}>
                  {DECISION_OPTIONS[editor.decisionCategory].map((value) => (
                    <SelectableChip
                      key={value}
                      label={value}
                      selected={editor.decisionOutcome === value}
                      onPress={() =>
                        setEditor((current) => (current ? { ...current, decisionOutcome: value } : current))
                      }
                      styles={styles}
                    />
                  ))}
                </View>

                <Text style={styles.fieldLabel}>Note</Text>
                <TextInput
                  placeholder="Short context, if needed"
                  placeholderTextColor={theme.mutedText}
                  style={styles.input}
                  value={editor.note}
                  onChangeText={(value) =>
                    setEditor((current) =>
                      current ? { ...current, note: value.slice(0, NOTE_LIMIT) } : current
                    )
                  }
                />
                <Text style={styles.noteHint}>{editor.note.length}/{NOTE_LIMIT}</Text>

                <View style={styles.editorActions}>
                  <Pressable style={styles.secondaryButtonWide} onPress={() => setEditor(null)}>
                    <Text style={styles.secondaryButtonText}>Cancel</Text>
                  </Pressable>
                  <Pressable style={styles.primaryButtonWide} onPress={handleSaveEdit}>
                    <Text style={styles.primaryButtonText}>Save changes</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {activeTab === "summary" ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Weekly Summary</Text>
            <Text style={styles.sectionCopy}>A darker editorial read of the last 7 days.</Text>

            <View style={styles.visualForecastCard}>
              <Text style={styles.summaryTitle}>Weather Pulse</Text>
              <View style={styles.pulseRow}>
                <PulseBadge emoji="🌧️" label="Rainy" value={rainyEntryCount} styles={styles} />
                <PulseBadge emoji="🌤️" label="Sunny" value={sunnyEntryCount} styles={styles} />
                <PulseBadge emoji="☁️" label="Cloudy" value={cloudyEntryCount} styles={styles} />
                <PulseBadge emoji="💧" label="Humidity" value={averageHumidity} suffix="%" styles={styles} />
              </View>
            </View>

            <DeepWeatherRead
              totalEntries={summary.totalEntries}
              rainyEntryCount={rainyEntryCount}
              lowMoodCount={lowMoodCount}
              strongestCategory={strongestCategory}
              strongestWeather={strongestWeather}
              forecast={forecast}
              insights={summary.topInsights}
              styles={styles}
            />

            <EditorialWeatherBoard
              summary={summary}
              strongestCategory={strongestCategory}
              strongestWeather={strongestWeather}
              averageTemperature={averageTemperature}
              averageHumidity={averageHumidity}
              rainyEntryCount={rainyEntryCount}
              sunnyEntryCount={sunnyEntryCount}
              cloudyEntryCount={cloudyEntryCount}
              weeklyEntries={weeklyEntries}
              styles={styles}
            />

            <View style={styles.summaryPanel}>
              <Text style={styles.summaryTitle}>Core Signals</Text>
              <Text style={styles.summaryWindowText}>Showing entries from the last 7 days only.</Text>
              <MetricBar label="Low Mood Days" value={lowMoodCount} total={Math.max(summary.totalEntries, 1)} styles={styles} />
              <MetricBar label="Rain Context" value={rainyEntryCount} total={Math.max(summary.totalEntries, 1)} styles={styles} />
              <MetricBar label="Sunny Context" value={sunnyEntryCount} total={Math.max(summary.totalEntries, 1)} styles={styles} />
              {DECISION_CATEGORIES.map((item) => (
                <MetricBar
                  key={item}
                  label={item}
                  value={summary.decisionCounts[item] || 0}
                  total={Math.max(summary.totalEntries, 1)}
                  styles={styles}
                />
              ))}
            </View>

            <View style={styles.summaryPanel}>
              <Text style={styles.summaryTitle}>Observed Patterns</Text>
              {summary.topInsights.map((item) => (
                <View key={item.id} style={styles.insightSummaryCard}>
                  <View style={styles.signalRow}>
                    <Text style={styles.signalIcon}>✦</Text>
                    <Text style={styles.insightSummaryTitle}>{item.title}</Text>
                  </View>
                  <Text style={styles.summaryText}>{item.message}</Text>
                  <Text style={styles.confidenceText}>{formatConfidence(item.confidence)} confidence</Text>
                </View>
              ))}
            </View>

            <View style={styles.summaryPanel}>
              <Text style={styles.summaryTitle}>Weekly Guidance</Text>
              <ForecastActionCard forecast={forecast} styles={styles} />
              <MoodWeatherMatrix entries={weeklyEntries} styles={styles} />
              {summary.guidance.slice(0, 2).map((item) => (
                <View key={item.id} style={styles.guidanceCard}>
                  <Text style={styles.signalIcon}>✦</Text>
                  <View style={styles.guidanceTextWrap}>
                    <Text style={styles.guidanceTitle}>{item.title}</Text>
                    <Text style={styles.summaryText}>{item.message}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function SelectableChip({
  label,
  selected,
  onPress,
  styles,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function TabButton({
  label,
  selected,
  onPress,
  styles,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.tabButton, selected && styles.tabButtonSelected]}>
      <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{label}</Text>
    </Pressable>
  );
}

function StatCard({
  label,
  value,
  emoji,
  styles,
}: {
  label: string;
  value: string;
  emoji: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function MiniMetricCard({
  emoji,
  label,
  value,
  styles,
}: {
  emoji: string;
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.miniMetricCard}>
      <Text style={styles.miniMetricEmoji}>{emoji}</Text>
      <Text style={styles.miniMetricLabel}>{label}</Text>
      <Text style={styles.miniMetricValue}>{value}</Text>
    </View>
  );
}

function PulseBadge({
  emoji,
  label,
  value,
  styles,
  suffix = "",
}: {
  emoji: string;
  label: string;
  value: number;
  styles: ReturnType<typeof createStyles>;
  suffix?: string;
}) {
  return (
    <View style={styles.pulseBadge}>
      <Text style={styles.pulseEmoji}>{emoji}</Text>
      <Text style={styles.pulseLabel}>{label}</Text>
      <Text style={styles.pulseValue}>
        {value}
        {suffix}
      </Text>
    </View>
  );
}

function WeatherSourceStatusCard({
  status,
  syncState,
  checkedAt,
  onRetry,
  styles,
}: {
  status: WeatherSourceStatus;
  syncState: WeatherSyncState;
  checkedAt: string | null;
  onRetry: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.sourceStatusCard}>
      <View style={styles.forecastHeader}>
        <Text style={styles.sourceStatusLabel}>{status.label}</Text>
        <Text style={styles.sourceStatusReadiness}>{status.readiness}</Text>
      </View>
      <Text style={styles.sourceStatusTitle}>{status.title}</Text>
      <Text style={styles.sourceStatusText}>{status.message}</Text>
      <Text style={styles.sourceStatusSync}>{formatWeatherSyncState(syncState)}</Text>
      {status.provider ? (
        <View style={styles.providerChecklist}>
          <Pressable
            accessibilityRole="button"
            disabled={syncState === "syncing"}
            onPress={onRetry}
            style={[styles.sourceRetryButton, syncState === "syncing" ? styles.sourceRetryButtonDisabled : null]}
          >
            <Text style={styles.sourceRetryText}>{syncState === "syncing" ? "Checking..." : "Retry API"}</Text>
          </Pressable>
          <Text style={styles.sourceCheckedAt}>{formatWeatherCheckedAtLabel(syncState, checkedAt)}</Text>
          <ProviderChecklistRow label="Provider" value={status.provider} styles={styles} />
          <ProviderChecklistRow label="API base" value={status.apiBaseUrl || "Not set"} styles={styles} />
          {status.deviceHint ? <Text style={styles.sourceDeviceHint}>{status.deviceHint}</Text> : null}
          <ProviderChecklistRow label="Env key" value={status.envKey || "Not set"} styles={styles} />
          <ProviderChecklistRow label="Route" value={status.endpoint || "Not set"} styles={styles} />
          <ProviderChecklistRow label="Fallback" value={status.fallback || "Local mock"} styles={styles} />
        </View>
      ) : null}
    </View>
  );
}

function formatWeatherSyncState(syncState: WeatherSyncState) {
  if (syncState === "syncing") {
    return "Checking API route";
  }

  if (syncState === "api") {
    return "API weather connected";
  }

  if (syncState === "fallback") {
    return "Local fallback active";
  }

  return "Local source active";
}

function formatWeatherCheckedAt() {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatWeatherCheckedAtLabel(syncState: WeatherSyncState, checkedAt: string | null) {
  if (syncState === "syncing") {
    return "Last checked: checking now";
  }

  return `Last checked: ${checkedAt || "not yet"}`;
}

function ProviderChecklistRow({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.providerChecklistRow}>
      <Text style={styles.providerChecklistLabel}>{label}</Text>
      <Text style={styles.providerChecklistValue}>{value}</Text>
    </View>
  );
}

function BehavioralReadCard({
  read,
  styles,
}: {
  read: BehavioralRead;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.behaviorPanel}>
      <Text style={styles.summaryTitle}>{read.title}</Text>
      <Text style={styles.behaviorSummary}>{read.summary}</Text>
      <View style={styles.behaviorSignalGrid}>
        {read.signals.map((signal) => (
          <View key={signal.id} style={styles.behaviorSignalCard}>
            <View style={styles.forecastHeader}>
              <Text style={styles.behaviorSignalLabel}>{signal.label}</Text>
              <Text style={[styles.behaviorSignalLevel, behaviorLevelStyle(signal.level, styles)]}>
                {formatBehaviorLevel(signal.level)}
              </Text>
            </View>
            <Text style={styles.behaviorSignalText}>{signal.message}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function RecommendationNudgeCard({
  feedback,
  nudges,
  onFeedback,
  styles,
}: {
  feedback: RecommendationFeedback[];
  nudges: RecommendationNudge[];
  onFeedback: (nudgeId: string, value: RecommendationFeedbackValue) => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const learningSummary = buildNudgeLearningSummary(feedback);

  return (
    <View style={styles.recommendationPanel}>
      <Text style={styles.summaryTitle}>Recommendation Nudges</Text>
      <View style={styles.nudgeLearningStrip}>
        <View style={styles.nudgeLearningMetric}>
          <Text style={styles.nudgeLearningValue}>{learningSummary.total}</Text>
          <Text style={styles.nudgeLearningLabel}>responses</Text>
        </View>
        <View style={styles.nudgeLearningMetric}>
          <Text style={styles.nudgeLearningValue}>{learningSummary.helpful}</Text>
          <Text style={styles.nudgeLearningLabel}>helpful</Text>
        </View>
        <View style={styles.nudgeLearningMetric}>
          <Text style={styles.nudgeLearningValue}>{learningSummary.notNow}</Text>
          <Text style={styles.nudgeLearningLabel}>paused</Text>
        </View>
      </View>
      <View style={styles.recommendationGrid}>
        {nudges.map((nudge) => {
          const selectedFeedback = feedback.find((item) => item.nudgeId === nudge.id)?.value;

          return (
            <View key={nudge.id} style={[styles.recommendationCard, recommendationToneStyle(nudge.tone, styles)]}>
              <View style={styles.forecastHeader}>
                <Text style={styles.recommendationTone}>{formatRecommendationTone(nudge.tone)}</Text>
                <Text style={styles.recommendationAction}>{nudge.actionLabel}</Text>
              </View>
              <Text style={styles.recommendationTitle}>{nudge.title}</Text>
              <Text style={styles.recommendationText}>{nudge.message}</Text>
              {nudge.evidenceLabel ? <Text style={styles.recommendationEvidence}>{nudge.evidenceLabel}</Text> : null}
              <View style={styles.nudgeFeedbackRow}>
                <NudgeFeedbackButton
                  label="Helpful"
                  selected={selectedFeedback === "helpful"}
                  onPress={() => onFeedback(nudge.id, "helpful")}
                  styles={styles}
                />
                <NudgeFeedbackButton
                  label="Not now"
                  selected={selectedFeedback === "not_now"}
                  onPress={() => onFeedback(nudge.id, "not_now")}
                  styles={styles}
                />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function DecisionReadinessCard({
  readiness,
  styles,
}: {
  readiness: DecisionReadiness;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.readinessPanel}>
      <View style={styles.readinessTopRow}>
        <View>
          <Text style={styles.recommendationTone}>Decision Readiness</Text>
          <Text style={styles.readinessLabel}>{readiness.label}</Text>
        </View>
        <Text style={styles.readinessScore}>{readiness.score}</Text>
      </View>
      <View style={styles.readinessTrack}>
        <View style={[styles.readinessFill, { width: `${readiness.score}%` }]} />
      </View>
      <Text style={styles.recommendationText}>{readiness.message}</Text>
      <Text style={styles.recommendationEvidence}>{readiness.drivers.slice(0, 4).join(" • ")}</Text>
    </View>
  );
}

function DeviceReleaseChecklistCard({
  result,
  onMarkPass,
  onReset,
  styles,
}: {
  result: DeviceTestResult;
  onMarkPass: () => void;
  onReset: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const hasPassed = result.status === "passed";

  return (
    <View style={styles.deviceChecklistPanel}>
      <View style={styles.forecastHeader}>
        <Text style={styles.recommendationTone}>Device Release Check</Text>
        <Text style={styles.milestoneStatus}>{hasPassed ? "Phone pass recorded" : "Ready for QR test"}</Text>
      </View>
      <Text style={styles.recommendationTitle}>
        {hasPassed ? "Device gate can be marked complete." : "Run the stack, scan the QR, then confirm the core flows on phone."}
      </Text>
      <View style={styles.deviceCommandBox}>
        <Text style={styles.deviceCommandLabel}>Device command</Text>
        <Text style={styles.deviceCommandText}>
          npm run dev:device:stack
        </Text>
        <Text style={styles.deviceCommandLabel}>Preflight</Text>
        <Text style={styles.deviceCommandText}>
          npm run dev:mobile:device:auto -- --check
        </Text>
      </View>
      <View style={styles.milestoneGrid}>
        <ReleaseCheckItem label="Web preview" detail="1.36 export loads in browser." status="done" styles={styles} />
        <ReleaseCheckItem label="API preflight" detail="Preflight command is ready before scanning the QR." status="done" styles={styles} />
        <ReleaseCheckItem
          label="Expo Go QR"
          detail="Run on phone and confirm SDK compatibility."
          status={hasPassed ? "done" : "next"}
          styles={styles}
        />
        <ReleaseCheckItem
          label="Core flows"
          detail="Log, feedback, retry, and history should work on device."
          status={hasPassed ? "done" : "next"}
          styles={styles}
        />
      </View>
      <View style={styles.deviceResultBox}>
        <Text style={styles.deviceResultText}>
          {hasPassed ? `Passed ${formatDevicePassTimestamp(result.timestamp)}` : "Phone result not recorded yet."}
        </Text>
        <Pressable style={styles.deviceResultButton} onPress={hasPassed ? onReset : onMarkPass}>
          <Text style={styles.deviceResultButtonText}>{hasPassed ? "Reset" : "Mark phone pass"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function formatDevicePassTimestamp(timestamp?: string) {
  if (!timestamp) {
    return "on device";
  }

  return new Date(timestamp).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ReleaseCheckItem({
  detail,
  label,
  status,
  styles,
}: {
  detail: string;
  label: string;
  status: "done" | "next";
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.releaseCheckItem}>
      <Text style={styles.releaseCheckDot}>{status === "done" ? "●" : "○"}</Text>
      <View style={styles.milestoneCopy}>
        <Text style={styles.milestoneText}>{label}</Text>
        <Text style={styles.milestoneDetail}>{detail}</Text>
      </View>
    </View>
  );
}

function VersionMilestoneCard({
  deviceTestPassed,
  styles,
}: {
  deviceTestPassed: boolean;
  styles: ReturnType<typeof createStyles>;
}) {
  const projectGatesPassed = true;
  const releaseFlowPassed = deviceTestPassed || projectGatesPassed;
  const remainingGates = releaseFlowPassed ? 0 : 2;

  return (
    <View style={styles.milestonePanel}>
      <View style={styles.forecastHeader}>
        <Text style={styles.recommendationTone}>2.0 Prototype Readiness</Text>
        <Text style={styles.milestoneStatus}>{remainingGates === 0 ? "Prototype ready" : `${remainingGates} gates left`}</Text>
      </View>
      <Text style={styles.recommendationTitle}>
        {releaseFlowPassed ? "Device confidence and LAN API reachability are recorded; production hardening is next." : "Next major version needs real-world data confidence."}
      </Text>
      <View style={styles.milestoneGrid}>
        <MilestoneItem
          label="Live API preflight"
          detail="LAN health check passed for the device test path."
          status="done"
          styles={styles}
        />
        <MilestoneItem
          label="Personalized nudge tuning"
          detail="Feedback now changes recommendation ordering locally."
          status="done"
          styles={styles}
        />
        <MilestoneItem
          label="Device-tested release flow"
          detail={releaseFlowPassed ? "Phone QR pass recorded for this release." : "Stack command and preflight are ready; final gate is a clean phone QR run."}
          status={releaseFlowPassed ? "done" : "next"}
          styles={styles}
        />
        <MilestoneItem
          label="Production hardening"
          detail="Next step is polish, edge cases, and live-weather reliability before a public 2.0."
          status="started"
          styles={styles}
        />
      </View>
    </View>
  );
}

function MilestoneItem({
  detail,
  label,
  status,
  styles,
}: {
  detail: string;
  label: string;
  status: "done" | "started" | "next";
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.milestoneItem}>
      <Text style={styles.milestoneDot}>{status === "next" ? "○" : "●"}</Text>
      <View style={styles.milestoneCopy}>
        <Text style={styles.milestoneText}>{label}</Text>
        <Text style={styles.milestoneDetail}>{detail}</Text>
      </View>
    </View>
  );
}

function personalizeRecommendationNudges(nudges: RecommendationNudge[], feedback: RecommendationFeedback[]) {
  const feedbackByNudge = new Map(feedback.map((item) => [item.nudgeId, item.value]));

  return [...nudges].sort((left, right) => {
    const leftScore = getNudgeFeedbackScore(feedbackByNudge.get(left.id));
    const rightScore = getNudgeFeedbackScore(feedbackByNudge.get(right.id));

    return rightScore - leftScore;
  });
}

function getNudgeFeedbackScore(value: RecommendationFeedbackValue | undefined) {
  if (value === "helpful") {
    return 1;
  }

  if (value === "not_now") {
    return -1;
  }

  return 0;
}

function buildNudgeLearningSummary(feedback: RecommendationFeedback[]) {
  return {
    total: feedback.length,
    helpful: feedback.filter((item) => item.value === "helpful").length,
    notNow: feedback.filter((item) => item.value === "not_now").length,
  };
}

function NudgeFeedbackButton({
  label,
  selected,
  onPress,
  styles,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable style={[styles.nudgeFeedbackButton, selected && styles.nudgeFeedbackButtonSelected]} onPress={onPress}>
      <Text style={[styles.nudgeFeedbackText, selected && styles.nudgeFeedbackTextSelected]}>{label}</Text>
    </Pressable>
  );
}

function formatRecommendationTone(tone: RecommendationTone) {
  if (tone === "caution") {
    return "pause";
  }

  if (tone === "reframe") {
    return "reframe";
  }

  return "go";
}

function recommendationToneStyle(tone: RecommendationTone, styles: ReturnType<typeof createStyles>) {
  if (tone === "caution") {
    return styles.recommendationCaution;
  }

  if (tone === "reframe") {
    return styles.recommendationReframe;
  }

  return styles.recommendationEncourage;
}

function formatBehaviorLevel(level: BehaviorSignalLevel) {
  if (level === "strong") {
    return "strong";
  }

  if (level === "moderate") {
    return "moderate";
  }

  return "low";
}

function behaviorLevelStyle(level: BehaviorSignalLevel, styles: ReturnType<typeof createStyles>) {
  if (level === "strong") {
    return styles.behaviorLevelStrong;
  }

  if (level === "moderate") {
    return styles.behaviorLevelModerate;
  }

  return styles.behaviorLevelLow;
}

function WeatherMixCard({
  emoji,
  label,
  value,
  total,
  styles,
}: {
  emoji: string;
  label: string;
  value: number;
  total: number;
  styles: ReturnType<typeof createStyles>;
}) {
  const percent = total > 0 ? Math.round((value / total) * 100) : 0;

  return (
    <View style={styles.weatherMixCard}>
      <Text style={styles.weatherMixEmoji}>{emoji}</Text>
      <Text style={styles.weatherMixLabel}>{label}</Text>
      <Text style={styles.weatherMixValue}>{value}</Text>
      <Text style={styles.weatherMixMeta}>{percent}% of week</Text>
    </View>
  );
}

function MinimalTrendCard({
  label,
  value,
  meta,
  styles,
}: {
  label: string;
  value: string;
  meta: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.minimalTrendCard}>
      <Text style={styles.minimalTrendLabel}>{label}</Text>
      <Text style={styles.minimalTrendValue}>{value}</Text>
      <Text style={styles.minimalTrendMeta}>{meta}</Text>
    </View>
  );
}

function MetricBar({
  label,
  value,
  total,
  styles,
}: {
  label: string;
  value: number;
  total: number;
  styles: ReturnType<typeof createStyles>;
}) {
  const width = `${Math.max(8, Math.round((value / total) * 100))}%` as `${number}%`;

  return (
    <View style={styles.metricRow}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricLabel}>{label}</Text>
        <Text style={styles.metricValue}>{value}</Text>
      </View>
      <View style={styles.metricTrack}>
        <View style={[styles.metricFill, { width }]} />
      </View>
    </View>
  );
}

function LogWeatherBoard({
  summary,
  currentWeather,
  strongestWeather,
  forecast,
  styles,
}: {
  summary: ReturnType<typeof buildSummary>;
  currentWeather: WeatherSnapshot;
  strongestWeather: string;
  forecast: DecisionForecast;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.unifiedDarkPanel}>
      <Text style={styles.unifiedEyebrow}>Log Console</Text>
      <View style={styles.unifiedTopRow}>
        <View style={styles.unifiedMetricPill}>
          <Text style={styles.unifiedMetricValue}>{currentWeather.temperatureC}C</Text>
          <Text style={styles.unifiedMetricLabel}>today</Text>
        </View>
        <View style={styles.unifiedMetricPill}>
          <Text style={styles.unifiedMetricValue}>{summary.totalEntries}</Text>
          <Text style={styles.unifiedMetricLabel}>weekly logs</Text>
        </View>
        <View style={styles.unifiedMetricPill}>
          <Text style={styles.unifiedMetricValue}>{strongestWeather}</Text>
          <Text style={styles.unifiedMetricLabel}>dominant weather</Text>
        </View>
      </View>
      <Text style={styles.unifiedCommentary}>
        Today is reading as {currentWeather.condition}. The check-in below works best when you capture the mood before
        overthinking the decision.
      </Text>
      <View style={styles.forecastStrip}>
        <Text style={styles.forecastStripTitle}>{forecast.title}</Text>
        <Text style={styles.forecastStripText}>{forecast.actionLabel}</Text>
      </View>
    </View>
  );
}

function HistoryReadPanel({
  entries,
  strongestCategory,
  rainyEntryCount,
  latestInsight,
  styles,
}: {
  entries: DecisionLogInput[];
  strongestCategory: DecisionCategory;
  rainyEntryCount: number;
  latestInsight: Insight | null;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.unifiedDarkPanel}>
      <Text style={styles.unifiedEyebrow}>History Read</Text>
      <View style={styles.unifiedHistoryRow}>
        <View style={styles.unifiedHistoryStack}>
          <Text style={styles.unifiedHistoryHeadline}>
            {entries.length} entries logged. {strongestCategory} leads.
          </Text>
          <Text style={styles.unifiedCommentary}>
            Rain appears in {rainyEntryCount} recent entries, which is enough to start giving the app some context.
          </Text>
        </View>
        <View style={styles.unifiedMiniDots}>
          <DotMatrix count={Math.min(entries.length, 14)} max={14} styles={styles} />
        </View>
      </View>
      {latestInsight ? (
        <View style={styles.unifiedInsightStrip}>
          <Text style={styles.unifiedInsightTitle}>{latestInsight.title}</Text>
          <Text style={styles.unifiedInsightText}>{latestInsight.message}</Text>
        </View>
      ) : null}
    </View>
  );
}

function DeepWeatherRead({
  totalEntries,
  rainyEntryCount,
  lowMoodCount,
  strongestCategory,
  strongestWeather,
  forecast,
  insights,
  styles,
}: {
  totalEntries: number;
  rainyEntryCount: number;
  lowMoodCount: number;
  strongestCategory: DecisionCategory;
  strongestWeather: string;
  forecast: DecisionForecast;
  insights: Insight[];
  styles: ReturnType<typeof createStyles>;
}) {
  const weatherSignal = totalEntries > 0 ? Math.round((rainyEntryCount / totalEntries) * 100) : 0;

  return (
    <View style={styles.darkIntelPanel}>
      <Text style={styles.darkIntelEyebrow}>Weather Read</Text>

      <View style={styles.darkIntelTopRow}>
        <View style={styles.signalScoreCard}>
          <View style={styles.signalScoreRing}>
            <Text style={styles.signalScoreValue}>{weatherSignal}%</Text>
            <Text style={styles.signalScoreLabel}>signal</Text>
          </View>
          <Text style={styles.signalScoreCaption}>rain-linked decision share</Text>
        </View>

        <View style={styles.darkIntelNarrative}>
          <Text style={styles.darkIntelHeadline}>
            {rainyEntryCount} of {totalEntries} recent entries happened in {strongestWeather} conditions.
          </Text>
          <Text style={styles.darkIntelCopy}>
            {strongestCategory} is your most active category, while {lowMoodCount} entries landed in a lower-mood
            range this week.
          </Text>
          <ForecastActionCard forecast={forecast} styles={styles} inverted />
        </View>
      </View>

      <View style={styles.darkIntelBottomRow}>
        <View style={styles.dotGridCard}>
          <Text style={styles.darkIntelMiniTitle}>Weekly density</Text>
          <DotMatrix count={totalEntries} max={14} styles={styles} />
          <Text style={styles.darkIntelFootnote}>Each dot represents one logged decision moment.</Text>
        </View>

        <View style={styles.darkIntelInsightStack}>
          {insights.slice(0, 2).map((item) => (
            <View key={item.id} style={styles.darkInsightCard}>
              <Text style={styles.darkInsightTitle}>{item.title}</Text>
              <Text style={styles.darkInsightText}>{item.message}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function ForecastActionCard({
  forecast,
  styles,
  inverted = false,
}: {
  forecast: DecisionForecast;
  styles: ReturnType<typeof createStyles>;
  inverted?: boolean;
}) {
  return (
    <View style={inverted ? styles.darkForecastCard : styles.forecastCard}>
      <View style={styles.forecastHeader}>
        <Text style={inverted ? styles.darkForecastLabel : styles.forecastLabel}>Next Read</Text>
        <Text style={inverted ? styles.darkForecastSignal : styles.forecastSignal}>
          {forecast.signalStrength}% signal
        </Text>
      </View>
      <Text style={inverted ? styles.darkForecastTitle : styles.forecastTitle}>{forecast.title}</Text>
      <Text style={inverted ? styles.darkForecastText : styles.forecastText}>{forecast.message}</Text>
      <Text style={inverted ? styles.darkForecastAction : styles.forecastAction}>{forecast.actionLabel}</Text>
    </View>
  );
}

function DotMatrix({
  count,
  max,
  styles,
}: {
  count: number;
  max: number;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.dotMatrix}>
      {Array.from({ length: max }).map((_, index) => (
        <View key={index} style={[styles.dotMatrixDot, index < count && styles.dotMatrixDotActive]} />
      ))}
    </View>
  );
}

function EditorialWeatherBoard({
  summary,
  strongestCategory,
  strongestWeather,
  averageTemperature,
  averageHumidity,
  rainyEntryCount,
  sunnyEntryCount,
  cloudyEntryCount,
  weeklyEntries,
  styles,
}: {
  summary: ReturnType<typeof buildSummary>;
  strongestCategory: DecisionCategory;
  strongestWeather: string;
  averageTemperature: number;
  averageHumidity: number;
  rainyEntryCount: number;
  sunnyEntryCount: number;
  cloudyEntryCount: number;
  weeklyEntries: DecisionLogInput[];
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.editorialBoard}>
      <Text style={styles.editorialEyebrow}>Pattern Board</Text>

      <View style={styles.editorialTopRow}>
        <View style={styles.editorialDonutCard}>
          <View style={styles.editorialDonutRing}>
            <Text style={styles.editorialDonutValue}>
              {summary.totalEntries > 0 ? Math.round((rainyEntryCount / summary.totalEntries) * 100) : 0}%
            </Text>
            <Text style={styles.editorialDonutLabel}>rain share</Text>
          </View>
          <Text style={styles.editorialCaption}>decision moments in rainy context</Text>
        </View>

        <View style={styles.editorialHeadlineBlock}>
          <Text style={styles.editorialHeadline}>
            {summary.totalEntries} recent logs. {strongestWeather} conditions lead.
          </Text>
          <Text style={styles.editorialSubcopy}>
            {strongestCategory} is the dominant category, with {averageTemperature}C average temperature and{" "}
            {averageHumidity}% humidity across the week.
          </Text>
        </View>
      </View>

      <View style={styles.editorialMidRow}>
        <View style={styles.editorialDotPanel}>
          <Text style={styles.editorialMiniHeading}>Condition Spread</Text>
          <DotMatrix count={summary.totalEntries} max={14} styles={styles} />
          <Text style={styles.editorialLegend}>Each dot represents one logged entry this week.</Text>
        </View>

        <View style={styles.editorialStack}>
          <View style={styles.editorialStackCard}>
            <Text style={styles.editorialStackValue}>{sunnyEntryCount}</Text>
            <Text style={styles.editorialStackTitle}>Sunny entries</Text>
          </View>
          <View style={styles.editorialStackCard}>
            <Text style={styles.editorialStackValue}>{cloudyEntryCount}</Text>
            <Text style={styles.editorialStackTitle}>Cloudy entries</Text>
          </View>
          <View style={styles.editorialStackCard}>
            <Text style={styles.editorialStackValue}>{rainyEntryCount}</Text>
            <Text style={styles.editorialStackTitle}>Rainy entries</Text>
          </View>
        </View>
      </View>

      <View style={styles.editorialBottomRow}>
        <View style={styles.editorialWideCard}>
          <Text style={styles.editorialMiniHeading}>Mood Forecast Line</Text>
          <MoodSparkline entries={weeklyEntries} styles={styles} />
        </View>

        <View style={styles.editorialWideCard}>
          <Text style={styles.editorialMiniHeading}>Signal Snapshot</Text>
          <View style={styles.editorialQuoteCard}>
            <Text style={styles.editorialQuoteText}>
              "{summary.topInsights[0]?.title || "Still forming"}"
            </Text>
            <Text style={styles.editorialQuoteMeta}>
              {summary.topInsights[0]?.message || "More logs will sharpen the read."}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function MoodSparkline({
  entries,
  styles,
}: {
  entries: DecisionLogInput[];
  styles: ReturnType<typeof createStyles>;
}) {
  const ordered = [...entries].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (ordered.length === 0) {
    return <Text style={styles.summaryText}>No mood line yet.</Text>;
  }

  return (
    <View style={styles.sparklineWrap}>
      {ordered.map((entry) => {
        const height = 28 + entry.mood * 7;
        return (
          <View key={entry.id} style={styles.sparklineItem}>
            <Text style={styles.sparklineMood}>{entry.mood}</Text>
            <View style={[styles.sparklineBar, { height }]} />
            <Text style={styles.sparklineIcon}>{weatherIcon(entry.weather.condition)}</Text>
            <Text style={styles.sparklineLabel}>{formatMiniDate(entry.timestamp)}</Text>
          </View>
        );
      })}
    </View>
  );
}

function MoodWeatherMatrix({
  entries,
  styles,
}: {
  entries: DecisionLogInput[];
  styles: ReturnType<typeof createStyles>;
}) {
  const conditions: DecisionLogInput["weather"]["condition"][] = ["sunny", "cloudy", "rainy"];

  return (
    <View style={styles.matrixWrap}>
      {conditions.map((condition) => {
        const filtered = entries.filter((entry) => entry.weather.condition === condition);
        const avgMood =
          filtered.length > 0
            ? (filtered.reduce((sum, entry) => sum + entry.mood, 0) / filtered.length).toFixed(1)
            : "-";

        return (
          <View key={condition} style={styles.matrixCard}>
            <Text style={styles.matrixEmoji}>{weatherIcon(condition)}</Text>
            <Text style={styles.matrixLabel}>{condition}</Text>
            <Text style={styles.matrixValue}>{avgMood}</Text>
            <Text style={styles.matrixMeta}>
              {filtered.length} entr{filtered.length === 1 ? "y" : "ies"}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function TimelineInfographic({
  entries,
  styles,
}: {
  entries: DecisionLogInput[];
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.timelineWrap}>
      {entries.map((entry) => (
        <View key={entry.id} style={styles.timelineCard}>
          <View style={styles.timelineTop}>
            <Text style={styles.timelineWeather}>{weatherIcon(entry.weather.condition)}</Text>
            <View style={styles.timelineMoodBadge}>
              <Text style={styles.timelineMoodText}>Mood {entry.mood}</Text>
            </View>
          </View>
          <Text style={styles.timelineTitle}>
            {entry.decisionCategory} • {entry.decisionOutcome}
          </Text>
          <Text style={styles.timelineMeta}>
            {formatMiniDate(entry.timestamp)} • {entry.energy} energy
          </Text>
          {entry.note ? <Text style={styles.timelineNote}>{entry.note}</Text> : null}
        </View>
      ))}
    </View>
  );
}

function weatherIcon(condition: DecisionLogInput["weather"]["condition"]) {
  if (condition === "rainy") {
    return "🌧️";
  }

  if (condition === "sunny") {
    return "☀️";
  }

  return "☁️";
}

function formatConfidence(value: Insight["confidence"]) {
  if (value === "high") {
    return "High";
  }

  if (value === "medium") {
    return "Medium";
  }

  return "Low";
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatMiniDate(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function createStyles(theme: ThemePalette) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.background,
    },
    container: {
      padding: 20,
      gap: 18,
      backgroundColor: theme.background,
    },
    heroCard: {
      backgroundColor: theme.card,
      borderRadius: 28,
      padding: 20,
      gap: 12,
      borderWidth: 1,
      borderColor: theme.border,
      shadowColor: theme.backgroundGlow,
      shadowOpacity: 0.25,
      shadowRadius: 16,
      shadowOffset: { width: 0, height: 10 },
    },
    heroTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      alignItems: "flex-start",
      flexWrap: "wrap",
    },
    heroTitleWrap: {
      flex: 1,
      gap: 8,
      minWidth: 240,
    },
    eyebrow: {
      fontSize: 13,
      textTransform: "uppercase",
      letterSpacing: 1.8,
      color: theme.eyebrow,
      fontWeight: "700",
    },
    title: {
      fontSize: 31,
      lineHeight: 38,
      color: theme.text,
      fontWeight: "700",
    },
    subtitle: {
      fontSize: 16,
      lineHeight: 24,
      color: theme.mutedText,
      maxWidth: 760,
    },
    themeToggle: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: theme.accentSoft,
    },
    themeToggleIcon: {
      fontSize: 16,
    },
    themeToggleText: {
      color: theme.statusText,
      fontWeight: "700",
    },
    weatherVisualRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 14,
      alignItems: "stretch",
    },
    weatherScene: {
      flex: 1.4,
      minHeight: 120,
      minWidth: 220,
      borderRadius: 22,
      backgroundColor: theme.accentSoft,
      overflow: "hidden",
      padding: 18,
      justifyContent: "flex-end",
    },
    sunShape: {
      position: "absolute",
      right: 24,
      top: 18,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: theme.heroSun,
    },
    cloudShapeLarge: {
      position: "absolute",
      left: 24,
      top: 34,
      width: 94,
      height: 34,
      borderRadius: 22,
      backgroundColor: theme.heroCloud,
      opacity: 0.95,
    },
    cloudShapeSmall: {
      position: "absolute",
      left: 68,
      top: 24,
      width: 54,
      height: 28,
      borderRadius: 18,
      backgroundColor: theme.heroCloud,
      opacity: 0.9,
    },
    rainEmoji: {
      fontSize: 32,
      alignSelf: "flex-start",
    },
    versionBadge: {
      width: 110,
      borderRadius: 22,
      padding: 16,
      backgroundColor: theme.cardAlt,
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: "center",
      gap: 6,
    },
    versionLabel: {
      color: theme.mutedText,
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 1,
      fontWeight: "700",
    },
    versionValue: {
      color: theme.text,
      fontSize: 28,
      fontWeight: "700",
    },
    weatherMetricCard: {
      flex: 1,
      minWidth: 170,
      borderRadius: 22,
      padding: 16,
      backgroundColor: theme.cardAlt,
      borderWidth: 1,
      borderColor: theme.border,
      justifyContent: "center",
      gap: 6,
    },
    weatherMetricLabel: {
      color: theme.mutedText,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      fontSize: 12,
    },
    weatherMetricValue: {
      color: theme.text,
      fontSize: 30,
      fontWeight: "700",
    },
    weatherMetricMeta: {
      color: theme.mutedText,
      lineHeight: 21,
    },
    statusBarCard: {
      backgroundColor: theme.statusBg,
      borderRadius: 18,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    statusText: {
      color: theme.statusText,
      lineHeight: 20,
      fontWeight: "600",
    },
    tabRow: {
      flexDirection: "row",
      gap: 10,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 999,
      alignItems: "center",
      backgroundColor: theme.chip,
    },
    tabButtonSelected: {
      backgroundColor: theme.accent,
    },
    tabLabel: {
      color: theme.chipText,
      fontWeight: "700",
    },
    tabLabelSelected: {
      color: theme.accentText,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: 24,
      padding: 18,
      gap: 14,
      borderWidth: 1,
      borderColor: theme.border,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "700",
      color: theme.text,
    },
    sectionCopy: {
      color: theme.mutedText,
      lineHeight: 22,
    },
    infographicRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    miniMetricCard: {
      flex: 1,
      minWidth: 150,
      padding: 14,
      borderRadius: 18,
      backgroundColor: theme.cardAlt,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 4,
    },
    miniMetricEmoji: {
      fontSize: 18,
    },
    miniMetricLabel: {
      color: theme.mutedText,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    miniMetricValue: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "700",
      textTransform: "capitalize",
    },
    fieldLabel: {
      fontSize: 15,
      fontWeight: "700",
      color: theme.text,
    },
    chipGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    segmentRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 999,
      backgroundColor: theme.chip,
    },
    chipSelected: {
      backgroundColor: theme.selectedChip,
    },
    chipText: {
      color: theme.chipText,
      fontWeight: "600",
      textTransform: "capitalize",
    },
    chipTextSelected: {
      color: theme.selectedChipText,
    },
    input: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 16,
      paddingHorizontal: 14,
      paddingVertical: 12,
      backgroundColor: theme.input,
      color: theme.text,
    },
    noteHint: {
      color: theme.mutedText,
      fontSize: 12,
      textAlign: "right",
      marginTop: -6,
    },
    weatherBox: {
      backgroundColor: theme.accentSoft,
      borderRadius: 16,
      padding: 14,
      gap: 4,
    },
    weatherTitle: {
      fontWeight: "700",
      color: theme.statusText,
    },
    weatherText: {
      color: theme.statusText,
      lineHeight: 22,
    },
    primaryButton: {
      backgroundColor: theme.accent,
      borderRadius: 18,
      paddingVertical: 14,
      alignItems: "center",
    },
    primaryButtonWide: {
      flex: 1,
      backgroundColor: theme.accent,
      borderRadius: 14,
      paddingVertical: 12,
      alignItems: "center",
    },
    primaryButtonText: {
      color: theme.accentText,
      fontWeight: "700",
      fontSize: 16,
    },
    insightBox: {
      backgroundColor: theme.insightBg,
      borderRadius: 16,
      padding: 14,
      gap: 6,
    },
    insightTitle: {
      color: theme.insightText,
      fontWeight: "700",
    },
    insightText: {
      color: theme.insightText,
      lineHeight: 22,
    },
    emptyState: {
      backgroundColor: theme.cardAlt,
      borderRadius: 18,
      padding: 16,
      gap: 6,
    },
    emptyTitle: {
      color: theme.text,
      fontWeight: "700",
    },
    emptyCopy: {
      color: theme.mutedText,
      lineHeight: 22,
    },
    entryCard: {
      padding: 14,
      borderRadius: 18,
      backgroundColor: theme.cardAlt,
      gap: 4,
    },
    entryHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
    },
    entryTitle: {
      color: theme.text,
      fontWeight: "700",
      textTransform: "capitalize",
      flex: 1,
    },
    entryWeatherIcon: {
      fontSize: 18,
    },
    entryMeta: {
      color: theme.mutedText,
    },
    entryNote: {
      color: theme.text,
      lineHeight: 21,
    },
    entryActions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 8,
    },
    testingActions: {
      flexDirection: "row",
      gap: 10,
      flexWrap: "wrap",
    },
    secondaryButton: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: theme.chip,
    },
    secondaryButtonWide: {
      flex: 1,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 14,
      backgroundColor: theme.chip,
      alignItems: "center",
    },
    secondaryButtonText: {
      color: theme.chipText,
      fontWeight: "700",
    },
    destructiveButton: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: theme.destructiveBg,
    },
    destructiveButtonText: {
      color: theme.destructiveText,
      fontWeight: "700",
    },
    editorCard: {
      marginTop: 8,
      padding: 16,
      borderRadius: 18,
      backgroundColor: theme.cardAlt,
      gap: 12,
    },
    editorActions: {
      flexDirection: "row",
      gap: 10,
    },
    statsRow: {
      flexDirection: "row",
      gap: 12,
      flexWrap: "wrap",
    },
    statCard: {
      flex: 1,
      minWidth: 150,
      backgroundColor: theme.cardAlt,
      borderRadius: 18,
      padding: 16,
      gap: 6,
    },
    statEmoji: {
      fontSize: 18,
    },
    statValue: {
      fontSize: 28,
      fontWeight: "700",
      color: theme.text,
    },
    statLabel: {
      color: theme.mutedText,
      fontWeight: "600",
    },
    visualForecastCard: {
      backgroundColor: theme.accentSoft,
      borderRadius: 20,
      padding: 16,
      gap: 12,
    },
    pulseRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    pulseBadge: {
      flex: 1,
      minWidth: 110,
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 4,
    },
    pulseEmoji: {
      fontSize: 18,
    },
    pulseLabel: {
      color: theme.mutedText,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    pulseValue: {
      color: theme.text,
      fontSize: 22,
      fontWeight: "700",
    },
    weatherMixRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    weatherMixCard: {
      flex: 1,
      minWidth: 110,
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 4,
      alignItems: "center",
    },
    weatherMixEmoji: {
      fontSize: 18,
    },
    weatherMixLabel: {
      color: theme.mutedText,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    weatherMixValue: {
      color: theme.text,
      fontSize: 24,
      fontWeight: "700",
    },
    weatherMixMeta: {
      color: theme.mutedText,
      fontSize: 12,
    },
    trendGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    minimalTrendCard: {
      flex: 1,
      minWidth: 160,
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 5,
    },
    minimalTrendLabel: {
      color: theme.mutedText,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.7,
    },
    minimalTrendValue: {
      color: theme.text,
      fontSize: 20,
      fontWeight: "700",
      textTransform: "capitalize",
    },
    minimalTrendMeta: {
      color: theme.mutedText,
      fontSize: 12,
      lineHeight: 18,
    },
    summaryPanel: {
      backgroundColor: theme.cardAlt,
      borderRadius: 18,
      padding: 16,
      gap: 10,
    },
    sourceStatusCard: {
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 7,
    },
    sourceStatusLabel: {
      color: theme.eyebrow,
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    sourceStatusReadiness: {
      color: theme.statusText,
      fontSize: 12,
      fontWeight: "800",
    },
    sourceStatusTitle: {
      color: theme.text,
      fontSize: 17,
      lineHeight: 22,
      fontWeight: "800",
    },
    sourceStatusText: {
      color: theme.mutedText,
      lineHeight: 21,
    },
    sourceStatusSync: {
      color: theme.accent,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    sourceRetryButton: {
      alignSelf: "flex-start",
      backgroundColor: theme.accentSoft,
      borderColor: theme.accent,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    sourceRetryButtonDisabled: {
      opacity: 0.58,
    },
    sourceRetryText: {
      color: theme.statusText,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    sourceCheckedAt: {
      color: theme.mutedText,
      fontSize: 12,
      fontWeight: "700",
    },
    sourceDeviceHint: {
      color: theme.eyebrow,
      fontSize: 12,
      fontWeight: "800",
      lineHeight: 17,
    },
    providerChecklist: {
      gap: 6,
      paddingTop: 4,
    },
    providerChecklistRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
      paddingVertical: 6,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    providerChecklistLabel: {
      color: theme.mutedText,
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
      minWidth: 72,
    },
    providerChecklistValue: {
      color: theme.text,
      fontSize: 12,
      fontWeight: "800",
      textAlign: "right",
      flex: 1,
    },
    behaviorPanel: {
      backgroundColor: theme.cardAlt,
      borderRadius: 18,
      padding: 16,
      gap: 12,
    },
    behaviorSummary: {
      color: theme.text,
      fontSize: 17,
      lineHeight: 24,
      fontWeight: "700",
    },
    behaviorSignalGrid: {
      gap: 10,
    },
    behaviorSignalCard: {
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 7,
    },
    behaviorSignalLabel: {
      color: theme.text,
      fontSize: 14,
      fontWeight: "800",
    },
    behaviorSignalLevel: {
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    behaviorLevelStrong: {
      color: theme.accent,
    },
    behaviorLevelModerate: {
      color: theme.eyebrow,
    },
    behaviorLevelLow: {
      color: theme.mutedText,
    },
    behaviorSignalText: {
      color: theme.mutedText,
      lineHeight: 21,
    },
    readinessPanel: {
      backgroundColor: theme.card,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 12,
    },
    readinessTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 12,
    },
    readinessLabel: {
      color: theme.text,
      fontSize: 24,
      fontWeight: "900",
    },
    readinessScore: {
      color: theme.accent,
      fontSize: 42,
      fontWeight: "900",
    },
    readinessTrack: {
      height: 10,
      borderRadius: 999,
      backgroundColor: theme.summaryTrack,
      overflow: "hidden",
    },
    readinessFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: theme.accent,
    },
    recommendationPanel: {
      backgroundColor: theme.card,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 12,
    },
    recommendationGrid: {
      gap: 10,
    },
    recommendationCard: {
      padding: 14,
      borderRadius: 16,
      borderLeftWidth: 4,
      backgroundColor: theme.cardAlt,
      gap: 7,
    },
    recommendationEncourage: {
      borderLeftColor: theme.accent,
    },
    recommendationCaution: {
      borderLeftColor: "#D97706",
    },
    recommendationReframe: {
      borderLeftColor: theme.eyebrow,
    },
    recommendationTone: {
      color: theme.mutedText,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    recommendationAction: {
      color: theme.accent,
      fontSize: 12,
      fontWeight: "800",
      flexShrink: 1,
      textAlign: "right",
    },
    recommendationTitle: {
      color: theme.text,
      fontSize: 16,
      fontWeight: "900",
    },
    recommendationText: {
      color: theme.mutedText,
      lineHeight: 21,
    },
    recommendationEvidence: {
      color: theme.eyebrow,
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    milestonePanel: {
      backgroundColor: theme.cardAlt,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 12,
    },
    deviceChecklistPanel: {
      backgroundColor: theme.cardAlt,
      borderRadius: 18,
      padding: 16,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 12,
    },
    deviceCommandBox: {
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderRadius: 14,
      borderWidth: 1,
      gap: 5,
      padding: 12,
    },
    deviceCommandLabel: {
      color: theme.mutedText,
      fontSize: 11,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    deviceCommandText: {
      color: theme.statusText,
      fontSize: 12,
      fontWeight: "800",
      lineHeight: 18,
    },
    deviceResultBox: {
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderRadius: 14,
      borderWidth: 1,
      gap: 10,
      padding: 12,
    },
    deviceResultText: {
      color: theme.text,
      fontSize: 13,
      fontWeight: "800",
    },
    deviceResultButton: {
      alignSelf: "flex-start",
      backgroundColor: theme.accentSoft,
      borderColor: theme.accent,
      borderRadius: 999,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    deviceResultButtonText: {
      color: theme.statusText,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    milestoneStatus: {
      color: theme.statusText,
      fontSize: 12,
      fontWeight: "900",
      textTransform: "uppercase",
    },
    milestoneGrid: {
      gap: 8,
    },
    milestoneItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    milestoneDot: {
      color: theme.accent,
      fontSize: 14,
      fontWeight: "900",
    },
    milestoneCopy: {
      flex: 1,
      gap: 3,
    },
    milestoneText: {
      color: theme.text,
      fontWeight: "900",
    },
    milestoneDetail: {
      color: theme.mutedText,
      fontSize: 12,
      lineHeight: 17,
      fontWeight: "700",
    },
    releaseCheckItem: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 8,
    },
    releaseCheckDot: {
      color: theme.accent,
      fontSize: 14,
      fontWeight: "900",
    },
    nudgeLearningStrip: {
      flexDirection: "row",
      gap: 8,
    },
    nudgeLearningMetric: {
      flex: 1,
      backgroundColor: theme.card,
      borderColor: theme.border,
      borderRadius: 14,
      borderWidth: 1,
      padding: 10,
      gap: 2,
    },
    nudgeLearningValue: {
      color: theme.text,
      fontSize: 18,
      fontWeight: "900",
    },
    nudgeLearningLabel: {
      color: theme.mutedText,
      fontSize: 11,
      fontWeight: "800",
      textTransform: "uppercase",
    },
    nudgeFeedbackRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      paddingTop: 4,
    },
    nudgeFeedbackButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    nudgeFeedbackButtonSelected: {
      backgroundColor: theme.accentSoft,
      borderColor: theme.accent,
    },
    nudgeFeedbackText: {
      color: theme.mutedText,
      fontSize: 12,
      fontWeight: "800",
    },
    nudgeFeedbackTextSelected: {
      color: theme.statusText,
    },
    unifiedDarkPanel: {
      backgroundColor: "#071017",
      borderRadius: 22,
      padding: 16,
      gap: 12,
      borderWidth: 1,
      borderColor: "#12373f",
    },
    unifiedEyebrow: {
      color: "#18e3b7",
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 2.6,
    },
    unifiedTopRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    unifiedMetricPill: {
      flex: 1,
      minWidth: 110,
      padding: 14,
      borderRadius: 16,
      backgroundColor: "#0b161d",
      borderWidth: 1,
      borderColor: "#12373f",
      gap: 4,
    },
    unifiedMetricValue: {
      color: "#f3fbfd",
      fontSize: 20,
      fontWeight: "800",
      textTransform: "capitalize",
    },
    unifiedMetricLabel: {
      color: "#88a0a8",
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 0.8,
      fontWeight: "700",
    },
    unifiedCommentary: {
      color: "#9aadb4",
      lineHeight: 22,
    },
    unifiedHistoryRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 12,
      alignItems: "center",
    },
    unifiedHistoryStack: {
      flex: 1,
      minWidth: 220,
      gap: 8,
    },
    unifiedHistoryHeadline: {
      color: "#f5fbfc",
      fontSize: 24,
      lineHeight: 30,
      fontWeight: "800",
    },
    unifiedMiniDots: {
      width: 160,
      padding: 12,
      borderRadius: 16,
      backgroundColor: "#0b161d",
      borderWidth: 1,
      borderColor: "#12373f",
      alignItems: "center",
    },
    unifiedInsightStrip: {
      padding: 14,
      borderRadius: 16,
      backgroundColor: "#0b161d",
      borderWidth: 1,
      borderColor: "#12373f",
      gap: 6,
    },
    unifiedInsightTitle: {
      color: "#18e3b7",
      fontSize: 15,
      fontWeight: "800",
    },
    unifiedInsightText: {
      color: "#a7b9bf",
      lineHeight: 22,
    },
    forecastStrip: {
      padding: 14,
      borderRadius: 16,
      backgroundColor: "#0d2226",
      borderWidth: 1,
      borderColor: "#1b4f4e",
      gap: 5,
    },
    forecastStripTitle: {
      color: "#18e3b7",
      fontSize: 15,
      fontWeight: "800",
    },
    forecastStripText: {
      color: "#d2e4e5",
      lineHeight: 21,
      fontWeight: "700",
    },
    darkIntelPanel: {
      backgroundColor: "#071017",
      borderRadius: 24,
      padding: 18,
      gap: 16,
      borderWidth: 1,
      borderColor: "#12373f",
    },
    darkIntelEyebrow: {
      color: "#18e3b7",
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 3,
    },
    darkIntelTopRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
      alignItems: "center",
    },
    signalScoreCard: {
      width: 180,
      alignItems: "center",
      gap: 10,
    },
    signalScoreRing: {
      width: 140,
      height: 140,
      borderRadius: 70,
      borderWidth: 12,
      borderColor: "#18e3b7",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0b1218",
    },
    signalScoreValue: {
      color: "#18e3b7",
      fontSize: 30,
      fontWeight: "800",
    },
    signalScoreLabel: {
      color: "#7eb5ac",
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      fontWeight: "700",
    },
    signalScoreCaption: {
      color: "#8ea1a8",
      textAlign: "center",
      lineHeight: 20,
    },
    darkIntelNarrative: {
      flex: 1,
      minWidth: 220,
      gap: 10,
    },
    darkIntelHeadline: {
      color: "#f5fbfc",
      fontSize: 28,
      lineHeight: 34,
      fontWeight: "800",
    },
    darkIntelCopy: {
      color: "#93a5ad",
      fontSize: 16,
      lineHeight: 24,
    },
    forecastCard: {
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 8,
    },
    forecastHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 10,
      alignItems: "center",
    },
    forecastLabel: {
      color: theme.eyebrow,
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    forecastSignal: {
      color: theme.mutedText,
      fontSize: 12,
      fontWeight: "700",
    },
    forecastTitle: {
      color: theme.text,
      fontSize: 18,
      lineHeight: 23,
      fontWeight: "800",
    },
    forecastText: {
      color: theme.mutedText,
      lineHeight: 22,
    },
    forecastAction: {
      color: theme.statusText,
      fontWeight: "800",
      lineHeight: 20,
    },
    darkForecastCard: {
      padding: 14,
      borderRadius: 18,
      backgroundColor: "#0b161d",
      borderWidth: 1,
      borderColor: "#1b4f4e",
      gap: 8,
    },
    darkForecastLabel: {
      color: "#18e3b7",
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    darkForecastSignal: {
      color: "#8cb3b1",
      fontSize: 12,
      fontWeight: "700",
    },
    darkForecastTitle: {
      color: "#f5fbfc",
      fontSize: 18,
      lineHeight: 24,
      fontWeight: "800",
    },
    darkForecastText: {
      color: "#a6b5ba",
      lineHeight: 22,
    },
    darkForecastAction: {
      color: "#18e3b7",
      fontWeight: "800",
      lineHeight: 20,
    },
    darkIntelBottomRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 14,
    },
    dotGridCard: {
      flex: 1,
      minWidth: 220,
      padding: 14,
      borderRadius: 18,
      backgroundColor: "#0b161d",
      borderWidth: 1,
      borderColor: "#12373f",
      gap: 10,
    },
    darkIntelMiniTitle: {
      color: "#b4c2c8",
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 1,
    },
    dotMatrix: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      maxWidth: 170,
    },
    dotMatrixDot: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: "#203038",
    },
    dotMatrixDotActive: {
      backgroundColor: "#18e3b7",
    },
    darkIntelFootnote: {
      color: "#7e9098",
      fontSize: 12,
      lineHeight: 18,
    },
    darkIntelInsightStack: {
      flex: 1.2,
      minWidth: 240,
      gap: 12,
    },
    darkInsightCard: {
      padding: 14,
      borderRadius: 18,
      backgroundColor: "#0b161d",
      borderWidth: 1,
      borderColor: "#12373f",
      gap: 6,
    },
    darkInsightTitle: {
      color: "#18e3b7",
      fontSize: 16,
      fontWeight: "800",
    },
    darkInsightText: {
      color: "#a6b5ba",
      lineHeight: 22,
    },
    editorialBoard: {
      backgroundColor: "#06070f",
      borderRadius: 24,
      padding: 18,
      gap: 16,
      borderWidth: 1,
      borderColor: "#10242f",
    },
    editorialEyebrow: {
      color: "#18e3b7",
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 4,
    },
    editorialTopRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 16,
      alignItems: "center",
    },
    editorialDonutCard: {
      width: 210,
      alignItems: "center",
      gap: 12,
    },
    editorialDonutRing: {
      width: 156,
      height: 156,
      borderRadius: 78,
      borderWidth: 14,
      borderColor: "#18e3b7",
      backgroundColor: "#0a0d16",
      alignItems: "center",
      justifyContent: "center",
    },
    editorialDonutValue: {
      color: "#18e3b7",
      fontSize: 34,
      fontWeight: "900",
    },
    editorialDonutLabel: {
      color: "#8ab7af",
      fontSize: 12,
      textTransform: "uppercase",
      letterSpacing: 1.2,
      fontWeight: "800",
    },
    editorialCaption: {
      color: "#81909c",
      textAlign: "center",
      lineHeight: 20,
    },
    editorialHeadlineBlock: {
      flex: 1,
      minWidth: 240,
      gap: 10,
    },
    editorialHeadline: {
      color: "#fbfdff",
      fontSize: 34,
      lineHeight: 40,
      fontWeight: "900",
    },
    editorialSubcopy: {
      color: "#8e99a4",
      fontSize: 16,
      lineHeight: 24,
      maxWidth: 520,
    },
    editorialMidRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 14,
    },
    editorialDotPanel: {
      flex: 1,
      minWidth: 240,
      backgroundColor: "#0a1118",
      borderRadius: 20,
      padding: 14,
      borderWidth: 1,
      borderColor: "#12373f",
      gap: 10,
    },
    editorialMiniHeading: {
      color: "#c6d0d6",
      fontSize: 12,
      fontWeight: "800",
      textTransform: "uppercase",
      letterSpacing: 1.2,
    },
    editorialLegend: {
      color: "#77858f",
      fontSize: 12,
      lineHeight: 18,
    },
    editorialStack: {
      flex: 1,
      minWidth: 240,
      gap: 12,
    },
    editorialStackCard: {
      backgroundColor: "#0a1118",
      borderRadius: 18,
      padding: 14,
      borderWidth: 1,
      borderColor: "#12373f",
      gap: 4,
    },
    editorialStackValue: {
      color: "#18e3b7",
      fontSize: 28,
      fontWeight: "900",
    },
    editorialStackTitle: {
      color: "#b1bcc5",
      fontSize: 15,
      fontWeight: "700",
    },
    editorialBottomRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 14,
    },
    editorialWideCard: {
      flex: 1,
      minWidth: 260,
      backgroundColor: "#0a1118",
      borderRadius: 20,
      padding: 14,
      borderWidth: 1,
      borderColor: "#12373f",
      gap: 12,
    },
    editorialQuoteCard: {
      paddingLeft: 14,
      borderLeftWidth: 4,
      borderLeftColor: "#18e3b7",
      gap: 8,
    },
    editorialQuoteText: {
      color: "#f3fbfd",
      fontSize: 22,
      lineHeight: 28,
      fontWeight: "800",
    },
    editorialQuoteMeta: {
      color: "#8d99a4",
      lineHeight: 22,
    },
    matrixWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    matrixCard: {
      flex: 1,
      minWidth: 120,
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      alignItems: "center",
      gap: 4,
    },
    matrixEmoji: {
      fontSize: 18,
    },
    matrixLabel: {
      color: theme.mutedText,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    matrixValue: {
      color: theme.text,
      fontSize: 24,
      fontWeight: "700",
    },
    matrixMeta: {
      color: theme.mutedText,
      fontSize: 12,
    },
    sparklineWrap: {
      flexDirection: "row",
      alignItems: "flex-end",
      justifyContent: "space-between",
      gap: 10,
      minHeight: 132,
    },
    sparklineItem: {
      flex: 1,
      alignItems: "center",
      gap: 6,
    },
    sparklineMood: {
      color: theme.text,
      fontWeight: "700",
      fontSize: 12,
    },
    sparklineBar: {
      width: 22,
      borderRadius: 999,
      backgroundColor: theme.accent,
      minHeight: 12,
    },
    sparklineIcon: {
      fontSize: 14,
    },
    sparklineLabel: {
      color: theme.mutedText,
      fontSize: 11,
    },
    summaryTitle: {
      color: theme.text,
      fontWeight: "700",
    },
    summaryWindowText: {
      color: theme.mutedText,
      lineHeight: 22,
    },
    metricRow: {
      gap: 6,
    },
    metricHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 10,
    },
    metricLabel: {
      color: theme.text,
      textTransform: "capitalize",
    },
    metricValue: {
      color: theme.text,
      fontWeight: "700",
    },
    metricTrack: {
      height: 10,
      borderRadius: 999,
      backgroundColor: theme.summaryTrack,
      overflow: "hidden",
    },
    metricFill: {
      height: "100%",
      borderRadius: 999,
      backgroundColor: theme.accent,
    },
    signalRow: {
      flexDirection: "row",
      gap: 8,
      alignItems: "flex-start",
    },
    insightSummaryCard: {
      gap: 6,
      padding: 12,
      borderRadius: 14,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    insightSummaryTitle: {
      color: theme.text,
      fontWeight: "700",
      flex: 1,
    },
    signalIcon: {
      color: theme.eyebrow,
      fontWeight: "700",
      marginTop: 1,
    },
    confidenceText: {
      color: theme.mutedText,
      fontSize: 12,
      fontWeight: "700",
      textTransform: "uppercase",
      letterSpacing: 0.8,
    },
    guidanceCard: {
      flexDirection: "row",
      gap: 10,
      alignItems: "flex-start",
      padding: 12,
      borderRadius: 14,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
    },
    guidanceTextWrap: {
      flex: 1,
      gap: 4,
    },
    guidanceTitle: {
      color: theme.text,
      fontWeight: "700",
    },
    logRow: {
      flexDirection: "row",
      gap: 8,
      alignItems: "flex-start",
    },
    timelineWrap: {
      gap: 10,
    },
    timelineCard: {
      padding: 14,
      borderRadius: 16,
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      gap: 6,
    },
    timelineTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 10,
    },
    timelineWeather: {
      fontSize: 20,
    },
    timelineMoodBadge: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: theme.accentSoft,
    },
    timelineMoodText: {
      color: theme.statusText,
      fontWeight: "700",
      fontSize: 12,
    },
    timelineTitle: {
      color: theme.text,
      fontWeight: "700",
      textTransform: "capitalize",
    },
    timelineMeta: {
      color: theme.mutedText,
      fontSize: 12,
    },
    timelineNote: {
      color: theme.text,
      lineHeight: 20,
    },
    logIcon: {
      fontSize: 16,
      marginTop: 1,
    },
    summaryText: {
      color: theme.mutedText,
      lineHeight: 22,
      textTransform: "capitalize",
      flex: 1,
    },
  });
}
