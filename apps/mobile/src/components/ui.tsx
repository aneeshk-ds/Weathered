import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { appText, useColors, type Palette } from "../theme";
import {
  clampMoodFraction,
  isMoodScaleTap,
  moodFractionForValue,
  moodFractionFromPageX,
  moodFractionFromTrackPosition,
  moodValueFromFraction,
  shouldMoodScaleHandleMove,
  shouldMoodScaleYieldToVerticalScroll,
  type MoodTouchPoint,
} from "./moodScaleMath";

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  const styles = makeStyles(useColors());
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ScreenHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  const styles = makeStyles(useColors());
  return (
    <View style={styles.header}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

export function Label({ children }: { children: React.ReactNode }) {
  const styles = makeStyles(useColors());
  return <Text style={styles.label}>{children}</Text>;
}

export function Chip({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const styles = makeStyles(useColors());
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={[styles.chip, selected && styles.chipOn]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

export function PrimaryButton({
  label,
  onPress,
  tone = "solid",
}: {
  label: string;
  onPress: () => void;
  tone?: "solid" | "ghost";
}) {
  const styles = makeStyles(useColors());
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.btn, tone === "ghost" && styles.btnGhost]}
    >
      <Text style={[styles.btnText, tone === "ghost" && styles.btnGhostText]}>{label}</Text>
    </Pressable>
  );
}

export function MoodScale({ value, onChange }: { value: number; onChange: (next: number) => void }) {
  const styles = makeStyles(useColors());
  const trackRef = useRef<View>(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const [dragFraction, setDragFraction] = useState<number | null>(null);
  const valueRef = useRef(value);
  const tapStartRef = useRef<MoodTouchPoint | null>(null);
  const isDraggingRef = useRef(false);
  const trackFrameRef = useRef({ left: 0, width: 0, measured: false });
  const fraction = dragFraction ?? moodFractionForValue(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const applyFraction = useCallback(
    (nextFraction: number, dragging: boolean) => {
      const clampedFraction = clampMoodFraction(nextFraction);
      const next = moodValueFromFraction(clampedFraction);
      if (dragging) setDragFraction(clampedFraction);
      if (next !== valueRef.current) {
        valueRef.current = next;
        onChange(next);
      }
    },
    [onChange],
  );

  const measureTrack = useCallback(
    (layoutWidth = trackWidth) => {
      trackRef.current?.measure((_x, _y, measuredWidth, _height, pageX) => {
        const nextWidth = measuredWidth || layoutWidth;
        if (nextWidth <= 0) return;
        trackFrameRef.current = { left: pageX, width: nextWidth, measured: true };
        if (nextWidth !== trackWidth) setTrackWidth(nextWidth);
      });
    },
    [trackWidth],
  );

  const setFromLocalPosition = useCallback(
    (locationX: number, dragging: boolean) => {
      const width = trackFrameRef.current.width || trackWidth;
      if (!width) return;
      const nextFraction = moodFractionFromTrackPosition(locationX, width);
      applyFraction(nextFraction, dragging);
    },
    [applyFraction, trackWidth],
  );

  const setFromPagePosition = useCallback(
    (pageX: number, dragging: boolean) => {
      const { left, width, measured } = trackFrameRef.current;
      if (!measured || !width) return;
      const nextFraction = moodFractionFromPageX(pageX, left, width);
      applyFraction(nextFraction, dragging);
    },
    [applyFraction],
  );

  const setFromEvent = useCallback(
    (event: GestureResponderEvent, dragging: boolean) => {
      const { pageX, locationX } = event.nativeEvent;
      const { measured, width } = trackFrameRef.current;
      if (measured && width) {
        setFromPagePosition(pageX, dragging);
      } else {
        setFromLocalPosition(locationX, dragging);
      }
    },
    [setFromLocalPosition, setFromPagePosition],
  );

  const setFromGesture = useCallback(
    (event: GestureResponderEvent, pageX: number, dragging: boolean) => {
      const { measured, width } = trackFrameRef.current;
      if (measured && width && Number.isFinite(pageX)) {
        setFromPagePosition(pageX, dragging);
      } else {
        setFromEvent(event, dragging);
      }
    },
    [setFromEvent, setFromPagePosition],
  );

  const touchPointFromEvent = useCallback((event: GestureResponderEvent): MoodTouchPoint => {
    const { pageX, pageY } = event.nativeEvent;
    const timestamp = typeof event.timeStamp === "number" ? event.timeStamp : Date.now();
    return { pageX, pageY, timestamp };
  }, []);

  const handleTouchStart = useCallback(
    (event: GestureResponderEvent) => {
      measureTrack();
      tapStartRef.current = touchPointFromEvent(event);
    },
    [measureTrack, touchPointFromEvent],
  );

  const handleTouchEnd = useCallback(
    (event: GestureResponderEvent) => {
      const tapStart = tapStartRef.current;
      tapStartRef.current = null;
      if (!tapStart || isDraggingRef.current) return;
      const tapEnd = touchPointFromEvent(event);
      if (isMoodScaleTap(tapStart, tapEnd)) {
        setFromEvent(event, false);
      }
    },
    [setFromEvent, touchPointFromEvent],
  );

  const handleTouchCancel = useCallback(() => {
    tapStartRef.current = null;
    isDraggingRef.current = false;
    setDragFraction(null);
  }, []);

  const onLayout = useCallback(
    (event: LayoutChangeEvent) => {
      const nextWidth = event.nativeEvent.layout.width;
      setTrackWidth(nextWidth);
      trackFrameRef.current = { ...trackFrameRef.current, width: nextWidth };
      requestAnimationFrame(() => measureTrack(nextWidth));
    },
    [measureTrack],
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => shouldMoodScaleHandleMove(gestureState.dx, gestureState.dy),
        onMoveShouldSetPanResponderCapture: (_, gestureState) =>
          shouldMoodScaleHandleMove(gestureState.dx, gestureState.dy),
        onPanResponderGrant: (event, gestureState) => {
          isDraggingRef.current = true;
          tapStartRef.current = null;
          measureTrack();
          setDragFraction(moodFractionForValue(valueRef.current));
          setFromGesture(event, gestureState.moveX, true);
        },
        onPanResponderMove: (event, gestureState) => setFromGesture(event, gestureState.moveX, true),
        onPanResponderRelease: (event, gestureState) => {
          setFromGesture(event, gestureState.moveX, false);
          isDraggingRef.current = false;
          setDragFraction(null);
        },
        onPanResponderTerminate: () => {
          isDraggingRef.current = false;
          setDragFraction(null);
        },
        onPanResponderTerminationRequest: (_, gestureState) =>
          shouldMoodScaleYieldToVerticalScroll(gestureState.dx, gestureState.dy),
        onShouldBlockNativeResponder: () => true,
      }),
    [measureTrack, setFromGesture],
  );

  return (
    <View style={styles.moodRow}>
      <View
        ref={trackRef}
        style={styles.moodTrack}
        onLayout={onLayout}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        hitSlop={{ top: 8, bottom: 8, left: 0, right: 0 }}
        collapsable={false}
        {...panResponder.panHandlers}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Mood, 1 to 10"
        accessibilityValue={{ min: 1, max: 10, now: value, text: `${value} out of 10` }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(event) => {
          if (event.nativeEvent.actionName === "increment") onChange(Math.min(10, value + 1));
          if (event.nativeEvent.actionName === "decrement") onChange(Math.max(1, value - 1));
        }}
      >
        <View pointerEvents="none" style={styles.moodRail} />
        <View pointerEvents="none" style={[styles.moodFill, { width: `${fraction * 100}%` }]} />
        <View
          pointerEvents="none"
          style={[styles.moodThumb, { left: `${fraction * 100}%` }, dragFraction !== null && styles.moodThumbActive]}
        />
      </View>
      <Text style={styles.moodValue}>{value}</Text>
    </View>
  );
}

export function MetricCard({ label, value }: { label: string; value: string }) {
  const styles = makeStyles(useColors());
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    card: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 14 },
    header: { marginBottom: 14 },
    eyebrow: { ...appText, fontSize: 11, color: colors.accent, textTransform: "uppercase", marginBottom: 2 },
    title: { ...appText, fontSize: 21, fontWeight: "600", color: colors.text, marginBottom: 3 },
    subtitle: { ...appText, fontSize: 13, color: colors.muted, lineHeight: 19 },
    label: { ...appText, fontSize: 13, color: colors.muted, marginBottom: 8, marginTop: 2 },
    chip: {
      backgroundColor: colors.card2,
      borderRadius: 16,
      paddingVertical: 8,
      paddingHorizontal: 15,
      marginRight: 8,
      marginBottom: 8,
    },
    chipOn: { backgroundColor: colors.accent },
    chipText: { ...appText, fontSize: 13, color: colors.muted },
    chipTextOn: { color: colors.accentText, fontWeight: "600" },
    btn: { backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 13, alignItems: "center", marginTop: 4 },
    btnGhost: { backgroundColor: colors.card2 },
    btnText: { ...appText, fontSize: 15, fontWeight: "600", color: colors.accentText },
    btnGhostText: { color: colors.muted },
    moodRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
    moodTrack: { flex: 1, height: 52, justifyContent: "center", position: "relative" },
    moodRail: {
      position: "absolute",
      left: 0,
      right: 0,
      height: 8,
      borderRadius: 999,
      backgroundColor: colors.line,
    },
    moodFill: {
      position: "absolute",
      left: 0,
      height: 8,
      borderRadius: 999,
      backgroundColor: colors.accent,
    },
    moodThumb: {
      position: "absolute",
      width: 24,
      height: 24,
      marginLeft: -12,
      borderRadius: 12,
      backgroundColor: colors.text,
      borderWidth: 4,
      borderColor: colors.accent,
    },
    moodThumbActive: { transform: [{ scale: 1.06 }] },
    moodValue: { ...appText, fontSize: 16, fontWeight: "600", color: colors.text, minWidth: 26, textAlign: "right" },
    metric: {
      flex: 1,
      backgroundColor: colors.card2,
      borderRadius: 11,
      paddingVertical: 13,
      paddingHorizontal: 8,
      alignItems: "center",
    },
    metricLabel: { ...appText, fontSize: 11, color: colors.muted, marginBottom: 4 },
    metricValue: { ...appText, fontSize: 22, fontWeight: "600", color: colors.text },
  });
