import React from "react";
import { StyleSheet, TouchableOpacity, View, Text } from "react-native";

import { THEME } from "@/constants/theme";

interface AssetRowProps {
  asset: {
    id: string;
    nombre: string;
    tipo: string;
    valor: number;
    cambio: number;
    periodo: string;
    color: string;
  };
  onPress: () => void;
}

export const FilaActivo = ({ asset, onPress }: AssetRowProps) => {
  const isPositive = asset.cambio >= 0;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.container}
      activeOpacity={0.7}
    >
      <View style={styles.leftSection}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${asset.color}20` },
          ]}
        >
          <Text style={[styles.iconText, { color: asset.color }]}>
            {asset.tipo[0]}
          </Text>
        </View>
        <View>
          <Text style={styles.name}>{asset.nombre}</Text>
          <Text style={styles.amount}>
            {asset.tipo} • {asset.periodo}
          </Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text style={styles.value}>${(asset.valor / 1000000).toFixed(1)}M</Text>
        <Text
          style={[
            styles.change,
            { color: isPositive ? THEME.colors.success : THEME.colors.error },
          ]}
        >
          {isPositive ? "+" : ""}
          {asset.cambio}%
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.xl,
  },
  leftSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME.spacing.md,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: THEME.borderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontWeight: "bold",
    fontSize: THEME.fontSize.xs,
  },
  name: {
    color: THEME.colors.text.primary,
    fontWeight: "bold",
    fontSize: THEME.fontSize.md,
  },
  amount: {
    color: THEME.colors.text.secondary,
    fontSize: THEME.fontSize.xs,
  },
  rightSection: {
    alignItems: "flex-end",
  },
  value: {
    color: THEME.colors.text.primary,
    fontWeight: "bold",
    fontSize: THEME.fontSize.md,
  },
  change: {
    fontSize: THEME.fontSize.xs,
    fontWeight: "500",
  },
});
