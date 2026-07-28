import React from "react";
import { View } from "react-native";
import Svg, { Circle, Defs, LinearGradient, Line, Path, Rect, Stop } from "react-native-svg";
import type { DayPart } from "../lib/dayParts";

export function DayPartVisual({
  part,
  width = "100%",
  height = 46,
  idSuffix = part,
}: {
  part: DayPart;
  width?: number | `${number}%`;
  height?: number;
  idSuffix?: string;
}) {
  const gradientId = `day-sky-${idSuffix}`;

  return (
    <View
      accessible
      accessibilityLabel={`${part} sky illustration`}
      style={{ width, height, borderRadius: 8, overflow: "hidden" }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 160 50">
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={skyColors[part][0]} />
            <Stop offset="1" stopColor={skyColors[part][1]} />
          </LinearGradient>
        </Defs>
        <Rect width="160" height="50" rx="8" fill={`url(#${gradientId})`} />
        {part === "morning" ? <MorningScene /> : null}
        {part === "afternoon" ? <AfternoonScene /> : null}
        {part === "evening" ? <EveningScene /> : null}
        {part === "night" ? <NightScene /> : null}
      </Svg>
    </View>
  );
}

const skyColors: Record<DayPart, [string, string]> = {
  morning: ["#6f8fb0", "#efb178"],
  afternoon: ["#4b91c6", "#96c9df"],
  evening: ["#67517e", "#df7e68"],
  night: ["#111b3d", "#31416d"],
};

function MorningScene() {
  return (
    <>
      <Circle cx="34" cy="39" r="10" fill="#ffd889" />
      {[14, 22, 30, 38, 46, 54].map((x) => (
        <Line key={x} x1={x} y1="23" x2={x < 34 ? x - 4 : x + 4} y2="29" stroke="#ffe4aa" strokeWidth="1.5" />
      ))}
      <Path d="M0 43 L30 31 L56 43 L83 34 L112 43 L138 35 L160 43 V50 H0 Z" fill="#36574f" opacity="0.9" />
      <Path d="M0 45 Q45 38 83 45 T160 43 V50 H0 Z" fill="#223f3a" />
    </>
  );
}

function AfternoonScene() {
  return (
    <>
      <Circle cx="126" cy="15" r="8" fill="#ffe28b" />
      <Circle cx="47" cy="21" r="7" fill="#eaf5f8" opacity="0.9" />
      <Circle cx="56" cy="18" r="9" fill="#eaf5f8" opacity="0.9" />
      <Circle cx="67" cy="22" r="7" fill="#eaf5f8" opacity="0.9" />
      <Rect x="45" y="21" width="24" height="7" rx="3.5" fill="#eaf5f8" opacity="0.9" />
      <Path d="M0 44 Q38 38 75 43 T160 41 V50 H0 Z" fill="#3f725e" />
    </>
  );
}

function EveningScene() {
  return (
    <>
      <Circle cx="112" cy="36" r="11" fill="#ffc477" />
      <Line x1="0" y1="37" x2="160" y2="37" stroke="#f4ba89" strokeWidth="1" opacity="0.7" />
      <Path d="M0 42 L18 34 L34 42 L58 30 L78 42 L103 33 L125 42 L143 35 L160 42 V50 H0 Z" fill="#34424b" />
      <Path d="M0 45 Q35 40 69 45 T136 43 T160 44 V50 H0 Z" fill="#23343a" />
    </>
  );
}

function NightScene() {
  return (
    <>
      <Circle cx="119" cy="18" r="10" fill="#f3edc5" />
      <Circle cx="124" cy="14" r="10" fill="#26345f" />
      <Circle cx="28" cy="13" r="1.4" fill="#f7f1c9" />
      <Circle cx="50" cy="25" r="1" fill="#f7f1c9" />
      <Circle cx="76" cy="11" r="1.2" fill="#f7f1c9" />
      <Circle cx="94" cy="28" r="1" fill="#f7f1c9" />
      <Circle cx="143" cy="30" r="1.3" fill="#f7f1c9" />
      <Path d="M0 43 L27 36 L48 43 L73 34 L98 43 L126 35 L160 43 V50 H0 Z" fill="#172b35" />
    </>
  );
}
