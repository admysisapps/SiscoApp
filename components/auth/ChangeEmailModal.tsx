import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, THEME } from "@/constants/theme";

interface ChangeEmailModalProps {
  visible: boolean;
  currentEmail?: string;
  onConfirm: (newEmail: string) => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ChangeEmailModal({
  visible,
  currentEmail,
  onConfirm,
  onCancel,
  loading = false,
}: ChangeEmailModalProps) {
  const [newEmail, setNewEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleConfirm = () => {
    setEmailError("");

    if (!newEmail.trim()) {
      setEmailError("El email es requerido");
      return;
    }

    if (!validateEmail(newEmail)) {
      setEmailError("Ingresa un email válido");
      return;
    }

    if (newEmail === currentEmail) {
      setEmailError("El nuevo email debe ser diferente al actual");
      return;
    }

    onConfirm(newEmail);
  };

  const handleCancel = () => {
    setNewEmail("");
    setEmailError("");
    onCancel();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
      statusBarTranslucent
    >
      <View style={styles.backgroundOverlay} />
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? -50 : 0}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <Ionicons name="mail" size={24} color={COLORS.primary} />
              <Text style={styles.title}>Cambiar Correo</Text>
            </View>

            {/* Current Email */}
            <View style={styles.inputSection}>
              <Text style={styles.currentEmailLabel}>Correo actual:</Text>
              <View style={styles.currentEmailContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={COLORS.text.secondary}
                  style={{ marginRight: THEME.spacing.sm }}
                />
                <Text style={styles.currentEmailText}>
                  {currentEmail || "No disponible"}
                </Text>
              </View>
            </View>

            {/* New Email Input */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Nuevo correo:</Text>
              <View
                style={[styles.inputContainer, emailError && styles.inputError]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={COLORS.text.secondary}
                  style={{ marginRight: THEME.spacing.sm }}
                />
                <TextInput
                  style={styles.input}
                  placeholder="nuevo@correo.com"
                  placeholderTextColor={COLORS.text.muted}
                  value={newEmail}
                  onChangeText={(text) => {
                    setNewEmail(text);
                    if (emailError) setEmailError("");
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!loading}
                />
              </View>
              {emailError && <Text style={styles.errorText}>{emailError}</Text>}
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
                disabled={loading}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.confirmButton,
                  loading && styles.disabledButton,
                ]}
                onPress={handleConfirm}
                disabled={loading}
              >
                <Text style={styles.confirmButtonText}>
                  {loading ? "Actualizando..." : "Actualizar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backgroundOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: THEME.spacing.lg,
  },
  modalContainer: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  modal: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: THEME.spacing.lg,
  },
  title: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginLeft: THEME.spacing.sm,
  },
  currentEmailContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  currentEmailLabel: {
    fontSize: THEME.fontSize.xs,
    color: COLORS.text.secondary,
    marginBottom: THEME.spacing.xs,
    marginLeft: THEME.spacing.sm,
  },
  currentEmailText: {
    flex: 1,
    fontSize: THEME.fontSize.md,
    color: COLORS.primary,
    fontWeight: "600",
  },
  inputSection: {
    marginBottom: THEME.spacing.lg,
  },
  inputLabel: {
    fontSize: THEME.fontSize.xs,
    color: COLORS.text.secondary,
    marginBottom: THEME.spacing.xs,
    marginLeft: THEME.spacing.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  input: {
    flex: 1,
    fontSize: THEME.fontSize.md,
    color: COLORS.text.primary,
    paddingVertical: 0,
  },
  errorText: {
    color: COLORS.error,
    fontSize: THEME.fontSize.xs,
    marginTop: THEME.spacing.xs,
    marginLeft: THEME.spacing.sm,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: THEME.spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cancelButtonText: {
    color: COLORS.text.secondary,
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonText: {
    color: "white",
    fontSize: THEME.fontSize.md,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
});
