import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";

import { router } from "expo-router";
import { useProject } from "@/contexts/ProjectContext";

import { useAuth } from "@/contexts/AuthContext";
import { notificationService } from "@/services/notificacionesService";

import { THEME, COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import NotificationModal from "@/components/shared/NotificationModal";
import Toast from "@/components/Toast";
import ScreenHeader from "@/components/shared/ScreenHeader";

export default function AdminPerfil() {
  const { selectedProject, switchProject, proyectos } = useProject();
  const { logout, currentUsername } = useAuth();
  const [notificationModalVisible, setNotificationModalVisible] =
    useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });

  const handleChangeProject = useCallback(() => {
    switchProject();
    router.replace("/project-selector");
  }, [switchProject]);

  const handleSignOut = useCallback(async () => {
    try {
      // Desactivar token en segundo plano (no esperar)
      if (currentUsername) {
        notificationService.deactivateToken(currentUsername).catch(() => {
          // Ignorar errores - el logout debe continuar
        });
      }

      // Cerrar sesión inmediatamente
      await logout();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    }
  }, [logout, currentUsername]);

  const handleChangePassword = useCallback(() => {
    router.push("/(auth)/changePassword");
  }, []);

  const handleNotifications = useCallback(() => {
    setNotificationModalVisible(true);
  }, []);

  const menuItems = [
    {
      id: "personal",
      title: "Información Personal",
      icon: "person-outline",
      onPress: () => router.push("/(screens)/Info_personal"),
    },
    {
      id: "password",
      title: "Cambiar Contraseña",
      icon: "key-outline",
      onPress: handleChangePassword,
    },
    {
      id: "notifications",
      title: "Notificaciones",
      icon: "notifications-outline",
      onPress: handleNotifications,
    },
    {
      id: "payment",
      title: "Gestionar Métodos de Pago",
      icon: "card-outline",
      onPress: () => router.push("/(screens)/pagos/admin/gestionar-cuentas"),
    },
    {
      id: "settings",
      title: "Configuración del Sistema",
      icon: "settings-outline",
      onPress: () => router.push("/(screens)/storage-viewer"),
    },
    {
      id: "support",
      title: "Ayuda y Soporte",
      icon: "help-circle-outline",
      onPress: () => router.push("/(screens)/soporte/support"),
    },
    ...(proyectos.length > 1
      ? [
          {
            id: "change-project",
            title: "Cambiar de Proyecto",
            icon: "swap-horizontal-outline",
            onPress: handleChangeProject,
          },
        ]
      : []),
    {
      id: "logout",
      title: "Cerrar Sesión",
      icon: "log-out-outline",
      onPress: handleSignOut,
      isDestructive: true,
    },
  ];

  return (
    <View style={styles.container}>
      <ScreenHeader title="Panel de Administración" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta de Admin con diseño especial */}
        <LinearGradient
          colors={[COLORS.primaryDark, COLORS.primary, COLORS.primaryLight]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.adminCard}
        >
          {/* Badge de admin */}
          <View style={styles.adminBadgeContainer}>
            <Text style={styles.adminBadgeText}>ADMINISTRADOR</Text>
          </View>

          {/* Información del proyecto */}
          <View style={styles.adminProjectInfo}>
            <Text style={styles.adminProjectName}>
              {selectedProject?.nombre}
            </Text>
            <Text style={styles.adminProjectNit}>
              NIT: {selectedProject?.nit}
            </Text>

            {selectedProject?.descripcion && (
              <Text style={styles.adminProjectDesc}>
                {selectedProject.descripcion}
              </Text>
            )}
          </View>

          {/* Decoración */}
          <View style={styles.adminDecoration}>
            <Ionicons name="business" size={80} color="rgba(255,255,255,0.1)" />
          </View>
        </LinearGradient>

        {/* Lista de Opciones con diseño mejorado */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.lastMenuItem,
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuItemLeft}>
                <LinearGradient
                  colors={
                    item.isDestructive
                      ? [COLORS.error, "#F87171"]
                      : [COLORS.primary, COLORS.primaryLight]
                  }
                  style={styles.adminIconContainer2}
                >
                  <Ionicons name={item.icon as any} size={18} color="white" />
                </LinearGradient>
                <Text
                  style={[
                    styles.menuItemText,
                    item.isDestructive && styles.destructiveText,
                  ]}
                >
                  {item.title}
                </Text>
              </View>

              <Ionicons
                name="chevron-forward"
                size={20}
                color={THEME.colors.text.muted}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <NotificationModal
        visible={notificationModalVisible}
        onClose={() => setNotificationModalVisible(false)}
        userDocument={currentUsername || ""}
        onError={(message) =>
          setToast({ visible: true, message, type: "error" })
        }
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  adminCard: {
    margin: THEME.spacing.md,
    borderRadius: 20,
    padding: THEME.spacing.xl,
    shadowColor: COLORS.text.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    position: "relative",
    overflow: "hidden",
  },
  adminBadgeContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    alignSelf: "center",
    marginBottom: THEME.spacing.lg,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "white",
    letterSpacing: 1,
  },
  adminProjectInfo: {
    alignItems: "center",
  },
  adminProjectName: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
    textAlign: "center",
  },
  adminProjectNit: {
    fontSize: THEME.fontSize.sm,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: THEME.spacing.sm,
  },
  adminProjectDesc: {
    fontSize: THEME.fontSize.sm,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    fontStyle: "italic",
  },
  adminDecoration: {
    position: "absolute",
    right: -20,
    top: -10,
    opacity: 0.1,
  },

  menuContainer: {
    backgroundColor: THEME.colors.surface,
    marginHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    shadowColor: COLORS.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    padding: THEME.spacing.md,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  adminIconContainer2: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: THEME.spacing.md,
  },
  menuItemText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.primary,
    fontWeight: "500",
    flex: 1,
  },
  destructiveText: {
    color: THEME.colors.error,
  },
});
