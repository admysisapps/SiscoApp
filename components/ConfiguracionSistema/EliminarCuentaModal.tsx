import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  ActivityIndicator,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";
import { propietarioService } from "@/services/propietarioService";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "expo-router";

import { notificationService } from "@/services/notificacionesService";

interface EliminarCuentaModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function EliminarCuentaModal({
  visible,
  onClose,
  onConfirm,
}: EliminarCuentaModalProps) {
  const { logout } = useAuth();
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleEliminarCuenta = async () => {
    try {
      setIsDeleting(true);
      const response = await propietarioService.eliminarCuenta();

      if (response.success) {
        await notificationService.sendGoodbyeNotification();
        await logout();
        setTimeout(() => {
          router.replace("/(auth)/login");
        }, 500);
      } else {
        alert(response.error || "Error al eliminar cuenta");
        setIsDeleting(false);
      }
    } catch {
      alert("Error al eliminar cuenta");
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          {/* Título */}
          <Text style={styles.title}>¿Estás seguro de eliminar tu cuenta?</Text>

          {/* Descripción */}
          <Text style={styles.description}>
            Al eliminar tu cuenta perderás el acceso a todos los servicios y
            datos asociados.
          </Text>
          <Text style={styles.descriptionBold}>
            ¿Estás seguro de que deseas continuar?
          </Text>

          {/* Tarjeta de información */}
          <TouchableOpacity
            style={styles.infoCard}
            onPress={() => Linking.openURL("https://wa.me/573203024982")}
            activeOpacity={0.7}
          >
            <View style={styles.infoCardContent}>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Chat de soporte</Text>
                <Text style={styles.infoSubtitle}>Soporte por mensajería</Text>
              </View>
            </View>
            <FontAwesome5
              name="whatsapp-square"
              size={32}
              color={THEME.colors.error}
            />
          </TouchableOpacity>

          {/* Botones */}
          <TouchableOpacity
            style={[
              styles.deleteButton,
              isDeleting && styles.deleteButtonDisabled,
            ]}
            onLongPress={handleEliminarCuenta}
            delayLongPress={800}
            activeOpacity={0.8}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Text style={styles.deleteButtonText}>
                Mantén presionado para eliminar
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>No, cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    backgroundColor: THEME.colors.modalOverlay,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: THEME.spacing.lg,
    paddingTop: THEME.spacing.xl,
    paddingBottom: 40,
    maxHeight: "90%",
  },

  illustrationContainer: {
    alignItems: "center",
    marginTop: THEME.spacing.xl * 2,
    marginBottom: THEME.spacing.lg,
  },
  illustrationCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: THEME.colors.error + "20",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: THEME.fontSize.xl,
    fontWeight: "700",
    color: THEME.colors.error,
    textAlign: "center",
    marginBottom: THEME.spacing.md,
    marginTop: THEME.spacing.md,
  },
  description: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.secondary,
    textAlign: "center",
    marginBottom: THEME.spacing.sm,
    lineHeight: 22,
  },
  descriptionBold: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    textAlign: "center",
    marginBottom: THEME.spacing.lg,
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  infoCardContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoTextContainer: {
    marginLeft: THEME.spacing.sm,
    flex: 1,
  },
  infoTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: 2,
  },
  infoSubtitle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
  },
  deleteButton: {
    backgroundColor: THEME.colors.error,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    alignItems: "center",
    marginBottom: THEME.spacing.sm,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: "#FFF",
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    alignItems: "center",
    borderWidth: 2,
    borderColor: THEME.colors.error,
    marginBottom: THEME.spacing.md,
  },
  cancelButtonText: {
    color: THEME.colors.error,
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },
});
