import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";
import { Asamblea } from "@/types/Asamblea";
import { LinearGradient } from "expo-linear-gradient";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

type IconName =
  | "calendar-outline"
  | "play-circle-outline"
  | "checkmark-circle-outline"
  | "close-circle-outline"
  | "location-outline"
  | "people-outline"
  | "videocam-outline"
  | "git-merge-outline"
  | "link-outline";

interface AsambleaDetalleHeaderApoderadoProps {
  asamblea: Asamblea;
  onShowToast?: (message: string, type: "error" | "success") => void;
}

const AsambleaDetalleHeaderApoderado: React.FC<
  AsambleaDetalleHeaderApoderadoProps
> = ({ asamblea, onShowToast }) => {
  const handleOpenLink = async () => {
    if (!asamblea.enlace_virtual) return;

    try {
      const canOpen = await Linking.canOpenURL(asamblea.enlace_virtual);
      if (canOpen) {
        await Linking.openURL(asamblea.enlace_virtual);
      } else {
        onShowToast?.("No se puede abrir este enlace", "error");
      }
    } catch {
      onShowToast?.("Error al abrir el enlace virtual", "error");
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return dayjs(dateString).format("DD [de] MMMM [de] YYYY");
    } catch {
      return dateString;
    }
  };

  const getEstadoColors = () => {
    switch (asamblea.estado) {
      case "programada":
        return {
          primary: THEME.colors.primary,
          gradient: ["#E3F2FD", "#BBDEFB"] as [string, string],
          icon: "calendar-outline" as IconName,
        };
      case "en_curso":
        return {
          primary: THEME.colors.success,
          gradient: ["#E8F5E9", "#C8E6C9"] as [string, string],
          icon: "play-circle-outline" as IconName,
        };
      case "finalizada":
        return {
          primary: THEME.colors.text.muted,
          gradient: ["#ECEFF1", "#CFD8DC"] as [string, string],
          icon: "checkmark-circle-outline" as IconName,
        };
      case "cancelada":
        return {
          primary: THEME.colors.error,
          gradient: ["#FFEBEE", "#FFCDD2"] as [string, string],
          icon: "close-circle-outline" as IconName,
        };
      default:
        return {
          primary: THEME.colors.primary,
          gradient: ["#E3F2FD", "#BBDEFB"] as [string, string],
          icon: "calendar-outline" as IconName,
        };
    }
  };

  const estadoColors = getEstadoColors();

  return (
    <>
      <LinearGradient
        colors={estadoColors.gradient}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={estadoColors.icon}
              size={32}
              color={estadoColors.primary}
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.estadoText}>
              {asamblea.estado === "programada"
                ? "Programada"
                : asamblea.estado === "en_curso"
                  ? "En curso"
                  : asamblea.estado === "finalizada"
                    ? "Finalizada"
                    : "Cancelada"}
            </Text>
            <Text style={styles.fechaText}>
              {formatDate(asamblea.fecha)} •{" "}
              {asamblea.hora && typeof asamblea.hora === "string"
                ? asamblea.hora.substring(0, 5)
                : "Sin hora"}
            </Text>
          </View>
          <View
            style={[
              styles.tipoBadge,
              {
                backgroundColor:
                  asamblea.tipo_asamblea === "ordinaria"
                    ? "#1565C0"
                    : "#E65100",
              },
            ]}
          >
            <Text style={styles.tipoBadgeText}>
              {asamblea.tipo_asamblea === "ordinaria"
                ? "Ordinaria"
                : "Extraordinaria"}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.tituloContainer}>
        <Text style={styles.titulo}>{asamblea.titulo || "Sin título"}</Text>
        <Text style={styles.descripcion}>
          {asamblea.descripcion || "Sin descripción"}
        </Text>
      </View>

      <View style={styles.detallesCard}>
        <Text style={styles.detallesTitle}>Detalles</Text>

        <View style={styles.detalleRow}>
          <View style={styles.detalleIconContainer}>
            <Ionicons
              name={"location-outline" as IconName}
              size={20}
              color="white"
            />
          </View>
          <View style={styles.detalleTextContainer}>
            <Text style={styles.detalleLabel}>Lugar</Text>
            <Text style={styles.detalleValor}>
              {asamblea.lugar || "Sin lugar especificado"}
            </Text>
          </View>
        </View>

        <View style={styles.detalleRow}>
          <View
            style={[
              styles.detalleIconContainer,
              { backgroundColor: "#5C6BC0" },
            ]}
          >
            <Ionicons
              name={
                asamblea.modalidad === "presencial"
                  ? ("people-outline" as IconName)
                  : asamblea.modalidad === "virtual"
                    ? ("videocam-outline" as IconName)
                    : ("git-merge-outline" as IconName)
              }
              size={20}
              color="white"
            />
          </View>
          <View style={styles.detalleTextContainer}>
            <Text style={styles.detalleLabel}>Modalidad</Text>
            <Text style={styles.detalleValor}>
              {asamblea.modalidad
                ? asamblea.modalidad.charAt(0).toUpperCase() +
                  asamblea.modalidad.slice(1)
                : "No especificada"}
            </Text>
          </View>
        </View>

        {(asamblea.modalidad === "virtual" || asamblea.modalidad === "mixta") &&
          asamblea.enlace_virtual && (
            <TouchableOpacity
              style={styles.detalleRow}
              onPress={handleOpenLink}
            >
              <View
                style={[
                  styles.detalleIconContainer,
                  { backgroundColor: "#FF7043" },
                ]}
              >
                <Ionicons
                  name={"link-outline" as IconName}
                  size={20}
                  color="white"
                />
              </View>
              <View style={styles.detalleTextContainer}>
                <Text style={styles.detalleLabel}>Enlace Virtual</Text>
                <Text
                  style={[styles.detalleValor, styles.enlaceClickeable]}
                  numberOfLines={2}
                >
                  {asamblea.enlace_virtual}
                </Text>
              </View>
            </TouchableOpacity>
          )}
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  headerGradient: {
    borderRadius: THEME.borderRadius.lg,
    overflow: "hidden",
    marginBottom: THEME.spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: THEME.spacing.md,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTextContainer: {
    flex: 1,
    marginLeft: THEME.spacing.md,
  },
  estadoText: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "700",
    color: THEME.colors.text.primary,
  },
  fechaText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  tipoBadge: {
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.full,
  },
  tipoBadgeText: {
    color: "white",
    fontSize: THEME.fontSize.xs,
    fontWeight: "500",
  },
  tituloContainer: {
    marginBottom: THEME.spacing.lg,
  },
  titulo: {
    fontSize: THEME.fontSize.xxl,
    fontWeight: "700",
    color: THEME.colors.text.primary,
    marginBottom: THEME.spacing.sm,
  },
  descripcion: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  detallesCard: {
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
  detallesTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: THEME.spacing.md,
  },
  detalleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: THEME.spacing.md,
  },
  detalleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  detalleTextContainer: {
    flex: 1,
    marginLeft: THEME.spacing.md,
  },
  detalleLabel: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
  },
  detalleValor: {
    fontSize: THEME.fontSize.md,
    fontWeight: "500",
    color: THEME.colors.text.primary,
  },
  enlaceClickeable: {
    color: THEME.colors.primary,
    textDecorationLine: "underline",
  },
});

export default AsambleaDetalleHeaderApoderado;
