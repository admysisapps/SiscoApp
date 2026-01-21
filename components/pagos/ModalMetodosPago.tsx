import React, { useState, useCallback, useEffect, useRef } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Share,
  Dimensions,
  Platform,
  ActivityIndicator,
  Animated,
  PanResponder,
} from "react-native";
import * as Clipboard from "expo-clipboard";
import { THEME } from "@/constants/theme";
import { CuentaPago } from "@/types/CuentaPago";
import TarjetaPago from "./TarjetaPago";
import { apiService } from "@/services/apiService";
import { getTipoNombre, truncateUrl } from "@/constants/pagos";
import { openURL } from "@/utils/linkingHelper";
import Toast from "@/components/Toast";
import { eventBus, EVENTS } from "@/utils/eventBus";

const { width, height } = Dimensions.get("window");

interface Props {
  visible: boolean;
  onClose: () => void;
  cuentas: CuentaPago[];
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export default function PaymentMethodsModal({
  visible,
  onClose,
  cuentas,
  loading = false,
  error = null,
  onRefresh,
}: Props) {
  const [selectedAccount, setSelectedAccount] = useState<CuentaPago | null>(
    null
  );
  const [showDetail, setShowDetail] = useState(false);
  const [userContext, setUserContext] = useState<any>(null);
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
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
    if (visible) {
      translateY.setValue(height);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 25,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, backdropOpacity]);

  useEffect(() => {
    if (!visible) return;

    const loadUserContext = async () => {
      try {
        const context = await apiService.getUserContext();
        setUserContext(context);
      } catch {
        // Error silencioso
      }
    };
    loadUserContext();
  }, [visible]);

  // Escuchar eventos de cambios en cuentas de pago
  useEffect(() => {
    if (!visible || !onRefresh) return;

    const handleCuentaChange = () => {
      onRefresh();
    };

    eventBus.on(EVENTS.CUENTA_PAGO_CREATED, handleCuentaChange);
    eventBus.on(EVENTS.CUENTA_PAGO_UPDATED, handleCuentaChange);
    eventBus.on(EVENTS.CUENTA_PAGO_DELETED, handleCuentaChange);

    return () => {
      eventBus.off(EVENTS.CUENTA_PAGO_CREATED, handleCuentaChange);
      eventBus.off(EVENTS.CUENTA_PAGO_UPDATED, handleCuentaChange);
      eventBus.off(EVENTS.CUENTA_PAGO_DELETED, handleCuentaChange);
    };
  }, [visible, onRefresh]);

  const handleCardPress = useCallback((cuenta: CuentaPago) => {
    setSelectedAccount(cuenta);
    setShowDetail(true);
  }, []);

  const handleBackToList = useCallback(() => {
    setShowDetail(false);
    setSelectedAccount(null);
  }, []);

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowDetail(false);
      setSelectedAccount(null);
      onClose();
    });
  }, [onClose, translateY, backdropOpacity]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50 || gestureState.vy > 0.5) {
          handleClose();
        } else {
          Animated.timing(translateY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleShareInfo = useCallback(
    async (cuenta: CuentaPago) => {
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
    },
    [userContext]
  );

  const cuentasActivas = cuentas || [];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity
            style={styles.backdropTouch}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>
        <Animated.View
          style={[styles.modalContainer, { transform: [{ translateY }] }]}
        >
          <View {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          <View style={styles.contentContainer}>
            {!showDetail ? (
              // Lista de Informacion  de pago
              <>
                <View style={styles.header}>
                  <Text style={styles.title}> Métodos de Pago</Text>
                </View>

                <ScrollView
                  contentContainerStyle={styles.content}
                  showsVerticalScrollIndicator={false}
                >
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator
                        size="large"
                        color={THEME.colors.primary}
                      />
                      <Text style={styles.loadingText}>
                        Cargando métodos de pago...
                      </Text>
                    </View>
                  ) : error ? (
                    <View style={styles.errorContainer}>
                      <Ionicons
                        name="alert-circle"
                        size={48}
                        color={THEME.colors.error}
                      />
                      <Text style={styles.errorTitle}>Error al cargar</Text>
                      <Text style={styles.errorText}>{error}</Text>
                      {onRefresh && (
                        <TouchableOpacity
                          style={styles.retryButton}
                          onPress={onRefresh}
                        >
                          <Ionicons name="refresh" size={16} color="white" />
                          <Text style={styles.retryText}>Reintentar</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : cuentasActivas.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Ionicons
                        name="card-outline"
                        size={48}
                        color={THEME.colors.text.muted}
                      />
                      <Text style={styles.emptyTitle}>
                        No hay métodos de pago
                      </Text>
                      <Text style={styles.emptyText}>
                        Aún no se han configurado métodos de pago
                      </Text>
                    </View>
                  ) : (
                    cuentasActivas.map((cuenta) => (
                      <TarjetaPago
                        key={cuenta.id}
                        cuenta={cuenta}
                        onPress={handleCardPress}
                        onError={(error: string) => showToast(error, "error")}
                      />
                    ))
                  )}
                </ScrollView>
              </>
            ) : (
              // Detalle de método de pago
              selectedAccount && (
                <>
                  <View style={styles.detailHeader}>
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={handleBackToList}
                    >
                      <Ionicons
                        name="arrow-back"
                        size={20}
                        color={THEME.colors.text.primary}
                      />
                    </TouchableOpacity>
                  </View>
                  <ScrollView style={styles.detailContent}>
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
                          onPress={() =>
                            openURL(selectedAccount.enlace_pago!, (error) =>
                              showToast(error, "error")
                            )
                          }
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
                        onPress={() =>
                          openURL(selectedAccount.enlace_pago!, (error) =>
                            showToast(error, "error")
                          )
                        }
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
                        onPress={() =>
                          Clipboard.setStringAsync(
                            selectedAccount.numero_cuenta!
                          )
                        }
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
              )
            )}
          </View>
        </Animated.View>
      </View>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
    paddingBottom: 0,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.colors.modalOverlay,
  },
  backdropTouch: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: Platform.OS === "android" ? height * 0.8 : height * 0.7,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  contentContainer: {
    flex: 1,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: THEME.colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: width < 360 ? 16 : 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: width < 360 ? 18 : 20,
    fontWeight: "700",
    color: THEME.colors.text.primary,
  },

  content: {
    paddingHorizontal: width < 360 ? 12 : 20,
    paddingBottom: 20,
  },

  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: width < 360 ? 16 : 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  detailTitle: {
    fontSize: width < 360 ? 16 : 18,
    fontWeight: "700",
    color: THEME.colors.text.primary,
    flex: 1,
    textAlign: "center",
  },
  detailContent: {
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
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  additionalSection: {
    marginTop: 16,
    padding: 16,
    backgroundColor: THEME.colors.warning + "20",
    borderRadius: 12,
  },
  additionalTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.warning,
    marginBottom: 8,
  },
  additionalText: {
    fontSize: 14,
    color: THEME.colors.warning,
    lineHeight: 20,
  },
  actionsRow: {
    flexDirection: width < 360 ? "column" : "row",
    paddingHorizontal: width < 360 ? 16 : 20,
    paddingBottom: 20,
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
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: THEME.colors.text.secondary,
    marginTop: 16,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.error,
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    textAlign: "center",
    marginTop: 8,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 16,
    gap: 6,
  },
  retryText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    marginTop: 4,
    textAlign: "center",
  },
});
