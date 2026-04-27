import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { THEME } from "@/constants/theme";
import { TipoPeticion } from "@/types/Pqr";

interface PqrTipoSelectorProps {
  selected: TipoPeticion;
  onSelect: (tipo: TipoPeticion) => void;
}

const TIPOS: TipoPeticion[] = ["Petición", "Queja", "Reclamo"];

export default function PqrTipoSelector({
  selected,
  onSelect,
}: PqrTipoSelectorProps) {
  return (
    <View style={styles.container}>
      {TIPOS.map((tipo) => (
        <TouchableOpacity
          key={tipo}
          style={[styles.button, selected === tipo && styles.buttonActive]}
          onPress={() => onSelect(tipo)}
        >
          <Text style={[styles.text, selected === tipo && styles.textActive]}>
            {tipo}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.md,
  },
  button: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonActive: {
    backgroundColor: THEME.colors.indigo,
    shadowColor: THEME.colors.indigo,
    shadowOpacity: 0.4,
    elevation: 5,
  },
  text: {
    color: THEME.colors.text.secondary,
    fontSize: THEME.fontSize.sm,
    fontWeight: "500",
  },
  textActive: {
    color: "white",
    fontWeight: "600",
  },
});
