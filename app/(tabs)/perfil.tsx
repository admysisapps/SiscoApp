import React, { useState, useCallback, useMemo, memo } from "react";
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

import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import PaymentMethodsModal from "@/components/pagos/PaymentMethodsModal";
import UnirseProyectoModal from "@/components/proyectos/UnirseProyectoModal";
import NotificationModal from "@/components/shared/NotificationModal";

import Toast from "@/components/Toast";
import { THEME } from "@/constants/theme";
import { Ionicons, Entypo } from "@expo/vector-icons";
import ScreenHeader from "@/components/shared/ScreenHeader";

// Tipo para los items del menú
interface MenuItemType {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
  isDestructive?: boolean;
  isSuccess?: boolean;
}

// Componente memoizado para items del menú
const MenuItem = memo(
  ({
    item,
    index,
    isLast,
    onPress,
  }: {
    item: MenuItemType;
    index: number;
    isLast: boolean;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.menuItem, isLast && styles.lastMenuItem]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View
          style={[
            styles.iconContainer,
            item.isDestructive && styles.destructiveIconContainer,
            item.isSuccess && styles.successIconContainer,
          ]}
        >
          <Ionicons
            name={item.icon as any}
            size={20}
            color={
              item.isDestructive
                ? THEME.colors.error
                : item.isSuccess
                  ? THEME.colors.success
                  : THEME.colors.text.secondary
            }
          />
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

export default function Perfil() {
  const { selectedProject, switchProject, proyectos } = useProject();
  const { logout, currentUsername } = useAuth();
  const {
    showModal,
    openPaymentMethods,
    closePaymentMethods,
    cuentas,
    loading,
    error,
    refreshCuentas,
  } = usePaymentMethods();

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });

  // Handlers memoizados
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
      setToast({
        visible: true,
        message: "Error al cerrar sesión",
        type: "error",
      });
    }
  }, [logout, currentUsername]);

  const handlePersonalInfo = useCallback(() => {
    router.push("/(screens)/Info_personal");
  }, []);

  const handleChangePassword = useCallback(() => {
    router.push("/(auth)/changePassword");
  }, []);

  const handleJoinProject = useCallback(() => {
    setShowJoinModal(true);
  }, []);

  const handleNotifications = useCallback(() => {
    setShowNotificationModal(true);
  }, []);

  const handleJoinSuccess = useCallback(() => {
    setToast({
      visible: true,
      message: "Te has unido al proyecto exitosamente",
      type: "success",
    });
    // Recargar proyectos después de unirse
    router.replace("/project-selector");
  }, []);

  const handleJoinError = useCallback((message: string) => {
    setToast({ visible: true, message, type: "error" });
  }, []);

  const hideToast = useCallback(() => {
    setToast({ visible: false, message: "", type: "success" });
  }, []);

  // Menu items memoizado
  const menuItems = useMemo((): MenuItemType[] => {
    const baseItems: MenuItemType[] = [
      {
        id: "personal",
        title: "Información Personal",
        icon: "id-card-outline",
        onPress: handlePersonalInfo,
      },
      {
        id: "password",
        title: "Cambiar Contraseña",
        icon: "lock-closed-outline",
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
        title: "Informacion de Pago",
        icon: "card-outline",
        onPress: openPaymentMethods,
      },
      {
        id: "support",
        title: "Ayuda y Soporte",
        icon: "help-circle-outline",
        onPress: () => router.push("/(screens)/soporte/support"),
      },
      {
        id: "join-project",
        title: "Unirse a Otro Proyecto",
        icon: "add-circle",
        onPress: handleJoinProject,
        isSuccess: true,
      },
    ];

    if (proyectos.length > 1) {
      baseItems.push({
        id: "change-project",
        title: "Cambiar de Proyecto",
        icon: "swap-horizontal-outline",
        onPress: handleChangeProject,
      });
    }

    baseItems.push({
      id: "logout",
      title: "Cerrar Sesión",
      icon: "log-out-outline",
      onPress: handleSignOut,
      isDestructive: true,
    });

    return baseItems;
  }, [
    proyectos.length,
    handleChangeProject,
    handleSignOut,
    handlePersonalInfo,
    handleChangePassword,
    handleJoinProject,
    handleNotifications,
    openPaymentMethods,
  ]);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Perfil" />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
      >
        {/* Tarjeta del Conjunto */}
        <View style={styles.projectCard}>
          {/* Badge de proyecto */}
          <View style={styles.projectBadge}>
            <Text style={styles.projectBadgeText}>PROYECTO ACTUAL</Text>
          </View>

          {/* Información del proyecto */}
          <View style={styles.projectInfo}>
            <Text style={styles.projectName}>{selectedProject?.Nombre}</Text>
            <Text style={styles.projectNit}>NIT: {selectedProject?.NIT}</Text>

            {selectedProject?.descripcion && (
              <Text style={styles.projectDesc}>
                {selectedProject.descripcion}
              </Text>
            )}
          </View>

          {/* Decoración sutil */}
          <View style={styles.projectDecoration}>
            <Entypo name="tree" size={100} color="rgba(0,0,0,0.05)" />
          </View>
        </View>

        {/* Lista de Opciones */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <MenuItem
              key={item.id}
              item={item}
              index={index}
              isLast={index === menuItems.length - 1}
              onPress={item.onPress}
            />
          ))}
        </View>
      </ScrollView>

      <PaymentMethodsModal
        visible={showModal}
        onClose={closePaymentMethods}
        cuentas={cuentas}
        loading={loading}
        error={error}
        onRefresh={refreshCuentas}
      />

      <UnirseProyectoModal
        visible={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        onSuccess={handleJoinSuccess}
        onError={handleJoinError}
      />

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
        onHide={hideToast}
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
    borderColor: THEME.colors.primary + "15",
  },
  projectBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.primary + "10",
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: "center",
    marginBottom: THEME.spacing.lg,
    gap: 6,
    borderWidth: 1,
    borderColor: THEME.colors.primary + "20",
  },
  projectBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.colors.primary,
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
  projectDecoration: {
    position: "absolute",
    right: -20,
    top: -10,
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
  successIconContainer: {
    backgroundColor: THEME.colors.success + "15",
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
