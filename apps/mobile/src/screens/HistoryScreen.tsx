import React, { useMemo, useState } from "react";
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
import { useColors, type Palette } from "../theme";
import { CATEGORY_LABEL, ENERGY_LABEL, outcomeLabel, relativeTime } from "../format";
import { Card, Chip, Label, MoodScale, PrimaryButton, ScreenHeader } from "../components/ui";
import { filterHistoryEntries, groupEntriesByDay, type HistoryCategoryFilter } from "../lib/history";

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
  const colors = useColors();
  const styles = makeStyles(colors);
  const [filter, setFilter] = useState<HistoryCategoryFilter>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => filterHistoryEntries(entries, { category: filter, query }), [entries, filter, query]);
  const groups = useMemo(() => groupEntriesByDay(visible), [visible]);

  function renderEntry(entry: DecisionLogInput) {
    if (editing && editing.id === entry.id) {
      return (
        <Card key={entry.id} style={styles.editCard}>
          <Label>Mood</Label>
          <MoodScale value={editing.mood} onChange={(mood) => onChangeEditing({ mood })} />
          <Label>Energy</Label>
          <View style={styles.chipRow}>
            {ENERGY_LEVELS.map((level) => (
              <Chip
                key={level}
                label={ENERGY_LABEL[level]}
                selected={editing.energy === level}
                onPress={() => onChangeEditing({ energy: level })}
              />
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
              <Chip
                key={item}
                label={outcomeLabel(item)}
                selected={editing.outcome === item}
                onPress={() => onChangeEditing({ outcome: item })}
              />
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
      );
    }

    return (
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
          <Pressable
            style={styles.actionBtn}
            onPress={() => onStartEdit(entry)}
            accessibilityRole="button"
            accessibilityLabel="Edit this check-in"
          >
            <Text style={styles.actionText}>Edit</Text>
          </Pressable>
          <Pressable
            style={styles.actionBtn}
            onPress={() => onDelete(entry.id)}
            accessibilityRole="button"
            accessibilityLabel="Delete this check-in"
          >
            <Text style={[styles.actionText, styles.deleteText]}>Delete</Text>
          </Pressable>
        </View>
      </Card>
    );
  }

  return (
    <View>
      <ScreenHeader
        eyebrow="History"
        title="Your check-ins"
        subtitle="Review what changed and the conditions behind it."
      />

      {entries.length === 0 ? (
        <Card>
          <Text style={styles.empty}>No check-ins yet. Log one from the Home tab.</Text>
          <View style={{ height: 10 }} />
          <PrimaryButton label="Load sample data" onPress={onLoadSample} tone="ghost" />
        </Card>
      ) : null}

      {entries.length > 0 ? (
        <View style={styles.filters}>
          <View style={styles.chipRow}>
            <Chip label="All" selected={filter === "all"} onPress={() => setFilter("all")} />
            {DECISION_CATEGORIES.map((item) => (
              <Chip
                key={item}
                label={CATEGORY_LABEL[item]}
                selected={filter === item}
                onPress={() => setFilter(item)}
              />
            ))}
          </View>
          <TextInput
            style={styles.search}
            value={query}
            onChangeText={setQuery}
            placeholder="Search notes and conditions…"
            placeholderTextColor={colors.dim}
            accessibilityLabel="Search check-ins"
          />
        </View>
      ) : null}

      {entries.length > 0 && visible.length === 0 ? (
        <Card>
          <Text style={styles.empty}>No check-ins match this filter.</Text>
        </Card>
      ) : null}

      {groups.map((group) => (
        <View key={group.key}>
          <Text style={styles.dayHeader}>{group.label}</Text>
          {group.entries.map((entry) => renderEntry(entry))}
        </View>
      ))}

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

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    empty: { color: colors.dim, fontSize: 13, textAlign: "center" },
    filters: { marginBottom: 6 },
    search: {
      backgroundColor: colors.card2,
      borderRadius: 10,
      color: colors.text,
      fontSize: 13,
      paddingHorizontal: 12,
      paddingVertical: 9,
      marginBottom: 8,
    },
    dayHeader: {
      fontSize: 12,
      color: colors.dim,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 6,
      marginTop: 2,
    },
    editCard: { borderWidth: 1, borderColor: colors.accent },
    chipRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 6 },
    note: {
      backgroundColor: colors.card2,
      borderRadius: 10,
      color: colors.text,
      fontSize: 13,
      padding: 10,
      minHeight: 48,
      textAlignVertical: "top",
    },
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
