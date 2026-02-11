import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";
import { Asamblea } from "@/types/Asamblea";

// Definir un tipo para los nombres de iconos
type IconName =
  | "close-circle-outline"
  | "information-circle-outline"
  | "calendar-outline";

interface AsambleaCanceladaProps {
  asamblea: Asamblea;
}

const AsambleaCancelada: React.FC<AsambleaCanceladaProps> = ({ asamblea }) => {
  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    try {
      const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
      };
      return new Date(dateString).toLocaleDateString("es-ES", options);
    } catch {
      return dateString;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons
          name={"close-circle-outline" as IconName}
          size={24}
          color={THEME.colors.error}
        />
        <Text style={[styles.titulo, { color: THEME.colors.error }]}>
          Asamblea Cancelada
        </Text>
      </View>

      <Text style={styles.descripcion}>
        Esta asamblea fue cancelada. Estaba programada para el{" "}
        {formatDate(asamblea.fecha)} a las {asamblea.hora.substring(0, 5)}.
      </Text>

      <View style={styles.notaContainer}>
        <Text style={styles.notaText}>
          Para más información, contacte con la administración.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: THEME.spacing.sm,
  },
  titulo: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    marginLeft: THEME.spacing.sm,
  },
  descripcion: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.md,
  },

  notaContainer: {
    backgroundColor: THEME.colors.background,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
  },
  notaText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    fontStyle: "italic",
  },
});

export default AsambleaCancelada;
