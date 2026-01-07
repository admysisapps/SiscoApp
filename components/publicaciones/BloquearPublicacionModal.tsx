import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "../Toast";
import { THEME } from "../../constants/theme";

interface BloquearPublicacionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (razon: string) => Promise<void>;
  publicacionTitulo: string;
}

export default function BloquearPublicacionModal({
  visible,
  onClose,
  onConfirm,
  publicacionTitulo,
}: BloquearPublicacionModalProps) {
  const [razon, setRazon] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });

  const handleConfirm = async () => {
    if (!razon.trim()) {
      setToast({
        visible: true,
        message: "Debes ingresar un motivo de bloqueo",
        type: "warning",
      });
      return;
    }

    setLoading(true);
    try {
      await onConfirm(razon.trim());
      setRazon("");
      setToast({
        visible: true,
        message: "Publicación bloqueada exitosamente",
        type: "success",
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch {
      setToast({
        visible: true,
        message: "Error al bloquear la publicación",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setRazon("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modal}>
              <View style={styles.header}>
                <Ionicons name="ban" size={24} color={THEME.colors.error} />
                <Text style={styles.title}>Bloquear Publicación</Text>
              </View>

              <Text style={styles.subtitle}>{publicacionTitulo}</Text>

              <Text style={styles.label}>
                Motivo del bloqueo <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.textArea}
                placeholder="Describe la razón por la cual se bloquea esta publicación..."
                value={razon}
                onChangeText={setRazon}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={THEME.colors.text.muted}
              />

              <View style={styles.actions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={handleClose}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    (!razon.trim() || loading) && styles.confirmButtonDisabled,
                  ]}
                  onPress={handleConfirm}
                  disabled={!razon.trim() || loading}
                >
                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color={THEME.colors.text.inverse}
                    />
                  ) : (
                    <>
                      <Ionicons
                        name="ban"
                        size={18}
                        color={THEME.colors.text.inverse}
                      />
                      <Text style={styles.confirmButtonText}>Bloquear</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          <Toast
            visible={toast.visible}
            message={toast.message}
            type={toast.type}
            onHide={() => setToast({ ...toast, visible: false })}
          />
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: THEME.colors.modalOverlay,
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.lg,
  },
  modal: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 20,
    padding: 32,
    width: "98%",
    maxWidth: 600,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: THEME.colors.header.title,
  },
  subtitle: {
    fontSize: 16,
    color: THEME.colors.text.secondary,
    marginBottom: 28,
    lineHeight: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.text.secondary,
    marginBottom: 12,
  },
  required: {
    color: THEME.colors.error,
  },
  textArea: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: THEME.colors.text.heading,
    minHeight: 140,
    maxHeight: 200,
    marginBottom: 28,
    lineHeight: 24,
  },
  actions: {
    flexDirection: "row",
    gap: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.text.secondary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: THEME.colors.error,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  confirmButtonDisabled: {
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.text.inverse,
  },
});
