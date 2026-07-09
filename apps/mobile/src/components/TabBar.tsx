import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../theme";

export type TabId = "home" | "history" | "insights" | "settings";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "home", label: "Home", icon: "☀️" },
  { id: "history", label: "History", icon: "🗂️" },
  { id: "insights", label: "Insights", icon: "📊" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

export function TabBar({ active, onChange }: { active: TabId; onChange: (tab: TabId) => void }) {
  return (
    <View style={styles.bar}>
      {TABS.map((tab) => {
        const on = tab.id === active;
        return (
          <Pressable key={tab.id} style={styles.tab} onPress={() => onChange(tab.id)}>
            <Text style={[styles.icon, { opacity: on ? 1 : 0.5 }]}>{tab.icon}</Text>
            <Text style={[styles.label, on && styles.labelOn]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.line,
    backgroundColor: colors.panel,
    paddingTop: 8,
    paddingBottom: 12,
  },
  tab: { flex: 1, alignItems: "center" },
  icon: { fontSize: 20 },
  label: { fontSize: 11, marginTop: 3, color: colors.dim },
  labelOn: { color: colors.accent },
});
