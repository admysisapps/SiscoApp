import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";

interface Payment {
  id: string;
  apartment: string;
  owner: string;
  amount: number;
  dueDate: string;
  status: "pending" | "overdue" | "paid";
  daysOverdue?: number;
}

const mockPayments: Payment[] = [
  {
    id: "1",
    apartment: "Apto 101",
    owner: "María González",
    amount: 450000,
    dueDate: "2024-01-05",
    status: "overdue",
    daysOverdue: 15,
  },
  {
    id: "2",
    apartment: "Apto 205",
    owner: "Carlos Rodríguez",
    amount: 450000,
    dueDate: "2024-01-10",
    status: "overdue",
    daysOverdue: 10,
  },
  {
    id: "3",
    apartment: "Apto 304",
    owner: "Ana Martínez",
    amount: 450000,
    dueDate: "2024-01-15",
    status: "pending",
  },
  {
    id: "4",
    apartment: "Apto 402",
    owner: "Luis Herrera",
    amount: 450000,
    dueDate: "2024-01-20",
    status: "pending",
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

const getStatusColor = (status: string) => {
  switch (status) {
    case "overdue":
      return "#EF4444";
    case "pending":
      return "#F59E0B";
    case "paid":
      return "#10B981";
    default:
      return THEME.colors.text.secondary;
  }
};

const getStatusText = (payment: Payment) => {
  if (payment.status === "overdue") {
    return `${payment.daysOverdue} días vencido`;
  }
  if (payment.status === "pending") {
    return "Pendiente";
  }
  return "Pagado";
};

export default function ProximosPagos() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Próximos Vencimientos</Text>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>Ver todos</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={THEME.colors.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.paymentsList}>
        {mockPayments.map((payment) => (
          <View key={payment.id} style={styles.paymentItem}>
            <View style={styles.paymentInfo}>
              <View style={styles.apartmentInfo}>
                <Text style={styles.apartmentText}>{payment.apartment}</Text>
                <Text style={styles.ownerText}>{payment.owner}</Text>
              </View>

              <View style={styles.paymentDetails}>
                <Text style={styles.amountText}>
                  {formatCurrency(payment.amount)}
                </Text>
                <Text
                  style={[
                    styles.statusText,
                    { color: getStatusColor(payment.status) },
                  ]}
                >
                  {getStatusText(payment)}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: getStatusColor(payment.status) },
              ]}
            />
          </View>
        ))}
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Pendiente</Text>
          <Text style={styles.summaryAmount}>
            {formatCurrency(mockPayments.reduce((sum, p) => sum + p.amount, 0))}
          </Text>
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
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: THEME.colors.primary,
    fontWeight: "500",
  },
  paymentsList: {
    gap: 12,
  },
  paymentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  paymentInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  apartmentInfo: {
    flex: 1,
  },
  apartmentText: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  ownerText: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  paymentDetails: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  statusIndicator: {
    width: 4,
    height: 40,
    borderRadius: 2,
    marginLeft: 12,
  },
  summary: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.text.secondary,
  },
  summaryAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.colors.primary,
  },
});
