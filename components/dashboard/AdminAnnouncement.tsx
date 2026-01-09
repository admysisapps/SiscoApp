import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";

// CONFIGURACIÓN DEL ANUNCIO

//Cambia estos valores y publica un OTA update para mostrar/ocultar anuncios

const ANNOUNCEMENT_CONFIG = {
  // Activa/desactiva el anuncio
  active: false,

  // Título del anuncio
  title: "Soporte Disponible",

  // Mensaje del anuncio
  message: "Hoy hay soporte técnico disponible hasta la 1:00 PM",

  // Fecha de expiración (se oculta automáticamente después de esta fecha)
  // Formato: "YYYY-MM-DDTHH:mm:ss"
  expiresAt: "2026-01-09T23:59:00",

  // Tipo de anuncio (afecta el color y el ícono)
  type: "info" as "info" | "warning" | "success" | "error",

  // URL externa (opcional) - Si está presente, el anuncio será clickeable
  // Ejemplos: "https://soporte.siscoapp.com", "https://docs.google.com/..."
  actionUrl: "", // Deja vacío "" si no quieres link

  // Texto del botón (solo si hay actionUrl)
  actionText: "Más información",
};

/**
 * Componente de anuncio para administradores
 *
 * CÓMO USAR:
 * 1. Cambia ANNOUNCEMENT_CONFIG arriba
 * 2. Publica OTA update: 
  eas update --branch preview --message "######" --platform android
  eas update --branch preview --message "#######" Anuncio" --platform ios
 * 3. Los admins verán el anuncio automáticamente
 * 4. Se oculta automáticamente cuando expira o cuando cambias active: false
 */
export default function AdminAnnouncement() {
  // Verificar si el anuncio está activo
  if (!ANNOUNCEMENT_CONFIG.active) {
    return null;
  }

  // Verificar si ya expiró
  const now = new Date();
  const expiryDate = new Date(ANNOUNCEMENT_CONFIG.expiresAt);
  if (now > expiryDate) {
    return null;
  }

  // Manejar click en URL externa
  const handlePress = async () => {
    if (ANNOUNCEMENT_CONFIG.actionUrl) {
      try {
        const canOpen = await Linking.canOpenURL(ANNOUNCEMENT_CONFIG.actionUrl);
        if (canOpen) {
          await Linking.openURL(ANNOUNCEMENT_CONFIG.actionUrl);
        }
      } catch (error) {
        console.error("Error abriendo URL:", error);
      }
    }
  };

  // Configuración de colores e íconos según el tipo
  const typeConfig = {
    info: {
      backgroundColor: "#EFF6FF",
      borderColor: "#3B82F6",
      iconColor: "#3B82F6",
      icon: "information-circle" as keyof typeof Ionicons.glyphMap,
    },
    warning: {
      backgroundColor: "#FEF3C7",
      borderColor: "#F59E0B",
      iconColor: "#F59E0B",
      icon: "warning" as keyof typeof Ionicons.glyphMap,
    },
    success: {
      backgroundColor: "#D1FAE5",
      borderColor: "#10B981",
      iconColor: "#10B981",
      icon: "checkmark-circle" as keyof typeof Ionicons.glyphMap,
    },
    error: {
      backgroundColor: "#FEE2E2",
      borderColor: "#EF4444",
      iconColor: "#EF4444",
      icon: "alert-circle" as keyof typeof Ionicons.glyphMap,
    },
  };

  const config = typeConfig[ANNOUNCEMENT_CONFIG.type];
  const hasAction = ANNOUNCEMENT_CONFIG.actionUrl.trim() !== "";

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor,
        },
      ]}
      onPress={handlePress}
      disabled={!hasAction}
      activeOpacity={hasAction ? 0.7 : 1}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={config.icon} size={24} color={config.iconColor} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{ANNOUNCEMENT_CONFIG.title}</Text>
        <Text style={styles.message}>{ANNOUNCEMENT_CONFIG.message}</Text>

        {hasAction && (
          <View style={styles.actionContainer}>
            <Text style={[styles.actionText, { color: config.iconColor }]}>
              {ANNOUNCEMENT_CONFIG.actionText}
            </Text>
            <Ionicons name="arrow-forward" size={16} color={config.iconColor} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    marginBottom: THEME.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginRight: THEME.spacing.md,
    paddingTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: THEME.fontSize.md,
    fontWeight: "700",
    color: THEME.colors.text.primary,
    marginBottom: THEME.spacing.xs,
  },
  message: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: THEME.spacing.sm,
    gap: 4,
  },
  actionText: {
    fontSize: THEME.fontSize.sm,
    fontWeight: "600",
  },
});
