import React from "react";
import Svg, { Circle, Polyline } from "react-native-svg";
import { useColors } from "../theme";

export function Sparkline({ values, width = 88, height = 30 }: { values: number[]; width?: number; height?: number }) {
  const colors = useColors();
  const max = 10;
  const padding = 3;
  const points = values.map((value, index) => ({ value, index })).filter((point) => point.value > 0);

  function x(index: number): number {
    if (values.length <= 1) {
      return width / 2;
    }
    return padding + (index / (values.length - 1)) * (width - padding * 2);
  }
  function y(value: number): number {
    const clamped = Math.max(0, Math.min(max, value));
    return height - padding - (clamped / max) * (height - padding * 2);
  }

  if (points.length === 0) {
    return <Svg width={width} height={height} />;
  }
  if (points.length === 1) {
    const only = points[0];
    return (
      <Svg width={width} height={height}>
        <Circle cx={x(only.index)} cy={y(only.value)} r={2.5} fill={colors.accent} />
      </Svg>
    );
  }
  const line = points.map((point) => `${x(point.index).toFixed(1)},${y(point.value).toFixed(1)}`).join(" ");
  return (
    <Svg width={width} height={height}>
      <Polyline
        points={line}
        fill="none"
        stroke={colors.accent}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </Svg>
  );
}
