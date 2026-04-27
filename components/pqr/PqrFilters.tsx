import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";

export type FilterType =
  | "Todos"
  | "Pendientes"
  | "En Proceso"
  | "Resueltas"
  | "Anuladas";

interface PqrFiltersProps {
  active: FilterType;
  isAdmin: boolean;
  onSelect: (filter: FilterType) => void;
}

export default function PqrFilters({
  active,
  isAdmin,
  onSelect,
}: PqrFiltersProps) {
  const filters: FilterType[] = isAdmin
    ? ["Todos", "Pendientes", "En Proceso", "Resueltas", "Anuladas"]
    : ["Todos", "Pendientes", "En Proceso", "Resueltas"];

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.button, active === filter && styles.buttonActive]}
            onPress={() => onSelect(filter)}
          >
            <Text style={[styles.text, active === filter && styles.textActive]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  buttonActive: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  text: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  textActive: {
    color: "white",
  },
});
