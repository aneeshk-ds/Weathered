import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  DECISION_CATEGORIES,
  type DecisionForecast,
  type DecisionLogInput,
  type BehavioralRead,
  type DecisionReadiness,
  type Insight,
  type RecommendationFeedback,
  type RecommendationFeedbackValue,
  type RecommendationNudge,
  type WeeklySummary,
} from "@weathered/shared";
import { categoryColors, useColors, type Palette } from "../theme";
import { CATEGORY_LABEL } from "../format";
import { Card, ScreenHeader } from "../components/ui";
import { DonutRing, ProgressRing } from "../components/Rings";
import { WeekBars } from "../components/WeekBars";
import { filterEntriesWithinLast7Days } from "../lib/summary";

const ACTED: string[] = ["go_out", "work", "buy"];

export function InsightsScreen({
  insight,
  summary,
  entries,
  weekMood,
  readiness,
  behavioralRead,
  nudges,
  nudgeFeedback,
  onNudgeFeedback,
  forecast,
}: {
  insight: Insight | null;
  summary: WeeklySummary;
  entries: DecisionLogInput[];
  weekMood: number[];
  readiness: DecisionReadiness;
  behavioralRead: BehavioralRead;
  nudges: RecommendationNudge[];
  nudgeFeedback: RecommendationFeedback[];
  onNudgeFeedback: (id: string, value: RecommendationFeedbackValue) => void;
  forecast: DecisionForecast;
}) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const weeklyEntries = filterEntriesWithinLast7Days(entries);
  const total = summary.totalEntries;
  const followed = weeklyEntries.filter((entry) => ACTED.includes(entry.decisionOutcome)).length;
  const followFrac = total > 0 ? followed / total : 0;
  const moodFrac = summary.averageMood > 0 ? summary.averageMood / 10 : 0;

  const segments = DECISION_CATEGORIES.map((category) => ({
    value: summary.decisionCounts[category] || 0,
    color: categoryColors[category],
  }));
  const legend = DECISION_CATEGORIES.filter((category) => (summary.decisionCounts[category] || 0) > 0);

  function feedbackFor(id: string) {
    return nudgeFeedback.find((item) => item.nudgeId === id)?.value;
  }

  return (
    <View>
      <ScreenHeader eyebrow="Insights" title="Your patterns" subtitle="What the last week is telling you." />

      <Text style={styles.todayRead}>◆ {behavioralRead.summary}</Text>

      {insight ? (
        <View style={styles.insight}>
          <Text style={styles.insightTag}>Pattern</Text>
          <Text style={styles.insightMsg}>{insight.message}</Text>
        </View>
      ) : null}

      <View style={styles.rings}>
        <Card style={styles.ringCard}>
          <ProgressRing
            fraction={moodFrac}
            value={summary.averageMood > 0 ? summary.averageMood.toFixed(1) : "–"}
            unit="/ 10"
          />
          <Text style={styles.ringLabel}>Avg mood</Text>
        </Card>
        <Card style={styles.ringCard}>
          <ProgressRing fraction={followFrac} value={`${Math.round(followFrac * 100)}%`} unit="acted" />
          <Text style={styles.ringLabel}>Followed through</Text>
        </Card>
      </View>

      <Card>
        <Text style={styles.cardLabel}>Decisions by type</Text>
        <View style={styles.donutRow}>
          <DonutRing segments={segments} centerValue={String(total)} centerUnit="logs" />
          <View style={styles.legend}>
            {legend.length > 0 ? (
              legend.map((category) => (
                <View key={category} style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: categoryColors[category] }]} />
                  <Text style={styles.legendText}>
                    {CATEGORY_LABEL[category]} · {summary.decisionCounts[category]}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.legendText}>No logs yet</Text>
            )}
          </View>
        </View>
      </Card>

      <Card>
        <Text style={styles.cardLabel}>Mood this week</Text>
        <WeekBars values={weekMood} />
      </Card>

      <Card>
        <Text style={styles.cardLabel}>Good day to decide?</Text>
        <View style={styles.readinessRow}>
          <Text style={styles.readinessLabel}>{readiness.label}</Text>
          <Text style={styles.readinessScore}>{readiness.score}</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${readiness.score}%` }]} />
        </View>
        <Text style={styles.readinessMsg}>{readiness.message}</Text>
      </Card>

      <Text style={styles.sectionLabel}>Suggestions for right now</Text>
      {nudges.map((nudge) => {
        const chosen = feedbackFor(nudge.id);
        return (
          <Card key={nudge.id}>
            <Text style={styles.nudgeTitle}>{nudge.title}</Text>
            <Text style={styles.nudgeMsg}>{nudge.message}</Text>
            <Text style={styles.nudgeAction}>→ {nudge.actionLabel}</Text>
            <View style={styles.feedbackRow}>
              <Pressable
                style={[styles.feedbackBtn, chosen === "helpful" && styles.feedbackOn]}
                onPress={() => onNudgeFeedback(nudge.id, "helpful")}
                accessibilityRole="button"
                accessibilityState={{ selected: chosen === "helpful" }}
                accessibilityLabel="Mark suggestion helpful"
              >
                <Text style={[styles.feedbackText, chosen === "helpful" && styles.feedbackTextOn]}>Helpful</Text>
              </Pressable>
              <Pressable
                style={[styles.feedbackBtn, chosen === "not_now" && styles.feedbackOn]}
                onPress={() => onNudgeFeedback(nudge.id, "not_now")}
                accessibilityRole="button"
                accessibilityState={{ selected: chosen === "not_now" }}
                accessibilityLabel="Dismiss suggestion for now"
              >
                <Text style={[styles.feedbackText, chosen === "not_now" && styles.feedbackTextOn]}>Not now</Text>
              </Pressable>
            </View>
          </Card>
        );
      })}

      <Card style={styles.forecast}>
        <Text style={styles.forecastTag}>{forecast.signalStrength}% signal</Text>
        <Text style={styles.nudgeTitle}>{forecast.title}</Text>
        <Text style={styles.nudgeMsg}>{forecast.message}</Text>
        <Text style={styles.nudgeAction}>→ {forecast.actionLabel}</Text>
      </Card>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    todayRead: { fontSize: 13, color: colors.accent, marginBottom: 14, lineHeight: 19 },
    insight: {
      backgroundColor: colors.card,
      borderLeftWidth: 3,
      borderLeftColor: colors.accent,
      borderRadius: 0,
      padding: 13,
      marginBottom: 14,
    },
    insightTag: { fontSize: 12, color: colors.accent, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 },
    insightMsg: { fontSize: 14, color: colors.text, lineHeight: 21 },
    rings: { flexDirection: "row", gap: 10 },
    ringCard: { flex: 1, alignItems: "center" },
    ringLabel: { fontSize: 11, color: colors.muted, marginTop: 8 },
    cardLabel: { fontSize: 13, color: colors.muted, marginBottom: 8 },
    donutRow: { flexDirection: "row", alignItems: "center", gap: 16 },
    legend: { flex: 1, gap: 6 },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 7 },
    dot: { width: 9, height: 9, borderRadius: 5 },
    legendText: { fontSize: 12, color: colors.muted },
    readinessRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    readinessLabel: { fontSize: 15, fontWeight: "600", color: colors.text },
    readinessScore: { fontSize: 18, fontWeight: "600", color: colors.accent },
    track: { height: 6, backgroundColor: colors.line, borderRadius: 3, overflow: "hidden" },
    fill: { height: 6, backgroundColor: colors.accent, borderRadius: 3 },
    readinessMsg: { fontSize: 13, color: colors.muted, marginTop: 8, lineHeight: 19 },
    sectionLabel: { fontSize: 13, color: colors.muted, marginBottom: 8, marginTop: 2 },
    nudgeTitle: { fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 4 },
    nudgeMsg: { fontSize: 13, color: colors.muted, lineHeight: 19 },
    nudgeAction: { fontSize: 12, color: colors.accent, marginTop: 8 },
    feedbackRow: { flexDirection: "row", gap: 8, marginTop: 10 },
    feedbackBtn: { flex: 1, backgroundColor: colors.card2, borderRadius: 8, paddingVertical: 7, alignItems: "center" },
    feedbackOn: { backgroundColor: colors.accent },
    feedbackText: { fontSize: 12, color: colors.muted },
    feedbackTextOn: { color: colors.accentText, fontWeight: "600" },
    forecast: { borderWidth: 1, borderColor: colors.line },
    forecastTag: { fontSize: 11, color: colors.dim, marginBottom: 6 },
  });
