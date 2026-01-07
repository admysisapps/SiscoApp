import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { THEME } from "@/constants/theme";
import { asambleaService } from "@/services/asambleaService";
import { Asamblea } from "@/types/Asamblea";
import ModalConexionAsambleaAdmin from "./ModalConexionAsambleaAdmin";
import dayjs from "dayjs";
import AntDesign from "@expo/vector-icons/AntDesign";

interface Props {
  asamblea: Asamblea;
  onEstadoChanged?: () => void;
  onShowToast?: (
    message: string,
    type: "error" | "success" | "warning"
  ) => void;
}

export default function AsambleaProgramadaAdmin({
  asamblea,
  onEstadoChanged,
  onShowToast,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const puedeIniciarAsamblea = () => {
    const hoy = dayjs().format("YYYY-MM-DD");
    const fechaAsamblea = dayjs(asamblea.fecha).format("YYYY-MM-DD");
    return hoy === fechaAsamblea;
  };

  const handleIniciarAsamblea = async () => {
    if (!puedeIniciarAsamblea()) {
      onShowToast?.(
        "Solo se puede iniciar la asamblea el día programado",
        "error"
      );
      return;
    }

    setLoading(true);
    try {
      const response = await asambleaService.cambiarEstadoAsamblea(
        asamblea.id,
        "en_curso"
      );

      if (response.success) {
        setShowModal(true);
      } else {
        onShowToast?.(response.error || "Error al iniciar asamblea", "error");
      }
    } catch {
      onShowToast?.("Error al iniciar asamblea", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarAsamblea = async () => {
    setLoading(true);
    try {
      const response = await asambleaService.cambiarEstadoAsamblea(
        asamblea.id,
        "cancelada"
      );

      if (response.success) {
        onShowToast?.("Asamblea cancelada exitosamente", "success");
        setTimeout(() => {
          onEstadoChanged?.();
        }, 1500);
      } else {
        onShowToast?.(response.error || "Error al cancelar asamblea", "error");
      }
    } catch {
      onShowToast?.("Error al cancelar asamblea", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AntDesign name="alert" size={24} color={THEME.colors.primary} />
        <Text style={styles.title}>Controles de Administrador</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          onPress={() =>
            router.push(`/votacion-crear?asambleaId=${asamblea.id}`)
          }
          disabled={loading}
          activeOpacity={0.8}
          style={styles.touchable}
        >
          <LinearGradient
            colors={["#5B9FED", "#2563EB", "#1E40AF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <Ionicons name="add-circle" size={20} color="white" />
            <Text style={styles.buttonText}>Crear Preguntas</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() =>
            router.push(
              `/(admin)/(asambleas)/ControlPreguntas?asambleaId=${asamblea.id}`
            )
          }
          disabled={loading}
          activeOpacity={0.8}
          style={styles.touchable}
        >
          <LinearGradient
            colors={["#FBBF24", "#F59E0B", "#D97706"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <Ionicons name="list-circle" size={20} color="white" />
            <Text style={styles.buttonText}>Control de Preguntas</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleIniciarAsamblea}
          disabled={loading || !puedeIniciarAsamblea()}
          activeOpacity={0.8}
          style={styles.touchable}
        >
          <LinearGradient
            colors={
              !puedeIniciarAsamblea()
                ? ["#D1D5DB", "#9CA3AF", "#6B7280"]
                : ["#34D399", "#10B981", "#059669"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.button,
              !puedeIniciarAsamblea() && styles.buttonDisabled,
            ]}
          >
            <Ionicons name="play-circle" size={20} color="white" />
            <Text style={styles.buttonText}>Iniciar Asamblea</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleCancelarAsamblea}
          disabled={loading}
          activeOpacity={0.8}
          style={styles.touchable}
        >
          <LinearGradient
            colors={["#F87171", "#EF4444", "#DC2626"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.button}
          >
            <Ionicons name="close-circle" size={20} color="white" />
            <Text style={styles.buttonText}>Cancelar Asamblea</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {!puedeIniciarAsamblea() && (
        <Text style={styles.helperText}>
          Solo se puede iniciar la asamblea el día programado (
          {dayjs(asamblea.fecha).format("DD/MM/YYYY")})
        </Text>
      )}

      <ModalConexionAsambleaAdmin
        visible={showModal}
        onClose={() => setShowModal(false)}
        asambleaId={asamblea.id}
        onSuccess={useCallback(() => onEstadoChanged?.(), [onEstadoChanged])}
      />
    </View>
  );
}

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
    justifyContent: "space-between",
    marginBottom: THEME.spacing.md,
  },
  title: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: THEME.colors.primary,
  },
  buttonsContainer: {
    gap: THEME.spacing.sm,
  },
  touchable: {
    borderRadius: THEME.borderRadius.md,
    overflow: "hidden",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.md,
    gap: THEME.spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    opacity: 0.7,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },
  helperText: {
    fontSize: THEME.fontSize.sm,
    color: "#F59E0B",
    textAlign: "center",
    marginTop: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    backgroundColor: "#FEF3C7",
    borderRadius: THEME.borderRadius.md,
    fontWeight: "500",
  },
});
