import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import {
  DECISION_CATEGORIES,
  type DailyReflection,
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
import { appText, categoryColors, useColors, type Palette } from "../theme";
import { CATEGORY_LABEL } from "../format";
import { Card, ScreenHeader } from "../components/ui";
import { DonutRing, ProgressRing } from "../components/Rings";
import { WeekBars } from "../components/WeekBars";
import type { WeekDay } from "../lib/weekMood";
import { filterEntriesWithinLast7Days } from "../lib/summary";
import { buildDayPartInsights } from "../lib/dayParts";
import { DayPartVisual } from "../components/DayPartVisual";
import { buildReflectionSummary, DAY_FACTOR_LABELS, DAY_RATING_LABELS } from "../lib/reflections";

const ACTED: string[] = ["go_out", "work", "buy"];

export function InsightsScreen({
  insight,
  summary,
  entries,
  weekDays,
  readiness,
  behavioralRead,
  nudges,
  nudgeFeedback,
  onNudgeFeedback,
  forecast,
  reflections,
}: {
  insight: Insight | null;
  summary: WeeklySummary;
  entries: DecisionLogInput[];
  weekDays: WeekDay[];
  readiness: DecisionReadiness;
  behavioralRead: BehavioralRead;
  nudges: RecommendationNudge[];
  nudgeFeedback: RecommendationFeedback[];
  onNudgeFeedback: (id: string, value: RecommendationFeedbackValue) => void;
  forecast: DecisionForecast;
  reflections: DailyReflection[];
}) {
  const colors = useColors();
  const styles = makeStyles(colors);
  const weeklyEntries = filterEntriesWithinLast7Days(entries);
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
  const total = summary.totalEntries;
  const followed = weeklyEntries.filter((entry) => ACTED.includes(entry.decisionOutcome)).length;
  const followFrac = total > 0 ? followed / total : 0;
  const moodFrac = summary.averageMood > 0 ? summary.averageMood / 10 : 0;
  const dayPartInsights = buildDayPartInsights(entries);
  const strongestDayPart = dayPartInsights
    .filter((part) => part.averageMood !== null)
    .sort((a, b) => (b.averageMood ?? 0) - (a.averageMood ?? 0))[0];
  const reflectionSummary = buildReflectionSummary(reflections);
  const reflectionDriver = readiness.drivers.find((driver) => driver.startsWith("latest day reflection"));

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
            value={summary.averageMood > 0 ? summary.averageMood.toFixed(1) : "-"}
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
        <WeekBars days={weekDays} />
        <Text style={styles.weekNote}>
          {summary.trackedDays} of 7 days tracked through {todayLabel}. Dashes mean no check-in, not a low mood.
        </Text>
      </Card>

      <Card>
        <Text style={styles.cardLabel}>Day rhythm</Text>
        <Text style={styles.rhythmHeadline}>
          {strongestDayPart
            ? `${strongestDayPart.label} is your highest tracked mood window at ${strongestDayPart.averageMood?.toFixed(1)}.`
            : "Check in across the day to reveal your time-of-day pattern."}
        </Text>
        <View style={styles.dayPartGrid}>
          {dayPartInsights.map((part) => (
            <View key={part.key} style={styles.dayPartCell}>
              <View style={styles.dayPartHeader}>
                <Text style={styles.dayPartLabel}>{part.label}</Text>
                <Text style={styles.dayPartTime}>{part.timeLabel}</Text>
              </View>
              <DayPartVisual part={part.key} height={46} />
              <Text style={styles.dayPartMood}>
                {part.averageMood === null ? "—" : part.averageMood.toFixed(1)}
                {part.averageMood === null ? "" : " / 10"}
              </Text>
              <View style={styles.dayPartTrack}>
                {part.averageMood !== null ? (
                  <View style={[styles.dayPartFill, { width: `${part.averageMood * 10}%` }]} />
                ) : null}
              </View>
              <Text style={styles.dayPartMeta}>
                {part.checkIns === 0
                  ? "No check-ins yet"
                  : `${part.checkIns} check-in${part.checkIns === 1 ? "" : "s"} · ${part.dominantWeather}`}
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.weekNote}>
          Based on all saved check-ins in your local time. Empty periods mean no data, not low mood.
        </Text>
      </Card>

      <Card>
        <Text style={styles.cardLabel}>How your days land</Text>
        {reflectionSummary.averageScore === null ? (
          <Text style={styles.rhythmHeadline}>
            Your end-of-day reflections will appear here as a transparent decision signal.
          </Text>
        ) : (
          <>
            <View style={styles.reflectionSummaryRow}>
              <ProgressRing
                size={80}
                fraction={reflectionSummary.averageScore / 10}
                value={reflectionSummary.averageScore.toFixed(1)}
                unit="/ 10"
              />
              <View style={styles.reflectionCopy}>
                <Text style={styles.reflectionTitle}>
                  {reflectionSummary.count} reflected day{reflectionSummary.count === 1 ? "" : "s"}
                </Text>
                <Text style={styles.reflectionMeta}>Latest: {DAY_RATING_LABELS[reflectionSummary.latest!.rating]}</Text>
                <Text style={styles.reflectionMeta}>
                  {reflectionSummary.topFactor
                    ? `Most named influence: ${DAY_FACTOR_LABELS[reflectionSummary.topFactor]}`
                    : "No contributing factor named yet"}
                </Text>
              </View>
            </View>
            {reflectionSummary.latest?.note ? (
              <Text style={styles.reflectionQuote}>“{reflectionSummary.latest.note}”</Text>
            ) : null}
            <Text style={styles.weekNote}>
              {reflectionDriver
                ? `Current readiness includes ${reflectionDriver}.`
                : "Older reflections remain in your pattern summary but do not override today's live signals."}
            </Text>
          </>
        )}
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
            {nudge.evidenceLabel ? <Text style={styles.nudgeEvidence}>{nudge.evidenceLabel}</Text> : null}
            <Text style={styles.nudgeTitle}>{nudge.title}</Text>
            <Text style={styles.nudgeMsg}>{nudge.message}</Text>
            {nudge.purposeLabel ? <Text style={styles.nudgePurpose}>{nudge.purposeLabel}</Text> : null}
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
    todayRead: { ...appText, fontSize: 13, color: colors.accent, marginBottom: 14, lineHeight: 19 },
    insight: {
      backgroundColor: colors.card,
      borderLeftWidth: 3,
      borderLeftColor: colors.accent,
      borderRadius: 0,
      padding: 13,
      marginBottom: 14,
    },
    insightTag: { ...appText, fontSize: 12, color: colors.accent, textTransform: "uppercase", marginBottom: 4 },
    insightMsg: { ...appText, fontSize: 14, color: colors.text, lineHeight: 21 },
    rings: { flexDirection: "row", gap: 10 },
    ringCard: { flex: 1, alignItems: "center" },
    ringLabel: { ...appText, fontSize: 11, color: colors.muted, marginTop: 8 },
    cardLabel: { ...appText, fontSize: 13, color: colors.muted, marginBottom: 8 },
    weekNote: { ...appText, fontSize: 11, color: colors.dim, marginTop: 8 },
    rhythmHeadline: { ...appText, fontSize: 13, color: colors.text, lineHeight: 19, marginBottom: 10 },
    dayPartGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    dayPartCell: {
      flexGrow: 1,
      flexBasis: "46%",
      minWidth: 130,
      backgroundColor: colors.card2,
      borderRadius: 10,
      padding: 10,
    },
    dayPartHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 6 },
    dayPartLabel: { ...appText, fontSize: 12, fontWeight: "600", color: colors.text },
    dayPartTime: { ...appText, fontSize: 10, color: colors.dim },
    dayPartMood: { ...appText, fontSize: 17, fontWeight: "600", color: colors.accent, marginTop: 7 },
    dayPartTrack: { height: 4, backgroundColor: colors.line, borderRadius: 2, overflow: "hidden", marginTop: 6 },
    dayPartFill: { height: 4, backgroundColor: colors.accent, borderRadius: 2 },
    dayPartMeta: { ...appText, fontSize: 10, color: colors.muted, marginTop: 6, textTransform: "capitalize" },
    reflectionSummaryRow: { flexDirection: "row", alignItems: "center", gap: 14 },
    reflectionCopy: { flex: 1 },
    reflectionTitle: { ...appText, fontSize: 15, fontWeight: "600", color: colors.text, marginBottom: 5 },
    reflectionMeta: { ...appText, fontSize: 12, color: colors.muted, lineHeight: 18 },
    reflectionQuote: {
      ...appText,
      fontSize: 12,
      color: colors.text,
      lineHeight: 18,
      backgroundColor: colors.card2,
      borderRadius: 8,
      padding: 10,
      marginTop: 10,
    },
    donutRow: { flexDirection: "row", alignItems: "center", gap: 16 },
    legend: { flex: 1, gap: 6 },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 7 },
    dot: { width: 9, height: 9, borderRadius: 5 },
    legendText: { ...appText, fontSize: 12, color: colors.muted },
    readinessRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    readinessLabel: { ...appText, fontSize: 15, fontWeight: "600", color: colors.text },
    readinessScore: { ...appText, fontSize: 18, fontWeight: "600", color: colors.accent },
    track: { height: 6, backgroundColor: colors.line, borderRadius: 3, overflow: "hidden" },
    fill: { height: 6, backgroundColor: colors.accent, borderRadius: 3 },
    readinessMsg: { ...appText, fontSize: 13, color: colors.muted, marginTop: 8, lineHeight: 19 },
    sectionLabel: { ...appText, fontSize: 13, color: colors.muted, marginBottom: 8, marginTop: 2 },
    nudgeEvidence: { ...appText, fontSize: 10, color: colors.dim, lineHeight: 14, marginBottom: 7 },
    nudgeTitle: { ...appText, fontSize: 14, fontWeight: "600", color: colors.text, marginBottom: 4 },
    nudgeMsg: { ...appText, fontSize: 13, color: colors.muted, lineHeight: 19 },
    nudgePurpose: { ...appText, fontSize: 12, color: colors.text, lineHeight: 17, marginTop: 8 },
    nudgeAction: { ...appText, fontSize: 12, color: colors.accent, marginTop: 8 },
    feedbackRow: { flexDirection: "row", gap: 8, marginTop: 10 },
    feedbackBtn: { flex: 1, backgroundColor: colors.card2, borderRadius: 8, paddingVertical: 7, alignItems: "center" },
    feedbackOn: { backgroundColor: colors.accent },
    feedbackText: { ...appText, fontSize: 12, color: colors.muted },
    feedbackTextOn: { color: colors.accentText, fontWeight: "600" },
    forecast: { borderWidth: 1, borderColor: colors.line },
    forecastTag: { ...appText, fontSize: 11, color: colors.dim, marginBottom: 6 },
  });
