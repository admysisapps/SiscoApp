import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { THEME } from "@/constants/theme";
import { EstadoPQR, PQR } from "@/types/Pqr";

interface PqrHeroCardProps {
  pqr: PQR;
  canManagePQR: boolean;
  isUser: boolean;
  onResolver: () => void;
  onAnular: () => void;
}

const getEstadoColor = (estado: EstadoPQR) => {
  switch (estado) {
    case "Pendiente":
      return THEME.colors.warning;
    case "En Proceso":
      return THEME.colors.info;
    case "Resuelto":
      return THEME.colors.success;
    case "Anulado":
      return THEME.colors.text.muted;
    default:
      return THEME.colors.text.muted;
  }
};

const formatearFecha = (fecha: string) =>
  dayjs(fecha).subtract(5, "hour").format("DD/MM/YYYY HH:mm");

export default function PqrHeroCard({
  pqr,
  canManagePQR,
  isUser,
  onResolver,
  onAnular,
}: PqrHeroCardProps) {
  const puedeResolver = canManagePQR && pqr.estado_pqr === "En Proceso";
  const puedeAnular = isUser && pqr.estado_pqr === "Pendiente";

  return (
    <View style={styles.card}>
      <View style={styles.statusRow}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getEstadoColor(pqr.estado_pqr) },
          ]}
        >
          <Text style={styles.statusText}>{pqr.estado_pqr}</Text>
        </View>
        <Text style={styles.dateText}>
          {formatearFecha(pqr.fecha_creacion)}
        </Text>
      </View>

      <Text style={styles.title}>{pqr.asunto}</Text>
      <Text style={styles.description}>{pqr.descripcion}</Text>

      {puedeAnular && (
        <TouchableOpacity style={styles.anularButton} onPress={onAnular}>
          <Ionicons name="close-circle" size={16} color="#dc2626" />
          <Text style={styles.anularButtonText}>Anular PQR</Text>
        </TouchableOpacity>
      )}

      {puedeResolver && (
        <TouchableOpacity style={styles.resolverButton} onPress={onResolver}>
          <Ionicons name="checkmark-circle" size={16} color="#059669" />
          <Text style={styles.resolverButtonText}>Resolver PQR</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 12,
    color: "#64748b",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  anularButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  anularButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#dc2626",
    marginLeft: 4,
  },
  resolverButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  resolverButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
    marginLeft: 4,
  },
});
