import React from "react";
import Svg, { Circle, Text as SvgText } from "react-native-svg";
import { useColors } from "../theme";

export function ProgressRing({
  fraction,
  value,
  unit,
  size = 96,
}: {
  fraction: number;
  value: string;
  unit: string;
  size?: number;
}) {
  const stroke = 8;
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const colors = useColors();
  const clamped = Math.max(0, Math.min(1, fraction));
  const offset = c * (1 - clamped);

  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cx} r={r} stroke={colors.line} strokeWidth={stroke} fill="none" />
      <Circle
        cx={cx}
        cy={cx}
        r={r}
        stroke={colors.accent}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={`${c} ${c}`}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${cx} ${cx})`}
      />
      <SvgText x={cx} y={cx + 4} fontSize={18} fontWeight="600" fill={colors.text} textAnchor="middle">
        {value}
      </SvgText>
      <SvgText x={cx} y={cx + 18} fontSize={9} fill={colors.muted} textAnchor="middle">
        {unit}
      </SvgText>
    </Svg>
  );
}

export function DonutRing({
  segments,
  centerValue,
  centerUnit,
  size = 96,
}: {
  segments: { value: number; color: string }[];
  centerValue: string;
  centerUnit: string;
  size?: number;
}) {
  const stroke = 8;
  const r = (size - stroke * 2) / 2;
  const c = 2 * Math.PI * r;
  const cx = size / 2;
  const colors = useColors();
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  let acc = 0;

  return (
    <Svg width={size} height={size}>
      <Circle cx={cx} cy={cx} r={r} stroke={colors.line} strokeWidth={stroke} fill="none" />
      {segments
        .filter((segment) => segment.value > 0)
        .map((segment, index) => {
          const len = c * (segment.value / total);
          const element = (
            <Circle
              key={index}
              cx={cx}
              cy={cx}
              r={r}
              stroke={segment.color}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${len} ${c - len}`}
              strokeDashoffset={-acc}
              transform={`rotate(-90 ${cx} ${cx})`}
            />
          );
          acc += len;
          return element;
        })}
      <SvgText x={cx} y={cx + 4} fontSize={18} fontWeight="600" fill={colors.text} textAnchor="middle">
        {centerValue}
      </SvgText>
      <SvgText x={cx} y={cx + 18} fontSize={9} fill={colors.muted} textAnchor="middle">
        {centerUnit}
      </SvgText>
    </Svg>
  );
}
