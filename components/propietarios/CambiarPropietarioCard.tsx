import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME, COLORS } from "@/constants/theme";

interface CambiarPropietarioCardProps {
  onPress: () => void;
}

export const CambiarPropietarioCard: React.FC<CambiarPropietarioCardProps> = ({
  onPress,
}) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.iconContainer}>
        <Ionicons name="swap-horizontal" size={26} color={COLORS.primary} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Cambiar Propietario</Text>
        <Text style={styles.description}>
          Asignar el acceso de propietarios a sus inmuebles
        </Text>
      </View>

      <View style={styles.arrow}></View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: THEME.spacing.md,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  description: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  arrow: {
    marginLeft: THEME.spacing.sm,
  },
});
