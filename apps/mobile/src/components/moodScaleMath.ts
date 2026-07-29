export const MOOD_MIN = 1;
export const MOOD_MAX = 10;
export const MOOD_RANGE = MOOD_MAX - MOOD_MIN;

const DRAG_START_PX = 8;
const DRAG_AXIS_RATIO = 1.3;
const RESPONDER_RELEASE_PX = 12;
const TAP_MAX_DISTANCE_PX = 10;
const TAP_MAX_DURATION_MS = 500;

export type MoodTouchPoint = {
  pageX: number;
  pageY: number;
  timestamp: number;
};

export function clampMoodFraction(fraction: number): number {
  if (!Number.isFinite(fraction)) return 0;
  return Math.max(0, Math.min(1, fraction));
}

export function moodFractionForValue(value: number): number {
  return clampMoodFraction((value - MOOD_MIN) / MOOD_RANGE);
}

export function moodValueFromFraction(fraction: number): number {
  return Math.round(clampMoodFraction(fraction) * MOOD_RANGE) + MOOD_MIN;
}

export function moodFractionFromTrackPosition(positionX: number, trackWidth: number): number {
  if (!Number.isFinite(trackWidth) || trackWidth <= 0) return 0;
  return clampMoodFraction(positionX / trackWidth);
}

export function moodFractionFromPageX(pageX: number, trackLeft: number, trackWidth: number): number {
  return moodFractionFromTrackPosition(pageX - trackLeft, trackWidth);
}

export function moodValueFromPageX(pageX: number, trackLeft: number, trackWidth: number): number {
  return moodValueFromFraction(moodFractionFromPageX(pageX, trackLeft, trackWidth));
}

export function shouldMoodScaleHandleMove(dx: number, dy: number): boolean {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  return absX >= DRAG_START_PX && absX > absY * DRAG_AXIS_RATIO;
}

export function shouldMoodScaleYieldToVerticalScroll(dx: number, dy: number): boolean {
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  return absY >= RESPONDER_RELEASE_PX && absY > absX * DRAG_AXIS_RATIO;
}

export function isMoodScaleTap(start: MoodTouchPoint, end: MoodTouchPoint): boolean {
  const dx = end.pageX - start.pageX;
  const dy = end.pageY - start.pageY;
  const distanceSq = dx * dx + dy * dy;
  return (
    end.timestamp - start.timestamp <= TAP_MAX_DURATION_MS && distanceSq <= TAP_MAX_DISTANCE_PX * TAP_MAX_DISTANCE_PX
  );
}
