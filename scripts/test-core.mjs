import assert from "node:assert/strict";
import { normalizeBackupPayload } from "../apps/mobile/src/lib/backupValidation.ts";

const validEntry = {
  id: "entry-1",
  userId: "local",
  mood: 7,
  energy: "medium",
  decisionCategory: "social",
  decisionOutcome: "go_out",
  note: "felt ready",
  weather: {
    condition: "cloudy",
    temperatureC: 24,
    humidity: 62,
    locationLabel: "Bengaluru",
  },
  timestamp: "2026-06-21T11:00:00.000Z",
};

const validPayload = {
  app: "weathered",
  version: 1,
  exportedAt: "2026-06-21T11:01:00.000Z",
  entries: [validEntry],
  feedback: [
    {
      nudgeId: "nudge-1",
      value: "helpful",
      timestamp: "2026-06-21T11:02:00.000Z",
    },
  ],
};

const normalized = normalizeBackupPayload(validPayload);
assert.ok(normalized, "valid backup payload should normalize");
assert.equal(normalized.entries.length, 1);
assert.equal(normalized.entries[0].decisionOutcome, "go_out");
assert.equal(normalized.feedback.length, 1);

const missingIdentityPayload = {
  ...validPayload,
  entries: [{ ...validEntry, id: "", userId: "" }],
};
const normalizedMissingIdentity = normalizeBackupPayload(missingIdentityPayload);
assert.ok(normalizedMissingIdentity, "backup entries without ids should be migrated");
assert.match(normalizedMissingIdentity.entries[0].id, /^restored-/);
assert.equal(normalizedMissingIdentity.entries[0].userId, "local");

assert.equal(
  normalizeBackupPayload({ ...validPayload, entries: [{ ...validEntry, mood: 11 }] }),
  null,
  "mood above 10 should be rejected",
);

assert.equal(
  normalizeBackupPayload({
    ...validPayload,
    entries: [{ ...validEntry, weather: { ...validEntry.weather, humidity: 130 } }],
  }),
  null,
  "humidity above 100 should be rejected",
);

const invalidFeedbackPayload = {
  ...validPayload,
  feedback: [{ nudgeId: "nudge-1", value: "later", timestamp: "2026-06-21T11:02:00.000Z" }],
};
const normalizedInvalidFeedback = normalizeBackupPayload(invalidFeedbackPayload);
assert.ok(normalizedInvalidFeedback, "invalid feedback should not invalidate valid entries");
assert.equal(normalizedInvalidFeedback.feedback.length, 0);

console.log("Core smoke tests passed.");
