import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { THEME } from "@/constants/theme";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const UserPaymentStatus = React.memo(function UserPaymentStatus() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Estado de Pagos</Text>
        <TouchableOpacity
          style={styles.payButton}
          onPress={() =>
            console.log("Navegar a pagos - Pendiente implementar PSE")
          }
        >
          <Ionicons name="card" size={16} color="white" />
          <Text style={styles.payButtonText}>Pagar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={styles.statusInfo}>
            <View style={styles.statusBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.statusText}>Al día</Text>
            </View>
            <Text style={styles.currentAmount}>{formatCurrency(450000)}</Text>
            <Text style={styles.currentLabel}>Cuota mensual</Text>
          </View>
        </View>

        <View style={styles.paymentDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Último pago</Text>
            <Text style={styles.detailValue}>15 Ene 2024</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Próximo vencimiento</Text>
            <Text style={[styles.detailValue, { color: THEME.colors.primary }]}>
              15 Feb 2024
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Días restantes</Text>
            <Text style={styles.detailValue}>12 días</Text>
          </View>
        </View>
      </View>

      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Historial Reciente</Text>
        <View style={styles.historyList}>
          {[
            { date: "15 Ene 2024", amount: 450000, status: "paid" },
            { date: "15 Dic 2023", amount: 450000, status: "paid" },
            { date: "15 Nov 2023", amount: 450000, status: "paid" },
          ].map((payment, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyInfo}>
                <Text style={styles.historyDate}>{payment.date}</Text>
                <Text style={styles.historyAmount}>
                  {formatCurrency(payment.amount)}
                </Text>
              </View>
              <View style={styles.historyStatus}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
});

export default UserPaymentStatus;

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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  payButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  statusCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  statusHeader: {
    marginBottom: 16,
  },
  statusInfo: {
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B98120",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#10B981",
  },
  currentAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: THEME.colors.text.primary,
    marginBottom: 4,
  },
  currentLabel: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
  },
  paymentDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: THEME.colors.text.primary,
  },
  historySection: {
    marginTop: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: 12,
  },
  historyList: {
    gap: 8,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: "500",
    color: THEME.colors.text.primary,
  },
  historyAmount: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  historyStatus: {
    marginLeft: 12,
  },
});
