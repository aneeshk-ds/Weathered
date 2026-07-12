import React, { createContext, useContext } from "react";
import type { ThemeMode } from "@weathered/shared";

export const darkColors = {
  bg: "#0e1718",
  panel: "#0f1814",
  card: "#162120",
  card2: "#1d2b29",
  line: "#2c403b",
  text: "#eef5ef",
  muted: "#a6b5ad",
  dim: "#6b7d74",
  accent: "#8fb7a1",
  accentText: "#0d1715",
  chip: "#22312f",
  insightBg: "#342f20",
  insightText: "#eadcae",
  danger: "#e7b7ad",
  dangerBg: "#3c2828",
};

export const lightColors: typeof darkColors = {
  bg: "#f4f7f4",
  panel: "#eef3ee",
  card: "#ffffff",
  card2: "#e9efeb",
  line: "#d2ded7",
  text: "#16211d",
  muted: "#4f5f57",
  dim: "#859389",
  accent: "#3f7a5c",
  accentText: "#ffffff",
  chip: "#e2ebe4",
  insightBg: "#f4edcf",
  insightText: "#5b4e1f",
  danger: "#b5462f",
  dangerBg: "#f6e2dd",
};

export const categoryColors: Record<string, string> = {
  social: "#8fb7a1",
  work: "#7fb3e0",
  spending: "#cdb676",
  other: "#c98bd6",
};

export type Palette = typeof darkColors;
export type { ThemeMode };

export function paletteFor(mode: ThemeMode): Palette {
  return mode === "light" ? lightColors : darkColors;
}

const ThemeContext = createContext<Palette>(darkColors);

export function ThemeProvider({ mode, children }: { mode: ThemeMode; children: React.ReactNode }) {
  return <ThemeContext.Provider value={paletteFor(mode)}>{children}</ThemeContext.Provider>;
}

export function useColors(): Palette {
  return useContext(ThemeContext);
}
