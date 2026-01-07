import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface CancelReservationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (motivo: string) => Promise<void>;
  reservationId: number;
  loading?: boolean;
}

export default function CancelReservationModal({
  visible,
  onClose,
  onConfirm,
  reservationId,
  loading = false,
}: CancelReservationModalProps) {
  const [motivo, setMotivo] = useState("");
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!motivo.trim()) {
      setError("El motivo de cancelación es obligatorio");
      return;
    }

    try {
      await onConfirm(motivo.trim());
      setMotivo("");
      setError("");
    } catch {
      setError("Error al cancelar la reserva");
    }
  };

  const handleClose = () => {
    if (loading) return;
    setMotivo("");
    setError("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.overlay}>
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
                <Text style={styles.title}>Cancelar Reserva</Text>
              </View>

              <View style={styles.content}>
                <Text style={styles.label}>Motivo de cancelación *</Text>
                <TextInput
                  style={[styles.input, error && styles.inputError]}
                  value={motivo}
                  onChangeText={(text) => {
                    setMotivo(text);
                    if (error) setError("");
                  }}
                  placeholder="Describe el motivo de la cancelación..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  maxLength={500}
                />
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                <Text style={styles.charCount}>{motivo.length}/500</Text>
              </View>

              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleClose}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.confirmButton,
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleConfirm}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.confirmButtonText}>Confirmar</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modal: {
    backgroundColor: "white",
    borderRadius: 20,
    paddingTop: 8,
    paddingBottom: 20,
    paddingHorizontal: 20,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 20,
  },

  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#222",
    marginBottom: 4,
  },

  content: {
    paddingBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: "#222",
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#222",
    minHeight: 100,
    backgroundColor: "white",
  },
  inputError: {
    borderColor: "#ff5a5f",
  },
  errorText: {
    color: "#ff5a5f",
    fontSize: 14,
    marginTop: 8,
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 8,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  cancelButtonText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "500",
  },
  confirmButton: {
    backgroundColor: "#ff5a5f",
  },
  confirmButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
});
