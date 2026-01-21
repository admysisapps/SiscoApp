import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { THEME } from "@/constants/theme";
import { Asamblea } from "@/types/Asamblea";
import { useApoderado } from "@/contexts/ApoderadoContext";
import ModalConexionAsamblea from "./ModalConexionAsamblea";
import Toast from "@/components/Toast";

// Definir un tipo para los nombres de iconos
type IconName =
  | "play-circle-outline"
  | "checkmark-circle-outline"
  | "videocam-outline"
  | "people-outline";

interface AsambleaEnCursoApoderadoProps {
  asamblea: Asamblea;
}

const AsambleaEnCursoApoderado: React.FC<AsambleaEnCursoApoderadoProps> = ({
  asamblea,
}) => {
  const router = useRouter();
  const { session } = useApoderado();
  const [modalVisible, setModalVisible] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "error" as "success" | "error" | "warning",
  });

  const handleRegistrarAsistencia = () => {
    setModalVisible(true);
  };

  const handleModalSuccess = useCallback(
    (registroData: any) => {
      // Navegar a la pantalla de asamblea activa para apoderados
      router.replace({
        pathname: "/(apoderado)/asamblea-activa/[id]",
        params: {
          id: asamblea.id.toString(),
          registroData: JSON.stringify(registroData),
          asambleaId: asamblea.id.toString(),
        },
      });
    },
    [router, asamblea.id]
  );

  const handleModalError = useCallback((error: string) => {
    setToast({
      visible: true,
      message: error,
      type: "error",
    });
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons
          name={"play-circle-outline" as IconName}
          size={24}
          color={THEME.colors.success}
        />
        <Text style={[styles.titulo, { color: THEME.colors.success }]}>
          Asamblea En Curso - Apoderado
        </Text>
      </View>

      <Text style={styles.descripcion}>
        Registra tu asistencia y participa en la votación de los inmuebles que
        representas.
      </Text>

      {/* Información de representación */}
      {session && (
        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Tu representación:</Text>
          <Text style={styles.infoText}>
            inmuebles: {session.apartamentos?.join(", ")}
          </Text>
        </View>
      )}

      {/* Botones de acción */}
      <View style={styles.botonesContainer}>
        {/* Botón para registrar asistencia */}
        <TouchableOpacity
          style={styles.asistenciaButton}
          onPress={handleRegistrarAsistencia}
        >
          <Ionicons
            name={"checkmark-circle-outline" as IconName}
            size={20}
            color="white"
          />
          <Text style={styles.asistenciaButtonText}>
            Registrar Asistencia como Apoderado
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modal de conexión */}
      <ModalConexionAsamblea
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={handleModalSuccess}
        onError={handleModalError}
        asambleaId={asamblea.id}
        apoderadoSession={session || undefined}
      />

      {/* Toast para errores */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
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
  infoContainer: {
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  infoTitle: {
    fontSize: THEME.fontSize.sm,
    fontWeight: "600",
    color: THEME.colors.primary,
    marginBottom: THEME.spacing.xs,
  },
  infoText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.primary,
  },
  botonesContainer: {
    marginBottom: THEME.spacing.md,
  },
  asistenciaButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.colors.success,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.sm,
  },
  asistenciaButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: THEME.spacing.sm,
  },
});

export default AsambleaEnCursoApoderado;
