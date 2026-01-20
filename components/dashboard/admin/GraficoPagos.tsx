import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { THEME } from "@/constants/theme";

const { width } = Dimensions.get("window");

interface PaymentData {
  month: string;
  amount: number;
  collected: number;
}

const mockData: PaymentData[] = [
  { month: "Jul", amount: 45000000, collected: 42000000 },
  { month: "Ago", amount: 45000000, collected: 45000000 },
  { month: "Sep", amount: 45000000, collected: 38000000 },
  { month: "Oct", amount: 45000000, collected: 44000000 },
  { month: "Nov", amount: 45000000, collected: 41000000 },
  { month: "Dic", amount: 45000000, collected: 43500000 },
];

export default function GraficoPagos() {
  const maxAmount = Math.max(...mockData.map((d) => d.amount));
  const chartWidth = width - 80;
  const barWidth = (chartWidth - 60) / mockData.length / 2;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pagos Últimos 6 Meses</Text>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendColor,
              { backgroundColor: THEME.colors.primary },
            ]}
          />
          <Text style={styles.legendText}>Esperado</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#10B981" }]} />
          <Text style={styles.legendText}>Recaudado</Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {mockData.map((data, index) => {
            const expectedHeight = (data.amount / maxAmount) * 120;
            const collectedHeight = (data.collected / maxAmount) * 120;

            return (
              <View key={data.month} style={styles.barGroup}>
                <View style={styles.bars}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: expectedHeight,
                        backgroundColor: THEME.colors.primary,
                        width: barWidth,
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.bar,
                      {
                        height: collectedHeight,
                        backgroundColor: "#10B981",
                        width: barWidth,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.monthLabel}>{data.month}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: 16,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    gap: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
  },
  chartContainer: {
    alignItems: "center",
  },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    height: 140,
    gap: 8,
  },
  barGroup: {
    alignItems: "center",
    flex: 1,
  },
  bars: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    marginBottom: 8,
  },
  bar: {
    borderRadius: 2,
    minHeight: 4,
  },
  monthLabel: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
  },
});
