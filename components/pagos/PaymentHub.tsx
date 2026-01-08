import React, { useState, useEffect } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Share,
  Dimensions,
} from "react-native";
import { SafeAreaView, SafeAreaProvider } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";

import PaymentCard from "./PaymentCard";
import { CuentaPago } from "@/types/CuentaPago";
import { apiService } from "@/services/apiService";
import { getTipoNombre, truncateUrl } from "@/constants/pagos";
import { openURL } from "@/utils/linkingHelper";
import Toast from "@/components/Toast";
import { THEME } from "@/constants/theme";

const { width, height } = Dimensions.get("window");

interface Props {
  cuentas: CuentaPago[];
}

export default function PaymentHub({ cuentas }: Props) {
  const [selectedAccount, setSelectedAccount] = useState<CuentaPago | null>(
    null
  );
  const [showModal, setShowModal] = useState(false);
  const [userContext, setUserContext] = useState<any>(null);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" = "success"
  ) => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ visible: false, message: "", type: "success" });
  };

  useEffect(() => {
    const loadUserContext = async () => {
      try {
        const context = await apiService.getUserContext();
        setUserContext(context);
      } catch {
        // Error silencioso
      }
    };
    loadUserContext();
  }, []);

  const handleCardPress = (cuenta: CuentaPago) => {
    setSelectedAccount(cuenta);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAccount(null);
  };

  const handleShareInfo = async (cuenta: CuentaPago) => {
    const info = [
      `${userContext?.proyecto_nombre || "Conjunto"}`,
      `NIT: ${userContext?.proyecto_nit || "N/A"}`,
      `Banco: ${cuenta.nombre_banco}`,
      `Tipo: ${getTipoNombre(cuenta.tipo_cuenta)}`,
      `Titular: ${cuenta.titular}`,
      cuenta.numero_cuenta ? `Cuenta: ${cuenta.numero_cuenta}` : null,
      cuenta.enlace_pago ? `${cuenta.enlace_pago}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await Share.share({
        message: info,
        title: `Información de Pago - ${cuenta.nombre_banco}`,
      });
    } catch {
      // Error silencioso en compartir
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Información de Pago</Text>
        <Text style={styles.subtitle}>Elige tu forma preferida de pagar</Text>
      </View>

      <ScrollView
        style={styles.cardsContainer}
        showsVerticalScrollIndicator={false}
      >
        {cuentas.map((cuenta) => (
          <PaymentCard
            key={cuenta.id}
            cuenta={cuenta}
            onPress={handleCardPress}
          />
        ))}
      </ScrollView>

      {/* Modal de Detalle */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={closeModal}
      >
        <SafeAreaProvider>
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={closeModal}
          >
            <TouchableOpacity
              style={styles.modalContent}
              activeOpacity={1}
              onPress={(e) => e.stopPropagation()}
            >
              <View style={styles.modalHandle} />

              {selectedAccount && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      {selectedAccount.nombre_banco}
                    </Text>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={closeModal}
                    >
                      <Ionicons
                        name="close"
                        size={20}
                        color={THEME.colors.text.muted}
                      />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={styles.contentSection}>
                    <Text style={styles.sectionTitle}>Información de Pago</Text>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Tipo:</Text>
                      <Text style={styles.infoValue}>
                        {getTipoNombre(selectedAccount.tipo_cuenta)}
                      </Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Titular:</Text>
                      <Text style={styles.infoValue}>
                        {selectedAccount.titular}
                      </Text>
                    </View>

                    {selectedAccount.numero_cuenta && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Cuenta:</Text>
                        <Text style={styles.infoValue}>
                          {selectedAccount.numero_cuenta}
                        </Text>
                      </View>
                    )}

                    {selectedAccount.enlace_pago && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Link:</Text>
                        <TouchableOpacity
                          onPress={() => {
                            if (selectedAccount.enlace_pago) {
                              openURL(selectedAccount.enlace_pago, (error) =>
                                showToast(error, "error")
                              );
                            }
                          }}
                        >
                          <Text style={styles.linkValue}>
                            {truncateUrl(selectedAccount.enlace_pago)}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <View style={styles.instructionsSection}>
                      <Text style={styles.instructionsTitle}>
                        Instrucciones
                      </Text>
                      <Text style={styles.instructionsText}>
                        {selectedAccount.descripcion}
                      </Text>
                    </View>

                    {selectedAccount.informacion_adicional && (
                      <View style={styles.additionalSection}>
                        <Text style={styles.additionalTitle}>
                          Información Adicional
                        </Text>
                        <Text style={styles.additionalText}>
                          {selectedAccount.informacion_adicional}
                        </Text>
                      </View>
                    )}
                  </ScrollView>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleShareInfo(selectedAccount)}
                    >
                      <MaterialCommunityIcons
                        name="share"
                        size={20}
                        color={THEME.colors.success}
                      />
                      <Text style={styles.actionText}>Compartir</Text>
                    </TouchableOpacity>

                    {selectedAccount.enlace_pago && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => {
                          if (selectedAccount.enlace_pago) {
                            openURL(selectedAccount.enlace_pago, (error) =>
                              showToast(error, "error")
                            );
                          }
                        }}
                      >
                        <Ionicons
                          name="link"
                          size={16}
                          color={THEME.colors.success}
                        />
                        <Text style={styles.actionText}>Abrir Link</Text>
                      </TouchableOpacity>
                    )}

                    {selectedAccount.numero_cuenta && (
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={async () => {
                          if (selectedAccount.numero_cuenta) {
                            await Clipboard.setStringAsync(
                              selectedAccount.numero_cuenta
                            );
                          }
                        }}
                      >
                        <Ionicons
                          name="copy"
                          size={16}
                          color={THEME.colors.success}
                        />
                        <Text style={styles.actionText}>Copiar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </SafeAreaProvider>
      </Modal>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    padding: width < 360 ? 16 : 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: width < 360 ? 20 : 24,
    fontWeight: "700",
    color: THEME.colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: width < 360 ? 14 : 16,
    color: THEME.colors.text.secondary,
  },
  cardsContainer: {
    flex: 1,
    paddingHorizontal: width < 360 ? 16 : 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    width: "100%",
    maxHeight: height * 0.8,
    minHeight: height * 0.4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: THEME.colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: width < 360 ? 16 : 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: width < 360 ? 18 : 20,
    fontWeight: "700",
    color: THEME.colors.text.primary,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  contentSection: {
    paddingHorizontal: width < 360 ? 16 : 20,
    marginBottom: 20,
    maxHeight: height * 0.55,
  },
  sectionTitle: {
    fontSize: width < 360 ? 14 : 16,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.surfaceLight,
  },
  infoLabel: {
    fontSize: width < 360 ? 12 : 14,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: width < 360 ? 12 : 14,
    color: THEME.colors.text.primary,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  linkValue: {
    fontSize: 14,
    color: THEME.colors.success,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
    textDecorationLine: "underline",
  },
  instructionsSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: THEME.colors.input.background,
    borderRadius: 12,
  },
  instructionsTitle: {
    fontSize: width < 360 ? 12 : 14,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: width < 360 ? 12 : 14,
    color: THEME.colors.text.secondary,
    lineHeight: width < 360 ? 18 : 20,
  },
  additionalSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: THEME.colors.warning + "20",
    borderRadius: 12,
  },
  additionalTitle: {
    fontSize: width < 360 ? 12 : 14,
    fontWeight: "600",
    color: THEME.colors.warning,
    marginBottom: 8,
  },
  additionalText: {
    fontSize: width < 360 ? 12 : 14,
    color: THEME.colors.warning,
    lineHeight: width < 360 ? 18 : 20,
  },
  actionsRow: {
    flexDirection: width < 360 ? "column" : "row",
    paddingHorizontal: width < 360 ? 16 : 20,
    paddingBottom: 30,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: width < 360 ? 10 : 12,
    backgroundColor: THEME.colors.success + "20",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.success + "40",
    gap: 6,
  },
  actionText: {
    color: THEME.colors.success,
    fontSize: width < 360 ? 12 : 14,
    fontWeight: "600",
  },
});
