import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { THEME } from "@/constants/theme";
import { Asamblea } from "@/types/Asamblea";
import ModalConexionAsamblea from "./ModalConexionAsamblea";

// Definir un tipo para los nombres de iconos
type IconName =
  | "play-circle-outline"
  | "checkmark-circle-outline"
  | "videocam-outline"
  | "people-outline";

interface AsambleaEnCursoProps {
  asamblea: Asamblea;
}

const AsambleaEnCurso: React.FC<AsambleaEnCursoProps> = ({ asamblea }) => {
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);

  const handleRegistrarAsistencia = () => {
    setModalVisible(true);
  };

  const handleModalSuccess = useCallback(
    (registroData: any) => {
      router.replace({
        pathname: "/(tabs)/(asambleas)/asamblea-activa",
        params: {
          registroData: JSON.stringify(registroData),
          asambleaId: asamblea.id.toString(),
        },
      });
    },
    [router, asamblea.id]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons
          name={"play-circle-outline" as IconName}
          size={24}
          color={THEME.colors.success}
        />
        <Text style={[styles.titulo, { color: THEME.colors.success }]}>
          Asamblea En Curso
        </Text>
      </View>

      <Text style={styles.descripcion}>
        Esta asamblea está en curso actualmente,{" "}
        {asamblea.modalidad !== "presencial"
          ? "Unete para resgistrar tu asistencia."
          : "Puedes registrar tu asistencia si estás presente."}
      </Text>

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
          <Text style={styles.asistenciaButtonText}>Registrar Asistencia</Text>
        </TouchableOpacity>
      </View>

      {/* Nota informativa */}
      <View style={styles.notaContainer}>
        <Ionicons
          name={"people-outline" as IconName}
          size={20}
          color={THEME.colors.text.secondary}
        />
        <Text style={styles.notaText}>
          {asamblea.quorum_alcanzado >= asamblea.quorum_requerido
            ? "Se ha alcanzado el quórum requerido para esta asamblea."
            : "Aún no se ha alcanzado el quórum requerido para esta asamblea."}
        </Text>
      </View>

      {/* Modal de conexión */}
      <ModalConexionAsamblea
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={handleModalSuccess}
        asambleaId={asamblea.id}
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
  notaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.background,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.md,
  },
  notaText: {
    flex: 1,
    marginLeft: THEME.spacing.sm,
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
  },
});

export default AsambleaEnCurso;
