import cors from "cors";
import express from "express";
import { buildInsightFromEntry, buildWeeklySummary } from "./services/insights";
import { mockWeatherSnapshot, weatherSnapshot } from "./services/weather";
import type { DecisionLogInput, WeeklySummary } from "@weathered/shared";

const app = express();
const port = Number(process.env.PORT || 4000);

const entries: DecisionLogInput[] = [];

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "weathered-api" });
});

app.get("/context/weather", async (req, res) => {
  const mode =
    req.query.mode === "live_ready" ? "live_ready" : req.query.mode === "seasonal_mock" ? "seasonal_mock" : "daily_mock";
  res.json(await weatherSnapshot(mode));
});

app.get("/entries", (_req, res) => {
  res.json({ entries });
});

app.post("/entries", (req, res) => {
  const incoming = req.body as Omit<DecisionLogInput, "id" | "weather" | "timestamp"> & {
    timestamp?: string;
  };

  const entry: DecisionLogInput = {
    id: `entry-${Date.now()}`,
    ...incoming,
    weather: mockWeatherSnapshot(),
    timestamp: incoming.timestamp || new Date().toISOString(),
  };

  entries.push(entry);

  res.status(201).json({
    entry,
    insight: buildInsightFromEntry(entry, entries),
  });
});

app.get("/summary/weekly", (_req, res) => {
  const summary: WeeklySummary = buildWeeklySummary(entries);
  res.json(summary);
});

app.listen(port, () => {
  console.log(`Weathered API listening on port ${port}`);
});
