import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";

interface Documento {
  id: string;
  nombre: string;
  tipo: string;
  tamaño: string;
  fecha: string;
  categoria: string;
}

interface DocumentoItemProps {
  documento: Documento;
  onDescargar: () => void;
  onEliminar: () => void;
}

const getIconoCategoria = (categoria: string) => {
  switch (categoria) {
    case "Legal":
      return "shield-checkmark-outline";
    case "Actas":
      return "document-text-outline";
    case "Financiero":
      return "cash-outline";
    case "Seguros":
      return "umbrella-outline";
    case "Certificados":
      return "ribbon-outline";
    case "Contratos":
      return "document-attach-outline";
    default:
      return "document-outline";
  }
};

export const DocumentoItem: React.FC<DocumentoItemProps> = ({
  documento,
  onDescargar,
  onEliminar,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.info}>
        <Text style={styles.nombre} numberOfLines={2}>
          {documento.nombre}
        </Text>
        <Text style={styles.fecha}>{documento.fecha}</Text>
      </View>
      <TouchableOpacity style={styles.downloadButton} onPress={onDescargar}>
        <Ionicons name="download-outline" size={24} color="#4CAF50" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  info: {
    flex: 1,
    paddingRight: THEME.spacing.md,
  },
  nombre: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: 4,
  },
  fecha: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
  },
  downloadButton: {
    padding: THEME.spacing.xs,
  },
});
