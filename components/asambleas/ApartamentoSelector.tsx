import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { THEME } from "@/constants/theme";

interface ApartamentoSelectorProps {
  apartamentos: string; // Cadena de apartamentos separados por coma
  selectedApartamentos: string[];
  onSelectionChange: (apartamentos: string[]) => void;
  error?: string;
}

const ApartamentoSelector: React.FC<ApartamentoSelectorProps> = ({
  apartamentos,
  selectedApartamentos,
  onSelectionChange,
  error,
}) => {
  // Convertir la cadena de apartamentos a un array
  const apartamentosArray = apartamentos
    ? apartamentos.split(",").map((apt) => apt.trim())
    : [];

  const toggleApartamento = (apartamento: string) => {
    if (selectedApartamentos.includes(apartamento)) {
      onSelectionChange(
        selectedApartamentos.filter((apt) => apt !== apartamento)
      );
    } else {
      onSelectionChange([...selectedApartamentos, apartamento]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Seleccione inmuebles:</Text>

      <View style={styles.apartamentosGrid}>
        {apartamentosArray.map((apartamento) => (
          <TouchableOpacity
            key={apartamento}
            style={[
              styles.apartamentoItem,
              selectedApartamentos.includes(apartamento) &&
                styles.apartamentoSelected,
            ]}
            onPress={() => toggleApartamento(apartamento)}
          >
            <Text
              style={[
                styles.apartamentoText,
                selectedApartamentos.includes(apartamento) &&
                  styles.apartamentoTextSelected,
              ]}
            >
              {apartamento}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}

      {selectedApartamentos.length > 0 && (
        <View style={styles.selectionInfo}>
          <Text style={styles.selectionText}>
            {selectedApartamentos.length} inmueble(s) seleccionado(s)
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.md,
  },
  label: {
    fontSize: THEME.fontSize.md,
    fontWeight: "500",
    color: THEME.colors.text.primary,
    marginBottom: THEME.spacing.sm,
  },
  apartamentosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -THEME.spacing.xs,
  },
  apartamentoItem: {
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.sm,
    padding: THEME.spacing.sm,
    margin: THEME.spacing.xs,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  apartamentoSelected: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  apartamentoText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.primary,
  },
  apartamentoTextSelected: {
    color: "#fff",
  },
  errorText: {
    color: THEME.colors.error,
    fontSize: THEME.fontSize.sm,
    marginTop: THEME.spacing.xs,
  },
  selectionInfo: {
    marginTop: THEME.spacing.sm,
    backgroundColor: THEME.colors.primaryLight + "20",
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.sm,
  },
  selectionText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.primary,
  },
});

export default ApartamentoSelector;
