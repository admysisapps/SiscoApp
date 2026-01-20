import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";
import { Asamblea } from "@/types/Asamblea";
import GenerarPoderModal from "./GenerarPoderModal";
import ListaApoderados from "./ListaApoderados";
import ConfirmModal from "./ConfirmModal";
import { apoderadoService } from "@/services/apoderadoService";
import { useProject } from "@/contexts/ProjectContext";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

// Definir un tipo para los nombres de iconos
type IconName = "calendar-outline" | "notifications-outline" | "time-outline";

interface AsambleaProgramadaProps {
  asamblea: Asamblea;
  onShowToast: (message: string, type: "success" | "error" | "warning") => void;
}

const AsambleaProgramada: React.FC<AsambleaProgramadaProps> = ({
  asamblea,
  onShowToast,
}) => {
  const { selectedProject } = useProject();
  const [modalVisible, setModalVisible] = useState(false);
  const [refreshApoderados, setRefreshApoderados] = useState(0);
  const [apartamentosOcupados, setApartamentosOcupados] = useState<string[]>(
    []
  );

  // Estados para modal de error
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalData, setErrorModalData] = useState({
    title: "",
    message: "",
    errorType: "general" as "validation" | "connection" | "general",
  });

  // Estado para error de correo
  const [emailErrorMessage, setEmailErrorMessage] = useState<string | null>(
    null
  );

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return "Sin fecha";
      return dayjs(dateString).format("DD [de] MMMM [de] YYYY");
    } catch {
      return dateString || "Fecha inválida";
    }
  };

  // Calcular días restantes
  const calcularDiasRestantes = () => {
    try {
      if (!asamblea?.fecha) return "Sin fecha";
      const hoy = dayjs();
      const fechaAsamblea = dayjs(asamblea.fecha);
      const dias = fechaAsamblea.diff(hoy, "day");

      if (dias === 0) return "Hoy";
      if (dias === 1) return "Mañana";
      if (dias < 0) return "Fecha pasada";
      return `En ${dias} días`;
    } catch {
      return "Error calculando fecha";
    }
  };

  // Verificar si se pueden crear apoderados (30 días o menos)
  const puedeCrearApoderados = () => {
    try {
      if (!asamblea?.fecha) return false;
      const hoy = dayjs();
      const fechaAsamblea = dayjs(asamblea.fecha);
      const dias = fechaAsamblea.diff(hoy, "day");
      return dias <= 30 && dias >= 0;
    } catch {
      return false;
    }
  };

  const diasParaHabilitarPoderes = () => {
    try {
      if (!asamblea?.fecha) return 0;
      const hoy = dayjs();
      const fechaAsamblea = dayjs(asamblea.fecha);
      const dias = fechaAsamblea.diff(hoy, "day");
      return dias > 30 ? dias - 30 : 0;
    } catch {
      return 0;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons
          name={"calendar-outline" as IconName}
          size={24}
          color={THEME.colors.primary}
        />
        <Text style={styles.titulo}>Asamblea Programada</Text>
      </View>

      <Text style={styles.descripcion}>
        Esta asamblea está programada para el{" "}
        {formatDate(asamblea?.fecha || "")} a las{" "}
        {asamblea?.hora && typeof asamblea.hora === "string"
          ? asamblea.hora.substring(0, 5)
          : "Sin hora"}
        .
      </Text>

      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <View style={styles.infoIconContainer}>
            <Ionicons
              name={"time-outline" as IconName}
              size={20}
              color={THEME.colors.primary}
            />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoLabel}>Tiempo restante</Text>
            <Text style={styles.infoValue}>
              {String(calcularDiasRestantes())}
            </Text>
          </View>
        </View>
      </View>
      {/* CORREGIDO: Usar Boolean() para evitar renderizar 0 */}
      {Boolean(selectedProject?.poderesHabilitados) && (
        <>
          {puedeCrearApoderados() ? (
            <TouchableOpacity
              style={styles.apoderadoButton}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons
                name="person-add-outline"
                size={20}
                color={THEME.colors.primary}
              />
              <Text style={styles.apoderadoButtonText}>Registrar Poder</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.apoderadoButtonDisabled}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={THEME.colors.text.muted}
              />
              <View style={styles.disabledTextContainer}>
                <Text style={styles.apoderadoButtonTextDisabled}>
                  Registro de poderes no disponible
                </Text>
                <Text style={styles.apoderadoButtonSubtext}>
                  Disponible en {diasParaHabilitarPoderes()} días (30 días antes
                  de la asamblea)
                </Text>
              </View>
            </View>
          )}
        </>
      )}

      {Boolean(selectedProject?.poderesHabilitados) && (
        <GenerarPoderModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setEmailErrorMessage(null);
          }}
          apartamentosOcupados={apartamentosOcupados}
          onSave={async (data) => {
            try {
              const result = await apoderadoService.generarPoder(
                asamblea.id,
                data
              );

              if (result.success) {
                onShowToast("Poder generado exitosamente.", "success");
                setModalVisible(false);
                setRefreshApoderados((prev) => prev + 1); // Trigger refresh
              } else {
                const errorMessage =
                  result.error || "No se pudo generar el poder";
                const isEmailError =
                  result.error_email ||
                  errorMessage.toLowerCase().includes("correo") ||
                  errorMessage.toLowerCase().includes("email");

                if (isEmailError) {
                  setEmailErrorMessage(errorMessage);
                } else {
                  // Determinar tipo de error
                  let errorType: "validation" | "connection" | "general" =
                    "general";
                  if (
                    errorMessage.includes("ya tiene") ||
                    errorMessage.includes("no puede representar") ||
                    errorMessage.includes("no existen") ||
                    errorMessage.includes("no te pertenecen")
                  ) {
                    errorType = "validation";
                  } else if (
                    errorMessage.includes("conexión") ||
                    errorMessage.includes("red") ||
                    errorMessage.includes("internet")
                  ) {
                    errorType = "connection";
                  }

                  setErrorModalData({
                    title: "Error al generar poder",
                    message: errorMessage,
                    errorType,
                  });
                  setShowErrorModal(true);
                  setModalVisible(false);
                  setEmailErrorMessage(null);
                }
              }
            } catch (error) {
              const errorMessage =
                String(error).replace("Error: ", "") || "Error inesperado";

              setErrorModalData({
                title: "Error inesperado",
                message: errorMessage,
                errorType: "connection",
              });
              setShowErrorModal(true);
            }
          }}
          asambleaId={asamblea.id}
          onShowToast={onShowToast}
          emailError={emailErrorMessage}
        />
      )}

      <ConfirmModal
        visible={showErrorModal}
        type="error"
        errorType={errorModalData.errorType}
        title={errorModalData.title}
        message={errorModalData.message}
        confirmText="Entendido"
        showCancel={false}
        onCancel={() => setShowErrorModal(false)}
      />

      {/* Lista de Apoderados */}
      {Boolean(selectedProject?.poderesHabilitados) && (
        <ListaApoderados
          asambleaId={asamblea.id}
          refreshTrigger={refreshApoderados}
          onApoderadoEliminado={() => {
            // Opcional: refrescar datos si es necesario
          }}
          onShowToast={onShowToast}
          onApartamentosOcupadosChange={setApartamentosOcupados}
        />
      )}
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
    color: THEME.colors.primary,
    marginLeft: THEME.spacing.sm,
  },
  descripcion: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.md,
  },
  infoContainer: {
    marginBottom: THEME.spacing.md,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: THEME.spacing.sm,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.primaryLight + "30",
    justifyContent: "center",
    alignItems: "center",
  },
  infoTextContainer: {
    marginLeft: THEME.spacing.md,
  },
  infoLabel: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
  },
  infoValue: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },

  // Estilos para el botón de apoderado
  apoderadoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.colors.primaryLight + "30",
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginTop: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.primary + "40",
  },
  apoderadoButtonText: {
    color: THEME.colors.primary,
    fontWeight: "600",
    marginLeft: THEME.spacing.sm,
    fontSize: THEME.fontSize.md,
  },
  apoderadoButtonDisabled: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surfaceLight,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginTop: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  apoderadoButtonTextDisabled: {
    color: THEME.colors.text.muted,
    fontWeight: "600",
    fontSize: THEME.fontSize.md,
  },
  disabledTextContainer: {
    marginLeft: THEME.spacing.sm,
    flex: 1,
  },
  apoderadoButtonSubtext: {
    color: THEME.colors.text.secondary,
    fontSize: THEME.fontSize.sm,
    marginTop: 2,
  },
});

export default AsambleaProgramada;
