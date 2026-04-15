import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { MotivoReporte } from "@/types/publicaciones";
import { THEME } from "@/constants/theme";

const MOTIVOS_REPORTE: { id: MotivoReporte; label: string; icon: string }[] = [
  {
    id: "spam",
    label: "Spam o publicidad engañosa",
    icon: "alert-circle-outline",
  },
  { id: "fraude", label: "Posible fraude o estafa", icon: "shield-outline" },
  {
    id: "inapropiado",
    label: "Contenido inapropiado",
    icon: "eye-off-outline",
  },
  { id: "duplicado", label: "Publicación duplicada", icon: "copy-outline" },
  {
    id: "precio_falso",
    label: "Precio o información falsa",
    icon: "pricetag-outline",
  },
  {
    id: "otro",
    label: "Otro motivo",
    icon: "ellipsis-horizontal-circle-outline",
  },
] as const;

interface ReportarPublicacionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (motivo: MotivoReporte) => Promise<void>;
  publicacionTitulo: string;
}

export default function ReportarPublicacionModal({
  visible,
  onClose,
  onConfirm,
  publicacionTitulo,
}: ReportarPublicacionModalProps) {
  const [motivoSeleccionado, setMotivoSeleccionado] =
    useState<MotivoReporte | null>(null);
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!motivoSeleccionado) return;
    setLoading(true);
    try {
      await onConfirm(motivoSeleccionado);
      setMotivoSeleccionado(null);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMotivoSeleccionado(null);
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
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modal}>
              <View style={styles.header}>
                <Ionicons name="flag" size={24} color={THEME.colors.warning} />
                <Text style={styles.title}>Reportar Publicación</Text>
              </View>

              <Text style={styles.subtitle} numberOfLines={2}>
                {publicacionTitulo}
              </Text>

              <Text style={styles.label}>¿Cuál es el motivo del reporte?</Text>

              <View style={styles.motivosList}>
                {MOTIVOS_REPORTE.map((motivo) => {
                  const isSelected = motivoSeleccionado === motivo.id;
                  return (
                    <TouchableOpacity
                      key={motivo.id}
                      style={[
                        styles.motivoItem,
                        isSelected && styles.motivoItemSelected,
                      ]}
                      onPress={() => setMotivoSeleccionado(motivo.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={motivo.icon as any}
                        size={20}
                        color={
                          isSelected
                            ? THEME.colors.warning
                            : THEME.colors.text.secondary
                        }
                      />
                      <Text
                        style={[
                          styles.motivoText,
                          isSelected && styles.motivoTextSelected,
                        ]}
                      >
                        {motivo.label}
                      </Text>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={THEME.colors.warning}
                          style={styles.checkIcon}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

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
                    (!motivoSeleccionado || loading) &&
                      styles.confirmButtonDisabled,
                  ]}
                  onPress={handleConfirm}
                  disabled={!motivoSeleccionado || loading}
                >
                  {loading ? (
                    <ActivityIndicator
                      size="small"
                      color={THEME.colors.text.inverse}
                    />
                  ) : (
                    <>
                      <Ionicons
                        name="flag"
                        size={18}
                        color={THEME.colors.text.inverse}
                      />
                      <Text style={styles.confirmButtonText}>Reportar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
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
    marginBottom: 24,
    lineHeight: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.text.secondary,
    marginBottom: 16,
  },
  motivosList: {
    gap: 8,
    marginBottom: 28,
  },
  motivoItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
    gap: 12,
  },
  motivoItemSelected: {
    borderColor: THEME.colors.warning,
    backgroundColor: THEME.colors.warningLight,
  },
  motivoText: {
    flex: 1,
    fontSize: 15,
    color: THEME.colors.text.heading,
    fontWeight: "500",
  },
  motivoTextSelected: {
    color: THEME.colors.text.heading,
    fontWeight: "600",
  },
  checkIcon: {
    marginLeft: "auto",
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
    backgroundColor: THEME.colors.warning,
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
