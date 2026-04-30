import React, { useState, useRef, useCallback } from "react";
import { View, Text, TextInput, StyleSheet, ScrollView } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { pqrService } from "@/services/pqrService";
import { s3Service } from "@/services/s3Service";
import { TipoPeticion } from "@/types/Pqr";
import { THEME } from "@/constants/theme";
import Toast from "@/components/Toast";
import { useProject } from "@/contexts/ProjectContext";
import ConfirmModal from "@/components/asambleas/ConfirmModal";
import ScreenHeader from "@/components/shared/ScreenHeader";
import { Button } from "@/components/reacticx/button";
import PqrTipoSelector from "@/components/pqr/PqrTipoSelector";
import PqrFileUpload from "@/components/pqr/PqrFileUpload";

export default function CreatePQRScreen() {
  const { selectedProject } = useProject();
  const [formData, setFormData] = useState({
    tipo_peticion: "Petición" as TipoPeticion,
    asunto: "",
    descripcion: "",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [archivo, setArchivo] = useState<any>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const descripcionEditadaManualmente = useRef(false);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.asunto.trim()) {
      newErrors.asunto =
        "Escribe un asunto claro (ej: Problema con el ascensor)";
    } else if (formData.asunto.length < 10) {
      newErrors.asunto =
        "El asunto es muy corto. Sé más específico para que podamos ayudarte mejor";
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion =
        "Describe detalladamente tu solicitud para que podamos entenderte mejor";
    } else if (formData.descripcion.length < 20) {
      newErrors.descripcion =
        "Agrega más detalles. Mientras más información nos des, mejor podremos ayudarte";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!selectedProject?.nit) {
      setErrorMessage("No se pudo obtener información del proyecto");
      setShowErrorModal(true);
      return;
    }

    try {
      setLoading(true);

      let archivoS3Key = null;
      let archivoNombre = null;

      // Subir archivo a S3 si existe
      if (archivo && !archivo.uploaded) {
        const uploadResult = await s3Service.uploadPQRFile(
          selectedProject.nit,
          {
            uri: archivo.uri,
            name: archivo.name,
            type: archivo.mimeType,
          }
        );

        if (uploadResult.success) {
          archivoS3Key = uploadResult.key;
          archivoNombre = archivo.name;
        } else {
          showToast(
            `No pudimos subir tu archivo: ${uploadResult.error}. Inténtalo nuevamente.`,
            "error"
          );
          return;
        }
      }

      // Preparar datos para enviar
      const pqrData = {
        ...formData,
        archivo_s3_key: archivoS3Key || undefined,
        archivo_nombre: archivoNombre || undefined,
      };

      const response = await pqrService.crearPQR(pqrData);

      if (response.success) {
        showToast(
          `¡Tu ${formData.tipo_peticion.toLowerCase()} ha sido enviada! Te notificaremos cuando tengamos una respuesta.`,
          "success"
        );
        setTimeout(() => router.back(), 1500);
      } else {
        showToast(
          response.error ||
            "No pudimos enviar tu solicitud. Verifica los datos e inténtalo nuevamente.",
          "error"
        );
      }
    } catch {
      showToast(
        "Problema de conexión. Verifica tu internet e inténtalo nuevamente.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = useCallback(() => {
    router.back();
  }, []);

  const handleTipoPeticionPress = useCallback((tipo: TipoPeticion) => {
    setFormData((prev) => ({ ...prev, tipo_peticion: tipo }));
  }, []);

  const handleRemoveFile = useCallback(() => {
    setArchivo(null);
  }, []);

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" = "success"
  ) => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ visible: false, message: "", type: "success" });
  };

  const handleSelectFile = async () => {
    if (!selectedProject?.nit) {
      setErrorMessage("No se pudo obtener información del proyecto");
      setShowErrorModal(true);
      return;
    }

    try {
      // Seleccionar archivo
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedFile = result.assets[0];

        // Validar tamaño (max 10MB)
        if (selectedFile.size && selectedFile.size > 10 * 1024 * 1024) {
          const sizeMB = (selectedFile.size / (1024 * 1024)).toFixed(1);
          showToast(
            `Tu archivo es muy grande (${sizeMB}MB). Selecciona uno menor a 10MB.`,
            "error"
          );
          return;
        }

        // Solo guardar archivo localmente, NO subir a S3 aún
        setArchivo({
          ...selectedFile,
          uploaded: false, // Marcar como NO subido
        });
      }
    } catch {
      showToast(
        "No pudimos abrir el selector de archivos. Inténtalo nuevamente.",
        "error"
      );
    } finally {
      setUploadingFile(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Nueva PQR" onBackPress={handleBackPress} />

      <KeyboardAvoidingView style={styles.keyboardView} behavior="padding">
        <LinearGradient colors={["#FAFAFA", "#F5F5F5"]} style={styles.gradient}>
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.label}>Asunto *</Text>
            <TextInput
              testID="input-pqr-asunto"
              placeholder="Ej: Solicitud de mantenimiento"
              placeholderTextColor={THEME.colors.text.muted}
              value={formData.asunto}
              onChangeText={(text) => {
                // Auto-completar solo si la descripción NO ha sido editada manualmente
                if (!descripcionEditadaManualmente.current) {
                  setFormData((prev) => ({
                    ...prev,
                    asunto: text,
                    descripcion: text.trim() ? text + ". " : "",
                  }));
                } else {
                  // Solo actualizar asunto
                  setFormData((prev) => ({ ...prev, asunto: text }));
                }

                if (errors.asunto) {
                  setErrors((prev) => ({ ...prev, asunto: "" }));
                }
              }}
              style={[styles.input, errors.asunto && styles.inputError]}
              maxLength={200}
            />
            {errors.asunto && (
              <Text style={styles.errorText}>{errors.asunto}</Text>
            )}
            <Text style={styles.charCount}>{formData.asunto.length}/200</Text>

            <Text style={styles.label}>Descripción *</Text>
            <TextInput
              testID="input-pqr-descripcion"
              placeholder={
                formData.asunto.trim() && !formData.descripcion.trim()
                  ? `${formData.asunto}. Continúa describiendo el problema...`
                  : "Describe detalladamente tu solicitud, queja o reclamo..."
              }
              placeholderTextColor={THEME.colors.text.muted}
              value={formData.descripcion}
              onChangeText={(text) => {
                setFormData((prev) => ({ ...prev, descripcion: text }));

                // Marcar que la descripción fue editada manualmente
                // Solo si el texto no coincide con el auto-completado
                const autoCompletedText = formData.asunto.trim()
                  ? formData.asunto + ". "
                  : "";
                if (text !== autoCompletedText) {
                  descripcionEditadaManualmente.current = true;
                }

                // Si borra todo, permitir auto-completar de nuevo
                if (text.trim() === "") {
                  descripcionEditadaManualmente.current = false;
                }

                if (errors.descripcion) {
                  setErrors((prev) => ({ ...prev, descripcion: "" }));
                }
              }}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              style={[
                styles.input,
                styles.textarea,
                errors.descripcion && styles.inputError,
              ]}
            />
            {errors.descripcion && (
              <Text style={styles.errorText}>{errors.descripcion}</Text>
            )}

            <Text style={styles.label}>Tipo de PQR *</Text>
            <PqrTipoSelector
              selected={formData.tipo_peticion}
              onSelect={handleTipoPeticionPress}
            />

            <Text style={styles.label}>Adjuntar Archivo (Opcional)</Text>
            <PqrFileUpload
              archivo={archivo}
              uploading={uploadingFile}
              onSelect={handleSelectFile}
              onRemove={handleRemoveFile}
            />
          </ScrollView>

          {/* Botón submit fijo abajo */}
          <View style={styles.fixedBottom}>
            <View testID="button-enviar-pqr">
              <Button
                isLoading={loading}
                onPress={handleSubmit}
                loadingText="Enviando..."
                loadingTextColor="#fff"
                backgroundColor={THEME.colors.indigo}
                loadingTextBackgroundColor={THEME.colors.indigo}
                height={56}
                borderRadius={12}
                fullWidth
              >
                <Text style={styles.submitText}>Enviar PQR</Text>
              </Button>
            </View>
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      <ConfirmModal
        visible={showErrorModal}
        type="error"
        title="Error"
        message={errorMessage}
        confirmText="Entendido"
        onConfirm={() => setShowErrorModal(false)}
        onCancel={() => setShowErrorModal(false)}
        showCancel={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.text.heading,
    marginBottom: 8,
    marginTop: THEME.spacing.sm,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: THEME.spacing.xs,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.heading,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  textarea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  inputError: {
    borderWidth: 2,
    borderColor: THEME.colors.error,
  },
  errorText: {
    color: THEME.colors.error,
    fontSize: 14,
    marginTop: 6,
    marginBottom: THEME.spacing.xs,
  },
  charCount: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.text.muted,
    textAlign: "right",
    marginBottom: THEME.spacing.md,
  },
  typeButtons: {
    flexDirection: "row",
    gap: THEME.spacing.xs,
    marginBottom: THEME.spacing.md,
  },
  typeButton: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 0,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  typeButtonActive: {
    backgroundColor: THEME.colors.indigo,
    shadowColor: THEME.colors.indigo,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
  typeButtonText: {
    color: THEME.colors.text.secondary,
    fontSize: THEME.fontSize.sm,
    fontWeight: "500",
  },
  typeButtonTextActive: {
    color: "white",
    fontWeight: "600",
  },
  uploadButton: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: THEME.colors.indigo + "30",
    borderStyle: "dashed",
    borderRadius: THEME.borderRadius.lg,
    paddingVertical: THEME.spacing.xl,
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.indigo + "05",
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadIconContainer: {
    width: 56,
    height: 56,
    borderRadius: THEME.borderRadius.lg,
    backgroundColor: THEME.colors.indigo + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: THEME.spacing.xs,
  },
  uploadTextContainer: {
    alignItems: "center",
    gap: THEME.spacing.xs,
  },
  uploadText: {
    color: THEME.colors.indigo,
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },
  uploadHint: {
    color: THEME.colors.text.secondary,
    fontSize: THEME.fontSize.xs,
    textAlign: "center",
  },
  selectedFileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surface,
    borderWidth: 1.5,
    borderColor: THEME.colors.indigo + "30",
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    gap: THEME.spacing.sm,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  selectedFileCardUploaded: {
    borderColor: THEME.colors.success + "40",
    backgroundColor: THEME.colors.success + "08",
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.indigo + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  fileIconContainerUploaded: {
    backgroundColor: THEME.colors.success + "15",
  },
  fileInfoContainer: {
    flex: 1,
    gap: THEME.spacing.xs,
  },
  fileNameText: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  fileMetadata: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME.spacing.xs,
  },
  fileMetadataText: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.text.secondary,
  },
  uploadedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: THEME.colors.success + "15",
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.sm,
  },
  uploadedBadgeText: {
    fontSize: THEME.fontSize.xs,
    fontWeight: "600",
    color: THEME.colors.success,
  },
  deleteButton: {
    padding: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.sm,
  },
  fixedBottom: {
    backgroundColor: "#FFFFFF",
    padding: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  submitText: {
    color: "white",
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },
});
