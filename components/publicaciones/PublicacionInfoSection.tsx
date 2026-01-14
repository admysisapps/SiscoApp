import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";
import { useRole } from "@/hooks/useRole";
import { Publicacion } from "@/types/publicaciones";

interface PublicacionInfoSectionProps {
  anuncio: Publicacion;
  onBlock?: () => void;
  onShowError: (message: string) => void;
}

export default function PublicacionInfoSection({
  anuncio,
  onBlock,
  onShowError,
}: PublicacionInfoSectionProps) {
  const { isAdmin } = useRole();

  const handleCall = async () => {
    const phoneNumber = anuncio.contacto.replace(/[^0-9]/g, "");
    if (!phoneNumber || phoneNumber.length < 7) {
      onShowError("Número de teléfono inválido");
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(`tel:${phoneNumber}`);
      if (canOpen) {
        await Linking.openURL(`tel:${phoneNumber}`);
      } else {
        onShowError("No se pudo abrir la aplicación de teléfono");
      }
    } catch (error) {
      console.error("Error opening phone:", error);
      onShowError("No se pudo realizar la llamada");
    }
  };

  const handleWhatsApp = async () => {
    const phoneNumber = anuncio.contacto.replace(/[^0-9]/g, "");
    if (!phoneNumber || phoneNumber.length < 7) {
      onShowError("Número de teléfono inválido");
      return;
    }
    const message = `Hola, me interesa tu publicación: ${anuncio.titulo}`;
    try {
      const canOpen = await Linking.canOpenURL(
        `whatsapp://send?phone=${phoneNumber}`
      );
      if (canOpen) {
        await Linking.openURL(
          `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`
        );
      } else {
        onShowError("WhatsApp no está instalado");
      }
    } catch (error) {
      console.error("Error opening WhatsApp:", error);
      onShowError("No se pudo abrir WhatsApp");
    }
  };

  return (
    <View style={styles.content}>
      <View style={styles.filtersRow}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>
            {anuncio.tipo.charAt(0).toUpperCase() + anuncio.tipo.slice(1)}
          </Text>
        </View>
        {anuncio.negociable && (
          <View style={styles.negotiableBadge}>
            <Ionicons name="pricetag" size={14} color={THEME.colors.success} />
            <Text style={styles.negotiableText}>Negociable</Text>
          </View>
        )}
      </View>

      {anuncio.estado === "bloqueada" && anuncio.razon_bloqueo && (
        <View style={styles.blockAlert}>
          <Ionicons name="warning" size={20} color={THEME.colors.error} />
          <View style={styles.blockAlertContent}>
            <Text style={styles.blockAlertTitle}>Publicación bloqueada</Text>
            <Text style={styles.blockAlertText}>{anuncio.razon_bloqueo}</Text>
          </View>
        </View>
      )}

      {anuncio.precio > 0 && (
        <View style={styles.priceSection}>
          <Text style={styles.priceText}>
            ${anuncio.precio.toLocaleString()}
          </Text>
        </View>
      )}

      <View style={styles.infoSection}>
        <Text style={styles.titulo}>{anuncio.titulo || "Sin título"}</Text>
        <Text style={styles.descripcion}>
          {anuncio.descripcion || "Sin descripción disponible"}
        </Text>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
          <Ionicons name="call" size={18} color={THEME.colors.phone} />
          <Text style={styles.contactButtonText}>Llamar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.whatsappButton}
          onPress={handleWhatsApp}
        >
          <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
          <Text style={styles.whatsappButtonText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>

      {isAdmin && onBlock && (
        <TouchableOpacity style={styles.blockButton} onPress={onBlock}>
          <Ionicons name="ban" size={18} color={THEME.colors.error} />
          <Text style={styles.blockButtonText}>Bloquear Publicación</Text>
        </TouchableOpacity>
      )}

      {anuncio.estado === "bloqueada" && anuncio.fecha_moderacion && (
        <View style={styles.moderationInfo}>
          <Text style={styles.moderationText}>
            Bloqueada el{" "}
            {new Date(anuncio.fecha_moderacion).toLocaleDateString()}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: THEME.spacing.lg,
    backgroundColor: THEME.colors.surface,
  },
  filtersRow: {
    flexDirection: "row",
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
    flexWrap: "wrap",
  },
  typeBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.full,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  typeText: {
    fontSize: THEME.fontSize.xs,
    fontWeight: "700",
    color: THEME.colors.primary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  negotiableBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: 8,
    borderRadius: THEME.borderRadius.full,
    gap: 6,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  negotiableText: {
    fontSize: THEME.fontSize.xs,
    fontWeight: "700",
    color: THEME.colors.success,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  blockAlert: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    gap: THEME.spacing.md,
  },
  blockAlertContent: {
    flex: 1,
  },
  blockAlertTitle: {
    fontSize: THEME.fontSize.sm,
    fontWeight: "700",
    color: THEME.colors.error,
    marginBottom: 6,
  },
  blockAlertText: {
    fontSize: THEME.fontSize.xs,
    color: "#991B1B",
    lineHeight: 22,
  },
  priceSection: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: THEME.spacing.md,
    gap: THEME.spacing.sm,
    flexWrap: "wrap",
  },
  priceText: {
    fontSize: 28,
    fontWeight: "700",
    color: THEME.colors.text.primary,
    letterSpacing: -0.5,
  },
  infoSection: {
    marginBottom: THEME.spacing.lg,
  },
  titulo: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    lineHeight: 28,
    marginBottom: THEME.spacing.sm,
    letterSpacing: -0.2,
  },
  descripcion: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    lineHeight: 24,
  },

  actionButtons: {
    flexDirection: "row",
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.lg,
    paddingBottom: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  contactButton: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#007AFF",
  },
  contactButtonText: {
    color: "#007AFF",
    fontSize: THEME.fontSize.sm,
    fontWeight: "600",
  },
  whatsappButton: {
    flex: 1,
    backgroundColor: "#25D366",
    borderRadius: THEME.borderRadius.md,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  whatsappButtonText: {
    color: THEME.colors.text.inverse,
    fontSize: THEME.fontSize.sm,
    fontWeight: "600",
  },
  blockButton: {
    marginTop: THEME.spacing.md,
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    borderRadius: THEME.borderRadius.md,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  blockButtonText: {
    color: THEME.colors.error,
    fontSize: THEME.fontSize.sm,
    fontWeight: "600",
  },
  moderationInfo: {
    marginTop: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  moderationText: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.text.muted,
    textAlign: "center",
  },
});
