import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "@/constants/theme";
import { useRouter, useLocalSearchParams } from "expo-router";
import { propietarioService } from "@/services/propietarioService";
import { useLoading } from "@/contexts/LoadingContext";
import Toast from "@/components/Toast";

export default function ConfirmarTransferenciaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showLoading, hideLoading } = useLoading();

  const [confirmado, setConfirmado] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });

  const apartamento = params.apartamento
    ? JSON.parse(params.apartamento as string)
    : null;
  const usuario = params.usuario ? JSON.parse(params.usuario as string) : null;
  const esUsuarioNuevo = params.esUsuarioNuevo === "true";

  const esTransferencia = !!apartamento?.propietario_nombre;

  const confirmarTransferencia = async () => {
    if (!confirmado) {
      setConfirmado(true);
      return;
    }

    try {
      showLoading("Procesando transferencia...");

      const resultado = await propietarioService.transferirPropiedad({
        apartamento_id: apartamento.id,
        nuevo_propietario_documento: usuario.documento,
        propietario_anterior_documento: apartamento.propietario_documento || "",
      });

      if (resultado.success) {
        setToast({
          visible: true,
          message: `Inmueble ${apartamento.codigo_apt} ${esTransferencia ? "transferido" : "asignado"} exitosamente`,
          type: "success",
        });
        setTimeout(() => {
          router.dismissAll();
          router.replace("/(admin)");
        }, 1500);
      } else {
        setToast({
          visible: true,
          message: resultado.error || "No se pudo completar la transferencia",
          type: "error",
        });
        setConfirmado(false);
      }
    } catch {
      setToast({
        visible: true,
        message: "Error de conexión al transferir propiedad",
        type: "error",
      });
      setConfirmado(false);
    } finally {
      hideLoading();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          {/* Encabezado informativo */}
          <View style={styles.contractHeader}>
            <Text style={styles.contractTitle}>Resumen de Transferencia</Text>
            <Text style={styles.contractSubtitle}>
              Información del Inmueble y Propietarios
            </Text>
            <View style={styles.contractLine} />
          </View>

          {/* Advertencia importante */}
          <View style={styles.legalWarning}>
            <Ionicons name="information-circle" size={20} color="#F59E0B" />
            <Text style={styles.legalText}>
              Importante: Esta acción es permanente y no se puede deshacer
            </Text>
          </View>

          {/* Información del proceso */}
          <View style={styles.contractBody}>
            <Text style={styles.clauseTitle}>Datos del Inmueble</Text>
            <Text style={styles.clauseText}>
              Información del inmueble que será transferido:
            </Text>
            <View style={styles.propertyDetails}>
              <Text style={styles.propertyLine}>
                • Código:{" "}
                <Text style={styles.bold}>{apartamento?.codigo_apt}</Text>
              </Text>
              <Text style={styles.propertyLine}>
                • Bloque: <Text style={styles.bold}>{apartamento?.bloque}</Text>
              </Text>
              <Text style={styles.propertyLine}>
                • Coeficiente:{" "}
                <Text style={styles.bold}>{apartamento?.coeficiente}</Text>
              </Text>
            </View>

            {esTransferencia && (
              <>
                <Text style={styles.clauseTitle}>Propietario Actual</Text>
                <Text style={styles.clauseText}>
                  Persona que actualmente posee el inmueble:
                </Text>
                <View style={styles.partyDetails}>
                  <Text style={styles.partyName}>
                    {apartamento?.propietario_nombre}
                  </Text>
                </View>
              </>
            )}

            <Text style={styles.clauseTitle}>Nuevo Propietario</Text>
            <Text style={styles.clauseText}>
              Persona que{" "}
              {esTransferencia
                ? "recibirá"
                : "será asignada como propietaria del"}{" "}
              inmueble:
            </Text>
            <View style={styles.partyDetails}>
              <Text style={styles.partyName}>
                {usuario?.nombre} {usuario?.apellido}
              </Text>
              <Text style={styles.partyId}>Cédula: {usuario?.documento}</Text>
              {esUsuarioNuevo && (
                <View style={styles.newOwnerBadge}>
                  <Text style={styles.newOwnerText}>Nuevo Propietario</Text>
                </View>
              )}
            </View>

            <Text style={styles.clauseTitle}>Efectos de la Transferencia</Text>
            <Text style={styles.finalClause}>
              • Los cambios son permanentes y no se pueden revertir{"\n"}• La
              transferencia se hace efectiva inmediatamente{"\n"}• El registro
              de propietarios se actualiza automáticamente{"\n"}• El nuevo
              propietario tendrá acceso completo al inmueble
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footerContainer}>
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.confirmButton,
              confirmado && styles.confirmButtonFinal,
            ]}
            onPress={confirmarTransferencia}
          >
            <Text style={styles.confirmButtonText}>
              {confirmado
                ? "CONFIRMAR DEFINITIVAMENTE"
                : `${esTransferencia ? "Transferir" : "Asignar"} Inmueble`}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  content: {
    flex: 1,
  },
  contentContainer: {
    maxWidth: 650,
    width: "100%",
    alignSelf: "center",
    padding: 16,
  },
  contractHeader: {
    alignItems: "center",
    marginBottom: 20,
    paddingVertical: 16,
  },
  contractTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1F2937",
    letterSpacing: 0.5,
  },
  contractSubtitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 4,
    letterSpacing: 0.5,
  },
  contractLine: {
    width: "50%",
    height: 2,
    backgroundColor: COLORS.primary,
    marginTop: 10,
  },
  legalWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFBEB",
    padding: 12,
    borderRadius: 6,

    marginBottom: 20,
  },
  legalText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#92400E",
    marginLeft: 8,
    flex: 1,
  },
  contractBody: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  clauseTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
    marginTop: 16,
    marginBottom: 10,
  },
  clauseText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    marginBottom: 10,
  },
  propertyDetails: {
    backgroundColor: "#F9FAFB",
    padding: 16,
    borderRadius: 6,
    marginBottom: 12,
  },
  propertyLine: {
    fontSize: 15,
    color: "#374151",
    marginBottom: 8,
  },
  bold: {
    fontWeight: "600",
    color: "#1F2937",
    fontSize: 15,
  },
  partyDetails: {
    backgroundColor: "#F3F4F6",
    padding: 16,
    borderRadius: 6,
    marginBottom: 12,
    alignItems: "center",
  },
  partyName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
  },
  partyId: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 4,
  },
  newOwnerBadge: {
    backgroundColor: "#DBEAFE",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginTop: 6,
  },
  newOwnerText: {
    fontSize: 10,
    color: "#1E40AF",
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  finalClause: {
    fontSize: 11,
    color: "#374151",
    lineHeight: 16,
    fontStyle: "italic",
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
  },
  footerContainer: {
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },
  footer: {
    flexDirection: "row",
    maxWidth: 650,
    width: "100%",
    alignSelf: "center",
    padding: 16,
    gap: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.text.secondary,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: "500",
  },
  confirmButton: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  confirmButtonFinal: {
    backgroundColor: "#DC2626",
  },
  confirmButtonText: {
    fontSize: 13,
    color: "white",
    fontWeight: "600",
    textAlign: "center",
  },
});
