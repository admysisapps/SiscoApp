import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";

interface FinancialMetric {
  title: string;
  amount: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  trend?: number;
}

const mockData: FinancialMetric[] = [
  {
    title: "Utilidad del Ejercicio",
    amount: 101218018.41,
    icon: "trending-up",
    color: "#10B981",
  },
  {
    title: "Total Pasivo",
    amount: 55196879,
    icon: "trending-down",
    color: "#EF4444",
  },
  {
    title: "Cartera de Clientes",
    amount: 276756480.9,
    icon: "warning",
    color: "#F59E0B",
  },
  {
    title: "Saldo Disponible",
    amount: 36337201.33,
    icon: "wallet",
    color: "#3B82F6",
  },
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export default function FinancialStatus() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estado Financiero del Conjunto</Text>

      <View style={styles.metricsGrid}>
        {mockData.map((metric, index) => (
          <View key={index} style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${metric.color}20` },
                ]}
              >
                <Ionicons name={metric.icon} size={20} color={metric.color} />
              </View>
              {metric.trend && (
                <View style={styles.trendContainer}>
                  <Ionicons
                    name={metric.trend > 0 ? "arrow-up" : "arrow-down"}
                    size={12}
                    color={metric.trend > 0 ? "#10B981" : "#EF4444"}
                  />
                  <Text
                    style={[
                      styles.trendText,
                      { color: metric.trend > 0 ? "#10B981" : "#EF4444" },
                    ]}
                  >
                    {Math.abs(metric.trend)}%
                  </Text>
                </View>
              )}
            </View>

            <Text style={styles.metricTitle}>{metric.title}</Text>
            <Text style={[styles.metricAmount, { color: metric.color }]}>
              {formatCurrency(metric.amount)}
            </Text>
          </View>
        ))}
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
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 12,
  },
  metricHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  trendContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  trendText: {
    fontSize: 10,
    fontWeight: "600",
  },
  metricTitle: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    marginBottom: 4,
  },
  metricAmount: {
    fontSize: 16,
    fontWeight: "700",
  },
});
