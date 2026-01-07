import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  AppState,
  Linking,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Notifications from "expo-notifications";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, THEME } from "@/constants/theme";
import { notificationService } from "@/services/notificacionesService";

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  userDocument: string;
  onError?: (message: string) => void;
}

export default function NotificationModal({
  visible,
  onClose,
  userDocument,
  onError,
}: NotificationModalProps) {
  const [hasNotifications, setHasNotifications] = useState(false);
  const hasAnimated = useRef(false);

  const checkNotificationStatus = useCallback(async () => {
    if (!userDocument) return;

    try {
      const { status } = await Notifications.getPermissionsAsync();
      const prevStatus = hasNotifications;
      const newStatus = status === "granted";

      setHasNotifications(newStatus);

      if (newStatus) {
        await notificationService.checkUserHasNotifications(userDocument);
      }

      // Solo animar si cambió de false a true Y hasAnimated está activo
      if (!prevStatus && newStatus && hasAnimated.current) {
        hasAnimated.current = true;
      } else {
        hasAnimated.current = false;
      }
    } catch {
      setHasNotifications(false);
      hasAnimated.current = false;
    }
  }, [userDocument, hasNotifications]);

  useEffect(() => {
    if (visible) {
      hasAnimated.current = false;
      checkNotificationStatus();
    }
  }, [visible, checkNotificationStatus]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === "active" && visible) {
        checkNotificationStatus();
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, [visible, checkNotificationStatus]);

  const openDeviceSettings = async () => {
    try {
      if (Platform.OS === "ios") {
        const canOpen = await Linking.canOpenURL("app-settings:");
        if (canOpen) {
          await Linking.openURL("app-settings:");
        } else {
          await Linking.openSettings();
        }
      } else {
        await Linking.openSettings();
      }
    } catch {
      onError?.("No se pudo abrir la configuración");
    }
  };

  const handleToggle = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status === "granted") {
      hasAnimated.current = true; // Activar animación
      setHasNotifications(true);
      // Ejecutar registro en background sin esperar
      notificationService
        .setupNotificationsForAllProjects(userDocument)
        .catch(() => {
          // Ignorar errores silenciosamente
        });
    } else {
      onError?.(
        "Debes activar las notificaciones en Configuración del dispositivo"
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.modalCard}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.iconBadge}>
                <Ionicons
                  name="notifications"
                  size={24}
                  color={COLORS.primary}
                />
              </View>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons
                  name="close"
                  size={24}
                  color={COLORS.text.secondary}
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalTitle}>Notificaciones</Text>
            <Text style={styles.modalSubtitle}>
              Mantente informado sobre eventos importantes
            </Text>

            {/* Info */}
            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Ionicons
                  name="calendar"
                  size={16}
                  color={COLORS.text.secondary}
                />
                <Text style={styles.infoText}>Convocatorias a asambleas</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons
                  name="megaphone"
                  size={16}
                  color={COLORS.text.secondary}
                />
                <Text style={styles.infoText}>Comunicados urgentes</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons name="card" size={16} color={COLORS.text.secondary} />
                <Text style={styles.infoText}>Recordatorios de pagos</Text>
              </View>
              <View style={styles.infoItem}>
                <Ionicons
                  name="chatbubbles"
                  size={16}
                  color={COLORS.text.secondary}
                />
                <Text style={styles.infoText}>Respuestas a tus PQR</Text>
              </View>
            </View>

            {/* Estado */}
            <LinearGradient
              colors={
                hasNotifications
                  ? ["#ECFDF5", "#D1FAE5", "#A7F3D0"]
                  : ["#FEF2F2", "#FEE2E2", "#FECACA"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statusCard}
            >
              <Ionicons
                name={hasNotifications ? "checkmark-circle" : "close-circle"}
                size={20}
                color={hasNotifications ? COLORS.success : COLORS.error}
              />
              <Animated.Text
                key={hasNotifications ? "active" : "inactive"}
                entering={FadeIn.duration(200)}
                style={[
                  styles.statusText,
                  {
                    color: hasNotifications ? COLORS.success : COLORS.error,
                  },
                ]}
              >
                {hasNotifications ? "Activadas" : "Desactivadas"}
              </Animated.Text>
            </LinearGradient>

            {/* Botones */}
            {hasNotifications ? (
              <Animated.View
                key="settings"
                entering={
                  hasAnimated.current
                    ? FadeIn.duration(300).delay(200)
                    : undefined
                }
                exiting={
                  hasAnimated.current ? FadeOut.duration(200) : undefined
                }
              >
                <TouchableOpacity
                  style={styles.settingsButton}
                  onPress={openDeviceSettings}
                >
                  <Ionicons
                    name="settings-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                  <Text style={styles.settingsButtonText}>
                    Ir a Configuración
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ) : (
              <Animated.View
                key="activate"
                entering={
                  hasAnimated.current
                    ? FadeIn.duration(300).delay(200)
                    : undefined
                }
                exiting={
                  hasAnimated.current ? FadeOut.duration(200) : undefined
                }
              >
                <TouchableOpacity
                  style={styles.activateButton}
                  onPress={handleToggle}
                >
                  <Ionicons
                    name="notifications"
                    size={20}
                    color={COLORS.text.inverse}
                  />
                  <Text style={styles.activateButtonText}>
                    Activar Notificaciones
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.modalOverlay,
    justifyContent: "center",
    alignItems: "center",
    padding: THEME.spacing.lg,
  },
  modalCard: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.xl,
    width: "100%",
    maxWidth: 400,
    shadowColor: COLORS.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME.spacing.md,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: THEME.fontSize.xl,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: THEME.spacing.xs,
  },
  modalSubtitle: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.text.secondary,
    marginBottom: THEME.spacing.lg,
  },
  loadingContainer: {
    paddingVertical: THEME.spacing.xl,
    alignItems: "center",
  },
  infoSection: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    gap: THEME.spacing.sm,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME.spacing.sm,
  },
  infoText: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.text.secondary,
    flex: 1,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.lg,
    gap: THEME.spacing.sm,
  },
  statusText: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },
  activateButton: {
    backgroundColor: COLORS.primary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
  },
  activateButtonDisabled: {
    opacity: 0.7,
  },
  activateButtonText: {
    color: COLORS.text.inverse,
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },
  settingsButton: {
    backgroundColor: COLORS.primary + "20",
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  settingsButtonText: {
    color: COLORS.primary,
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },

  cancelButtonText: {
    color: COLORS.text.secondary,
    fontSize: THEME.fontSize.md,
    fontWeight: "500",
  },
});
