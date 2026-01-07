import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface PQR {
  id_pqr: number;
  asunto: string;
  tipo_peticion: "Petición" | "Queja" | "Reclamo";
  estado_pqr:
    | "Pendiente"
    | "En Proceso"
    | "Resuelto"
    | "Cerrado Sin Solución"
    | "Anulado";
  fecha_creacion: string;
  descripcion: string;
  apartamento?: {
    codigo_apt: string;
    bloque: string;
  };
  creador?: {
    nombre: string;
    apellido: string;
  };
}

interface PqrCardProps {
  item: PQR;
  onPress: (item: PQR) => void;
}

const getTypeColor = (type: PQR["tipo_peticion"]): string => {
  const colorMap = {
    Petición: "#4F46E5",
    Queja: "#F59E0B",
    Reclamo: "#EF4444",
  };
  return colorMap[type];
};

const getStatusColor = (status: PQR["estado_pqr"]): string => {
  const colorMap = {
    Pendiente: "#F59E0B",
    "En Proceso": "#3B82F6",
    Resuelto: "#10B981",
    "Cerrado Sin Solución": "#EF4444",
    Anulado: "#6B7280",
  };
  return colorMap[status] || "#6B7280";
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const PqrCardComponent: React.FC<PqrCardProps> = ({ item, onPress }) => (
  <TouchableOpacity
    style={styles.pqrItem}
    onPress={() => onPress(item)}
    activeOpacity={0.7}
  >
    <View style={styles.pqrIcon}>
      <Ionicons name="document-text-outline" size={24} color="#64748B" />
    </View>
    <View style={styles.pqrContent}>
      <Text style={styles.pqrTitle} numberOfLines={2}>
        {item.asunto}
      </Text>
      <Text
        style={[styles.pqrType, { color: getTypeColor(item.tipo_peticion) }]}
      >
        {item.tipo_peticion}
      </Text>
      <Text style={styles.pqrDate}>{formatDate(item.fecha_creacion)}</Text>
      {item.apartamento && (
        <Text style={styles.apartmentText}>
          {item.apartamento.codigo_apt} - Bloque {item.apartamento.bloque}
        </Text>
      )}
    </View>
    <View style={styles.statusContainer}>
      <View
        style={[
          styles.statusDot,
          { backgroundColor: getStatusColor(item.estado_pqr) },
        ]}
      />
      <Text
        style={[styles.statusText, { color: getStatusColor(item.estado_pqr) }]}
      >
        {item.estado_pqr}
      </Text>
    </View>
  </TouchableOpacity>
);

PqrCardComponent.displayName = "PqrCard";

export const PqrCard = React.memo(PqrCardComponent);

const styles = StyleSheet.create({
  pqrItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  pqrIcon: {
    width: 48,
    height: 48,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  pqrContent: {
    flex: 1,
  },
  pqrTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1E293B",
    marginBottom: 4,
    lineHeight: 20,
  },
  pqrType: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  pqrDate: {
    fontSize: 12,
    color: "#64748B",
  },
  statusContainer: {
    alignItems: "center",
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
  },
  apartmentText: {
    fontSize: 11,
    color: "#94a3b8",
    marginTop: 2,
  },
});
