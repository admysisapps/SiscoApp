import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View, Text } from "react-native";

import { THEME } from "@/constants/theme";

const ACTIONS = [
  {
    id: "send",
    label: "Gastos",
    icon: "cash-outline" as const,
    color: THEME.colors.primary,
  },
  {
    id: "receive",
    label: "Documentos",
    icon: "document-text-outline" as const,
    color: THEME.colors.secondary,
  },
  {
    id: "swap",
    label: "Proyectos",
    icon: "construct-outline" as const,
    color: THEME.colors.accent,
  },
  {
    id: "buy",
    label: "Servicios",
    icon: "grid-outline" as const,
    color: THEME.colors.success,
  },
];

interface ActionButtonsProps {
  onSendBy: () => void;
  onReceive: () => void;
  onSwap: () => void;
  onBuy: () => void;
}

export const BotonesAccion = ({
  onSendBy,
  onReceive,
  onSwap,
  onBuy,
}: ActionButtonsProps) => {
  return (
    <View style={styles.container}>
      {ACTIONS.map((action) => (
        <View key={action.id} style={styles.actionItem}>
          <TouchableOpacity
            onPress={() => {
              if (action.id === "send") onSendBy();
              if (action.id === "receive") onReceive();
              if (action.id === "swap") onSwap();
              if (action.id === "buy") onBuy();
            }}
            style={[
              styles.button,
              {
                shadowColor: action.color,
                borderColor: THEME.colors.border,
              },
            ]}
            activeOpacity={0.8}
          >
            <Ionicons name={action.icon} size={24} color={action.color} />
          </TouchableOpacity>
          <Text style={styles.label}>{action.label}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
  },
  actionItem: {
    alignItems: "center",
    gap: THEME.spacing.sm,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: THEME.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    backgroundColor: THEME.colors.surface,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  label: {
    color: THEME.colors.text.secondary,
    fontSize: THEME.fontSize.xs,
    fontWeight: "500",
  },
});
