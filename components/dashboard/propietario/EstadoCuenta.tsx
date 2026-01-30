import { THEME } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const EstadoCuenta = React.memo(function EstadoCuenta() {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.section}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons
              name="time-outline"
              size={18}
              color={THEME.colors.text.secondary}
            />
            <Text style={styles.title}>Estado de cuenta</Text>
          </View>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={THEME.colors.text.secondary}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.list}>
          {[
            { periodo: "12-2025", amount: 450000, status: "paid" },
            { periodo: "11-2025", amount: 450000, status: "paid" },
            { periodo: "10-2025", amount: 450000, status: "paid" },
            { periodo: "09-2025", amount: 450000, status: "paid" },
            { periodo: "08-2025", amount: 450000, status: "paid" },
          ].map((payment, index) => (
            <View key={index} style={styles.item}>
              <View style={styles.info}>
                <Text style={styles.date}>{payment.periodo}</Text>
                <Text style={styles.amount}>
                  {formatCurrency(payment.amount)}
                </Text>
              </View>
              <View style={styles.status}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
});

export default EstadoCuenta;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  list: {
    marginTop: 12,
    gap: 8,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
  },
  info: {
    flex: 1,
  },
  date: {
    fontSize: 13,
    color: THEME.colors.text.secondary,
    marginBottom: 4,
  },
  amount: {
    fontSize: 15,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  status: {
    marginLeft: 12,
  },
});
