import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { THEME } from "@/constants/theme";
import { Octicons } from "@expo/vector-icons";

interface AsistenciaChartProps {
  presentes: number;
  ausentes: number;
}

export const AsistenciaChart: React.FC<AsistenciaChartProps> = ({
  presentes,
  ausentes,
}) => {
  const total = presentes + ausentes;
  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Octicons name="feed-person" size={18} color={THEME.colors.success} />
          <Text style={styles.statNumber}>{presentes}</Text>
          <Text style={styles.statLabel}>Presentes</Text>
        </View>
        <View style={styles.statCard}>
          <Octicons name="feed-person" size={18} color={THEME.colors.error} />
          <Text style={styles.statNumber}>{ausentes}</Text>
          <Text style={styles.statLabel}>Ausentes</Text>
        </View>
        <View style={styles.statCard}>
          <Octicons name="people" size={18} color={THEME.colors.primary} />
          <Text style={styles.statNumber}>{total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: THEME.spacing.md,
    paddingTop: THEME.spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    gap: THEME.spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.sm,
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  statNumber: {
    fontSize: THEME.fontSize.xl,
    fontWeight: "700",
    color: THEME.colors.text.primary,
  },
  statLabel: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
  },
});
