import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import {
  DECISION_CATEGORIES,
  DECISION_OPTIONS,
  ENERGY_LEVELS,
  type DecisionCategory,
  type DecisionLogInput,
  type DecisionOption,
  type EnergyLevel,
} from "@weathered/shared";
import { colors } from "../theme";
import { CATEGORY_LABEL, ENERGY_LABEL, outcomeLabel, relativeTime } from "../format";
import { Card, Chip, Label, MoodScale, PrimaryButton, ScreenHeader } from "../components/ui";

export interface EditingState {
  id: string;
  mood: number;
  energy: EnergyLevel;
  category: DecisionCategory;
  outcome: DecisionOption;
  note: string;
}

export function HistoryScreen({
  entries,
  editing,
  onStartEdit,
  onChangeEditing,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onLoadSample,
  onClear,
}: {
  entries: DecisionLogInput[];
  editing: EditingState | null;
  onStartEdit: (entry: DecisionLogInput) => void;
  onChangeEditing: (patch: Partial<EditingState>) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  onLoadSample: () => void;
  onClear: () => void;
}) {
  return (
    <View>
      <ScreenHeader eyebrow="History" title="Your check-ins" subtitle="Review what changed and the conditions behind it." />

      {entries.length === 0 ? (
        <Card>
          <Text style={styles.empty}>No check-ins yet. Log one from the Home tab.</Text>
          <View style={{ height: 10 }} />
          <PrimaryButton label="Load sample data" onPress={onLoadSample} tone="ghost" />
        </Card>
      ) : null}

      {entries.map((entry) =>
        editing && editing.id === entry.id ? (
          <Card key={entry.id} style={styles.editCard}>
            <Label>Mood</Label>
            <MoodScale value={editing.mood} onChange={(mood) => onChangeEditing({ mood })} />
            <Label>Energy</Label>
            <View style={styles.chipRow}>
              {ENERGY_LEVELS.map((level) => (
                <Chip key={level} label={ENERGY_LABEL[level]} selected={editing.energy === level} onPress={() => onChangeEditing({ energy: level })} />
              ))}
            </View>
            <Label>Decision</Label>
            <View style={styles.chipRow}>
              {DECISION_CATEGORIES.map((item) => (
                <Chip
                  key={item}
                  label={CATEGORY_LABEL[item]}
                  selected={editing.category === item}
                  onPress={() => onChangeEditing({ category: item, outcome: DECISION_OPTIONS[item][0] })}
                />
              ))}
            </View>
            <View style={styles.chipRow}>
              {DECISION_OPTIONS[editing.category].map((item) => (
                <Chip key={item} label={outcomeLabel(item)} selected={editing.outcome === item} onPress={() => onChangeEditing({ outcome: item })} />
              ))}
            </View>
            <Label>Note</Label>
            <TextInput
              style={styles.note}
              value={editing.note}
              onChangeText={(note) => onChangeEditing({ note })}
              maxLength={120}
              multiline
              placeholder="Note…"
              placeholderTextColor={colors.dim}
            />
            <View style={{ height: 12 }} />
            <PrimaryButton label="Save changes" onPress={onSaveEdit} />
            <View style={{ height: 8 }} />
            <PrimaryButton label="Cancel" onPress={onCancelEdit} tone="ghost" />
          </Card>
        ) : (
          <Card key={entry.id} style={styles.entry}>
            <View style={styles.entryTop}>
              <Text style={styles.entryTags}>
                {CATEGORY_LABEL[entry.decisionCategory]} · {outcomeLabel(entry.decisionOutcome)}
              </Text>
              <Text style={styles.entryWhen}>{relativeTime(entry.timestamp)}</Text>
            </View>
            <Text style={styles.entryMeta}>
              Mood {entry.mood}/10 · {ENERGY_LABEL[entry.energy].toLowerCase()} energy · {entry.weather.condition}
              {entry.note ? ` · "${entry.note}"` : ""}
            </Text>
            <View style={styles.entryActions}>
              <Pressable style={styles.actionBtn} onPress={() => onStartEdit(entry)}>
                <Text style={styles.actionText}>Edit</Text>
              </Pressable>
              <Pressable style={styles.actionBtn} onPress={() => onDelete(entry.id)}>
                <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
              </Pressable>
            </View>
          </Card>
        ),
      )}

      {entries.length > 0 ? (
        <View style={{ marginTop: 4 }}>
          <PrimaryButton label="Load sample data" onPress={onLoadSample} tone="ghost" />
          <View style={{ height: 8 }} />
          <PrimaryButton label="Clear all entries" onPress={onClear} tone="ghost" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.dim, fontSize: 13, textAlign: "center" },
  editCard: { borderWidth: 1, borderColor: colors.accent },
  chipRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 6 },
  note: { backgroundColor: colors.card2, borderRadius: 10, color: colors.text, fontSize: 13, padding: 10, minHeight: 48, textAlignVertical: "top" },
  entry: {},
  entryTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  entryTags: { fontSize: 13, color: colors.text, fontWeight: "600" },
  entryWhen: { fontSize: 12, color: colors.dim },
  entryMeta: { fontSize: 12, color: colors.muted, lineHeight: 18 },
  entryActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  actionBtn: { flex: 1, backgroundColor: colors.card2, borderRadius: 8, paddingVertical: 7, alignItems: "center" },
  actionText: { fontSize: 12, color: colors.muted },
  deleteText: { color: colors.danger },
});
