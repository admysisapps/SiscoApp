import React, { useState, useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useProject } from "@/contexts/ProjectContext";
import { useAuth } from "@/contexts/AuthContext";
import { notificationService } from "@/services/notificacionesService";
import NotificationModal from "@/components/shared/NotificationModal";
import Toast from "@/components/Toast";
import { THEME } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import ScreenHeader from "@/components/shared/ScreenHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface MenuItemType {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
  isDestructive?: boolean;
}

const MenuItem = memo(
  ({
    item,
    isLast,
    onPress,
    isLoggingOut,
  }: {
    item: MenuItemType;
    isLast: boolean;
    onPress: () => void;
    isLoggingOut?: boolean;
  }) => (
    <TouchableOpacity
      testID={item.id === "logout" ? "button-cerrar-sesion" : undefined}
      style={[styles.menuItem, isLast && styles.lastMenuItem]}
      onPress={onPress}
      activeOpacity={0.7}
      disabled={isLoggingOut}
    >
      <View style={styles.menuItemLeft}>
        <View
          style={[
            styles.iconContainer,
            item.isDestructive && styles.destructiveIconContainer,
          ]}
        >
          {isLoggingOut ? (
            <ActivityIndicator size="small" color={THEME.colors.error} />
          ) : (
            <Ionicons
              name={item.icon as any}
              size={20}
              color={
                item.isDestructive
                  ? THEME.colors.error
                  : THEME.colors.text.secondary
              }
            />
          )}
        </View>
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
  )
);
MenuItem.displayName = "MenuItem";

export default function ContadorPerfil() {
  const { selectedProject, switchProject, proyectos } = useProject();
  const { logout, currentUsername } = useAuth();
  const insets = useSafeAreaInsets();

  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
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
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      if (currentUsername) {
        notificationService.deactivateToken(currentUsername).catch(() => {});
      }
      await logout();
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Error cerrando sesión:", error);
      setIsLoggingOut(false);
      setToast({
        visible: true,
        message: "Error al cerrar sesión",
        type: "error",
      });
    }
  }, [logout, currentUsername, isLoggingOut]);

  const menuItems = useMemo(
    (): MenuItemType[] => [
      {
        id: "personal",
        title: "Información Personal",
        icon: "id-card-outline",
        onPress: () => router.push("/(screens)/Info_personal"),
      },
      {
        id: "password",
        title: "Cambiar Contraseña",
        icon: "lock-closed-outline",
        onPress: () => router.push("/(auth)/changePassword"),
      },
      {
        id: "notifications",
        title: "Notificaciones",
        icon: "notifications-outline",
        onPress: () => setShowNotificationModal(true),
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
    ],
    [handleSignOut, handleChangeProject, proyectos.length]
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Perfil" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
      >
        <View style={styles.projectCard}>
          <View style={styles.projectBadge}>
            <Text style={styles.projectBadgeText}>PROYECTO ACTUAL</Text>
          </View>
          <View style={styles.projectInfo}>
            <Text style={styles.projectName}>{selectedProject?.nombre}</Text>
            <Text style={styles.projectNit}>NIT: {selectedProject?.nit}</Text>
            {selectedProject?.descripcion && (
              <Text style={styles.projectDesc}>
                {selectedProject.descripcion}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <MenuItem
              key={item.id}
              item={item}
              isLast={index === menuItems.length - 1}
              onPress={
                item.id === "logout" && isLoggingOut ? () => {} : item.onPress
              }
              isLoggingOut={item.id === "logout" && isLoggingOut}
            />
          ))}
        </View>
      </ScrollView>

      <NotificationModal
        visible={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        userDocument={currentUsername || ""}
        onError={(message) =>
          setToast({ visible: true, message, type: "error" })
        }
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() =>
          setToast({ visible: false, message: "", type: "success" })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  projectCard: {
    backgroundColor: THEME.colors.surface,
    margin: THEME.spacing.md,
    padding: THEME.spacing.xl,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#05966915",
  },
  projectBadge: {
    backgroundColor: "#05966910",
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "center",
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: "#05966920",
  },
  projectBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#059669",
    letterSpacing: 0.8,
  },
  projectInfo: {
    alignItems: "center",
  },
  projectName: {
    fontSize: 22,
    fontWeight: "700",
    color: THEME.colors.text.primary,
    marginBottom: 4,
    textAlign: "center",
  },
  projectNit: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.sm,
    fontWeight: "500",
  },
  projectDesc: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    textAlign: "center",
    fontStyle: "italic",
    lineHeight: 18,
  },

  menuContainer: {
    backgroundColor: THEME.colors.surface,
    marginHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    padding: THEME.spacing.sm,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: THEME.spacing.lg,
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
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: THEME.spacing.md,
  },
  destructiveIconContainer: {
    backgroundColor: THEME.colors.error + "15",
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
