import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { PQR } from "@/types/Pqr";
import { THEME } from "@/constants/theme";

interface PqrCardProps {
  item: PQR;
  onPress: (item: PQR) => void;
}

const getTypeColor = (type: PQR["tipo_peticion"]): string => {
  const colorMap = {
    Petición: THEME.colors.indigo,
    Queja: THEME.colors.warning,
    Reclamo: THEME.colors.error,
  };
  return colorMap[type];
};

const getStatusColor = (status: PQR["estado_pqr"]): string => {
  const colorMap = {
    Pendiente: THEME.colors.warning,
    "En Proceso": THEME.colors.info,
    Resuelto: THEME.colors.success,
    Anulado: THEME.colors.text.secondary,
  };
  return colorMap[status] ?? THEME.colors.text.secondary;
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
          <Text style={styles.infoText}>{formatDate(item.fecha_creacion)}</Text>
        </View>
        {item.apartamento && (
          <View style={styles.infoItem}>
            <MaterialCommunityIcons
              name="home-circle"
              size={22}
              color={THEME.colors.text.muted}
            />
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
    backgroundColor: THEME.colors.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceLight,
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
    color: THEME.colors.text.heading,
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
    color: THEME.colors.text.secondary,
  },
});
