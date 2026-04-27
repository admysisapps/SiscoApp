import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";
import { PQR } from "@/types/Pqr";

interface PqrInfoGridProps {
  pqr: PQR;
}

export default function PqrInfoGrid({ pqr }: PqrInfoGridProps) {
  if (!pqr.apartamento && !pqr.creador) return null;

  return (
    <View style={styles.grid}>
      {pqr.apartamento && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="home" size={20} color={THEME.colors.primary} />
            <Text style={styles.cardTitle}>Inmueble</Text>
          </View>
          <Text style={styles.cardValue}>
            {pqr.apartamento.bloque
              ? `${pqr.apartamento.numero}-${pqr.apartamento.bloque}`
              : pqr.apartamento.numero}
          </Text>
        </View>
      )}

      {pqr.creador && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person" size={20} color={THEME.colors.primary} />
            <Text style={styles.cardTitle}>Propietario</Text>
          </View>
          <Text style={styles.cardValue}>
            {pqr.creador.nombre} {pqr.creador.apellido}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  card: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    marginLeft: 6,
    textTransform: "uppercase",
  },
  cardValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
});
