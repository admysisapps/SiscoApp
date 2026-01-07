// components/asambleas/AsambleaCardAlternativo.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { THEME } from "@/constants/theme";
import dayjs from "dayjs";

type IconName =
  | "calendar-outline"
  | "play-circle-outline"
  | "checkmark-circle-outline"
  | "close-circle-outline"
  | "time-outline"
  | "location-outline"
  | "videocam-outline"
  | "git-merge-outline";

interface AsambleaCardProps {
  asamblea: {
    id: number;
    titulo: string;
    descripcion: string;
    fecha: string;
    hora: string;
    lugar: string;
    modalidad: "presencial" | "virtual" | "mixta";
    enlace_virtual?: string;
    estado: "programada" | "en_curso" | "finalizada" | "cancelada";
    tipo_asamblea: string; // Usar tipo_asamblea en lugar de tipoAsamblea
    quorum_requerido: number;
    quorum_alcanzado: number;
    proyecto_id: string;
    creador_id: number;
    fecha_creacion: string;
    fecha_actualizacion: string;
  };
  onPress: () => void;
}

export default function AsambleaCardAlternativo({
  asamblea,
  onPress,
}: AsambleaCardProps) {
  if (!asamblea) return null;

  // Configuración según estado
  const estadoConfig = {
    programada: {
      color: THEME.colors.primary,
      icon: "calendar-outline" as IconName,
      label: "Programada",
    },
    en_curso: {
      color: THEME.colors.success,
      icon: "play-circle-outline" as IconName,
      label: "En curso",
    },
    finalizada: {
      color: THEME.colors.text.muted,
      icon: "checkmark-circle-outline" as IconName,
      label: "Finalizada",
    },
    cancelada: {
      color: THEME.colors.error,
      icon: "close-circle-outline" as IconName,
      label: "Cancelada",
    },
  };

  const { color, icon, label } =
    estadoConfig[asamblea.estado] || estadoConfig.programada;
  const esOrdinaria = asamblea.tipo_asamblea === "ordinaria";

  // Formatear fecha
  const formatDate = (dateString: string) => {
    try {
      return dayjs(dateString).format("DD/MM/YYYY");
    } catch {
      return dateString;
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      {/* Encabezado con estado y tipo */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          {asamblea.estado === "en_curso" ? (
            <LottieView
              source={require("@/assets/lottie/Play.json")}
              autoPlay
              loop
              style={{ width: 28, height: 28 }}
            />
          ) : (
            <Ionicons name={icon} size={24} color={color} />
          )}
          <Text style={[styles.estadoText, { color }]}>{label}</Text>
        </View>
        <View
          style={[
            styles.tipoBadge,
            { backgroundColor: esOrdinaria ? "#E3F2FD" : "#FFF3E0" },
          ]}
        >
          <Text
            style={{
              color: esOrdinaria ? "#1565C0" : "#E65100",
              fontSize: THEME.fontSize.xs,
              fontWeight: "500",
            }}
          >
            {esOrdinaria ? "Ordinaria" : "Extraordinaria"}
          </Text>
        </View>
      </View>

      {/* Título */}
      <Text style={styles.titulo}>{asamblea.titulo}</Text>

      {/* Información en dos columnas */}
      <View style={styles.infoContainer}>
        <View style={styles.infoColumn}>
          <View style={styles.infoRow}>
            <Ionicons
              name="calendar-outline"
              size={16}
              color={THEME.colors.text.secondary}
            />
            <Text style={styles.infoText}>{formatDate(asamblea.fecha)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name="time-outline"
              size={16}
              color={THEME.colors.text.secondary}
            />
            <Text style={styles.infoText}>
              {asamblea.hora ? asamblea.hora.substring(0, 5) : ""}
            </Text>
          </View>
        </View>

        <View style={styles.infoColumn}>
          <View style={styles.infoRow}>
            <Ionicons
              name="location-outline"
              size={16}
              color={THEME.colors.text.secondary}
            />
            <Text
              style={styles.infoText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {asamblea.lugar}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons
              name={
                asamblea.modalidad === "presencial"
                  ? "people-outline"
                  : asamblea.modalidad === "virtual"
                    ? "videocam-outline"
                    : "git-merge-outline"
              }
              size={16}
              color={THEME.colors.text.secondary}
            />
            <Text style={styles.infoText}>
              {asamblea.modalidad.charAt(0).toUpperCase() +
                asamblea.modalidad.slice(1)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME.spacing.sm,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  estadoText: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    marginLeft: THEME.spacing.xs,
  },
  tipoBadge: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.full,
  },
  titulo: {
    fontSize: THEME.fontSize.xl,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: THEME.spacing.md,
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoColumn: {
    flex: 1,
    marginRight: THEME.spacing.xs,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: THEME.spacing.sm,
  },
  infoText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.secondary,
    marginLeft: THEME.spacing.sm,
    flex: 1,
  },
});
