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
    numero: string;
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
    <View style={styles.leftSection}></View>

    <View style={styles.pqrContent}>
      <View style={styles.headerRow}>
        <Text style={styles.pqrTitle} numberOfLines={2}>
          {item.asunto}
        </Text>
      </View>

      <View style={styles.metaRow}>
        <View
          style={[
            styles.typeBadge,
            { backgroundColor: getTypeColor(item.tipo_peticion) + "15" },
          ]}
        >
          <Text
            style={[
              styles.typeText,
              { color: getTypeColor(item.tipo_peticion) },
            ]}
          >
            {item.tipo_peticion}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.estado_pqr) + "15" },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(item.estado_pqr) },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: getStatusColor(item.estado_pqr) },
            ]}
          >
            {item.estado_pqr}
          </Text>
        </View>
      </View>

      <View style={styles.footerRow}>
        <View style={styles.infoItem}>
          <Ionicons name="calendar-outline" size={12} color="#94a3b8" />
          <Text style={styles.infoText}>{formatDate(item.fecha_creacion)}</Text>
        </View>
        {item.apartamento && (
          <View style={styles.infoItem}>
            <Ionicons name="home-outline" size={12} color="#94a3b8" />
            <Text style={styles.infoText}>
              {item.apartamento.bloque
                ? `Inmueble ${item.apartamento.numero} - Bloque ${item.apartamento.bloque}`
                : `Inmueble ${item.apartamento.numero}`}
            </Text>
          </View>
        )}
      </View>
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
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  leftSection: {
    marginRight: 12,
  },
  pqrIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pqrContent: {
    flex: 1,
    gap: 8,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  pqrTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    lineHeight: 20,
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#64748B",
  },
});
