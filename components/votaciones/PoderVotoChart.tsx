import React, { useMemo, useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { THEME } from "@/constants/theme";
import { Participante } from "@/services/cache/quorumCacheService";

interface PoderVotoChartProps {
  participantes: Participante[];
}

export const PoderVotoChart: React.FC<PoderVotoChartProps> = ({
  participantes,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  useEffect(() => {
    fadeAnim.setValue(0);
    scaleAnim.setValue(0.95);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [participantes.length, fadeAnim, scaleAnim]);
  const chartData = useMemo(() => {
    const colors = [
      "#3B82F6",
      "#10B981",
      "#F59E0B",
      "#8B5CF6",
      "#EC4899",
      "#14B8A6",
      "#F97316",
      "#6366F1",
    ];
    const presentes = participantes.filter((p) => p.presente);
    const top = presentes
      .sort((a, b) => b.coeficiente - a.coeficiente)
      .slice(0, 8);

    const otros = presentes.slice(8);
    const otrosTotal =
      otros.length > 0 ? otros.reduce((sum, p) => sum + p.coeficiente, 0) : 0;

    const data = top.map((p, i) => ({
      value: p.coeficiente * 100,
      color: colors[i],
      text: `${(p.coeficiente * 100).toFixed(1)}%`,
      label: p.nombre.split(" ").slice(0, 2).join(" "),
    }));

    if (otros.length > 0) {
      data.push({
        value: otrosTotal * 100,
        color: "#94A3B8",
        text: `${(otrosTotal * 100).toFixed(1)}%`,
        label: `Otros (${otros.length})`,
      });
    }

    return data;
  }, [participantes]);

  const presentes = participantes.filter((p) => p.presente);
  const totalCoeficiente =
    presentes.length > 0
      ? presentes.reduce((sum, p) => sum + p.coeficiente, 0)
      : 0;

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
      ]}
    >
      <Text style={styles.title}>Distribución de Poder de Voto</Text>

      <View style={styles.chartContainer}>
        <PieChart
          data={chartData}
          radius={80}
          innerRadius={50}
          centerLabelComponent={() => (
            <View style={styles.centerLabel}>
              <Text style={styles.centerPercentage}>
                {(totalCoeficiente * 100).toFixed(1)}%
              </Text>
              <Text style={styles.centerText}>Quórum</Text>
            </View>
          )}
        />
      </View>

      <View style={styles.statsContainer}>
        {chartData.map((item, index) => (
          <View key={index} style={styles.statItem}>
            <View style={styles.statLeft}>
              <View
                style={[styles.colorDot, { backgroundColor: item.color }]}
              />
              <Text style={styles.statLabel} numberOfLines={1}>
                {item.label}
              </Text>
            </View>
            <Text style={styles.statValue}>{item.text}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    alignItems: "center",
  },
  title: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: THEME.spacing.lg,
  },
  chartContainer: {
    marginBottom: THEME.spacing.lg,
  },
  centerLabel: {
    alignItems: "center",
  },
  centerPercentage: {
    fontSize: THEME.fontSize.xl,
    fontWeight: "bold",
    color: THEME.colors.text.primary,
  },
  centerText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
  },
  statsContainer: {
    width: "100%",
  },
  statItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  statLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: THEME.spacing.sm,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statLabel: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    flex: 1,
  },
  statValue: {
    fontSize: THEME.fontSize.sm,
    fontWeight: "600",
    color: THEME.colors.primary,
  },
});
