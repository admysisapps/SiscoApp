import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Keyboard,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { THEME, COLORS } from "@/constants/theme";
import { s3Service } from "@/services/s3Service";
import { useProject } from "@/contexts/ProjectContext";
import { CreateAvisoRequest } from "@/types/Avisos";
import { getAvisoIcon, getAvisoColor } from "@/utils/avisoUtils";
import { router } from "expo-router";
import { avisosService } from "@/services/avisoService";
import Toast from "@/components/Toast";
import ScreenHeader from "@/components/shared/ScreenHeader";
import { Button } from "@/components/reacticx/button";

interface SelectedFile {
  uri: string;
  name: string;
  type?: string;
  id?: string;
}

const tiposAviso = [
  { value: "general", label: "General" },
  { value: "mantenimiento", label: "Mantenimiento" },
  { value: "emergencia", label: "Emergencia" },
  { value: "recordatorio", label: "Recordatorio" },
  { value: "pago", label: "Pagos" },
  { value: "advertencia", label: "Advertencia" },
] as const;

const prioridades = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
] as const;

export default function CrearAvisoScreen() {
  const [formData, setFormData] = useState<
    CreateAvisoRequest & { archivos_nombres?: string }
  >({
    tipo: "general",
    titulo: "",
    descripcion: "",
    fecha_evento: "",
    prioridad: "media",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const { selectedProject } = useProject();
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error" | "warning",
  });
  const [behavior, setBehavior] = useState<"padding" | "height" | undefined>(
    Platform.OS === "ios" ? "padding" : "height"
  );

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener("keyboardDidShow", () => {
      setBehavior(Platform.OS === "ios" ? "padding" : "height");
    });

    const keyboardHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setBehavior(undefined);
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
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

  const validateField = (field: string, value: any) => {
    const newErrors = { ...errors };

    switch (field) {
      case "titulo":
        if (!value.trim()) {
          newErrors.titulo = "El título es requerido";
        } else if (value.trim().length < 5) {
          newErrors.titulo = "El título debe tener al menos 5 caracteres";
        } else {
          delete newErrors.titulo;
        }
        break;

      case "descripcion":
        if (!value.trim()) {
          newErrors.descripcion = "La descripción es requerida";
        } else if (value.trim().length < 10) {
          newErrors.descripcion =
            "La descripción debe tener al menos 10 caracteres";
        } else {
          delete newErrors.descripcion;
        }
        break;
    }

    setErrors(newErrors);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = "El título es requerido";
    } else if (formData.titulo.trim().length < 5) {
      newErrors.titulo = "El título debe tener al menos 5 caracteres";
    }

    if (!formData.descripcion.trim()) {
      newErrors.descripcion = "La descripción es requerida";
    } else if (formData.descripcion.trim().length < 10) {
      newErrors.descripcion =
        "La descripción debe tener al menos 10 caracteres";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (validateForm()) {
      setLoading(true);

      try {
        let archivos_nombres: string | undefined = undefined;

        if (selectedFiles.length > 0) {
          if (!selectedProject?.nit) {
            showToast("No se encontró información del proyecto", "error");
            return;
          }

          const uploadResult = await s3Service.uploadAvisoFiles(
            selectedProject.nit,
            selectedFiles
          );

          if (uploadResult.success) {
            archivos_nombres = JSON.stringify(uploadResult.fileNames);
          } else {
            showToast("Error al subir archivos", "error");
            return;
          }
        }

        const avisoToSave = {
          ...formData,
          fecha_evento: selectedDate
            ? selectedDate.toISOString().split("T")[0]
            : undefined,
          archivos_nombres: archivos_nombres || undefined,
        };

        const response = await avisosService.crearAviso(
          avisoToSave as CreateAvisoRequest
        );

        if (response.success) {
          showToast("Comunicado creado correctamente", "success");
          setTimeout(() => router.back(), 1500);
        } else {
          showToast(
            response.error || "No se pudo crear el comunicado",
            "error"
          );
        }
      } finally {
        setLoading(false);
      }
    }
  };
  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setFormData({ ...formData, fecha_evento: date.toISOString() });
    }
  };

  const formatDateDisplay = (date: Date | null) => {
    if (!date) return "Seleccionar fecha";
    return date.toLocaleDateString("es-CO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const clearDate = () => {
    setSelectedDate(null);
    setFormData({ ...formData, fecha_evento: "" });
  };

  const selectImage = async () => {
    try {
      // Solicitar permisos
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permisos requeridos",
          "Necesitamos acceso a tu galería para seleccionar imágenes"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1.0,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        setSelectedFiles((prev) => [
          ...prev,
          {
            uri: asset.uri,
            name: asset.fileName || `image_${Date.now()}.jpg`,
            type: asset.type || "image/jpeg",
            id: Date.now().toString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error en selectImage:", error);
      Alert.alert("Error", "No se pudo abrir la galería: " + error);
    }
  };

  const selectDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];

        // Validar que no sea un archivo de video
        const isVideo =
          asset.mimeType?.startsWith("video/") ||
          asset.name.match(/\.(mp4|avi|mov|wmv|flv|webm|mkv|m4v)$/i);

        if (isVideo) {
          Alert.alert(
            "Archivo no soportado",
            "Los archivos de video no están permitidos. Solo se permiten documentos e imágenes."
          );
          return;
        }

        setSelectedFiles([
          ...selectedFiles,
          {
            uri: asset.uri,
            name: asset.name,
            type: asset.mimeType,
            id: Date.now().toString(),
          },
        ]);
      }
    } catch (error) {
      console.error("Error selecting document:", error);
      Alert.alert("Error", "No se pudo abrir el selector de documentos");
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(selectedFiles.filter((_, i) => i !== index));
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Crear Comunicado" />

      <KeyboardAvoidingView style={styles.flex} behavior={behavior}>
        <LinearGradient colors={["#FAFAFA", "#F5F5F5"]} style={styles.gradient}>
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Tipo de Aviso */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tipo de Comunicado</Text>
              <View style={styles.optionsGrid}>
                {tiposAviso.map((tipo) => {
                  const isSelected = formData.tipo === tipo.value;
                  const color = getAvisoColor(
                    isSelected ? formData.prioridad : "baja"
                  );
                  return (
                    <TouchableOpacity
                      key={tipo.value}
                      style={[
                        styles.optionCard,
                        isSelected && styles.selectedOption,
                        isSelected && { borderColor: color },
                      ]}
                      onPress={() =>
                        setFormData({ ...formData, tipo: tipo.value as any })
                      }
                    >
                      <Ionicons
                        name={
                          getAvisoIcon(
                            tipo.value
                          ) as keyof typeof Ionicons.glyphMap
                        }
                        size={20}
                        color={isSelected ? color : THEME.colors.text.secondary}
                      />
                      <Text
                        style={[styles.optionText, isSelected && { color }]}
                      >
                        {tipo.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Prioridad */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Prioridad</Text>
              <View style={styles.priorityOptions}>
                {prioridades.map((prioridad) => {
                  const isSelected = formData.prioridad === prioridad.value;
                  const color = getAvisoColor(prioridad.value);
                  return (
                    <TouchableOpacity
                      key={prioridad.value}
                      style={[
                        styles.priorityOption,
                        isSelected && {
                          backgroundColor: color,
                        },
                      ]}
                      onPress={() =>
                        setFormData({
                          ...formData,
                          prioridad: prioridad.value as any,
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.priorityText,
                          isSelected && styles.priorityTextSelected,
                        ]}
                      >
                        {prioridad.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Título */}
            <View style={styles.section}>
              <Text style={styles.label}>Título *</Text>
              <TextInput
                style={[styles.input, errors.titulo && styles.inputError]}
                placeholder="Ej: Corte de agua programado"
                placeholderTextColor={COLORS.text.muted}
                value={formData.titulo}
                onChangeText={(text) => {
                  setFormData({ ...formData, titulo: text });
                  validateField("titulo", text);
                }}
              />
              {errors.titulo && (
                <Text style={styles.errorText}>{errors.titulo}</Text>
              )}
            </View>

            {/* Descripción */}
            <View style={styles.section}>
              <Text style={styles.label}>Descripción *</Text>
              <TextInput
                style={[
                  styles.textArea,
                  errors.descripcion && styles.inputError,
                ]}
                placeholder="Describe los detalles del comunicado..."
                placeholderTextColor={COLORS.text.muted}
                value={formData.descripcion}
                onChangeText={(text) => {
                  setFormData({ ...formData, descripcion: text });
                  validateField("descripcion", text);
                }}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              {errors.descripcion && (
                <Text style={styles.errorText}>{errors.descripcion}</Text>
              )}
            </View>

            {/* Fecha del Evento */}
            <View style={styles.section}>
              <Text style={styles.label}>Fecha del Evento (Opcional)</Text>

              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text
                  style={[
                    styles.datePickerText,
                    !selectedDate && styles.datePickerPlaceholder,
                  ]}
                >
                  {formatDateDisplay(selectedDate)}
                </Text>
                {selectedDate && (
                  <TouchableOpacity
                    onPress={clearDate}
                    style={styles.clearDateButton}
                  >
                    <Ionicons
                      name="close-circle"
                      size={20}
                      color={THEME.colors.text.secondary}
                    />
                  </TouchableOpacity>
                )}
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate || new Date()}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}

              <Text style={styles.helpText}>
                Fecha en que ocurrirá el evento (ej: corte de agua, asamblea)
              </Text>
            </View>

            {/* Archivos */}
            <View style={styles.section}>
              <Text style={styles.label}>Archivos (Opcional)</Text>

              <View style={styles.fileButtonsRow}>
                <TouchableOpacity
                  style={styles.fileButton}
                  onPress={selectImage}
                >
                  <Ionicons
                    name="image"
                    size={20}
                    color={THEME.colors.primary}
                  />
                  <Text style={styles.fileButtonText}>Imagen</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.fileButton}
                  onPress={selectDocument}
                >
                  <Ionicons
                    name="document"
                    size={20}
                    color={THEME.colors.primary}
                  />
                  <Text style={styles.fileButtonText}>Documento</Text>
                </TouchableOpacity>
              </View>

              {selectedFiles.map((file, index) => (
                <Animated.View
                  key={file.id || index}
                  entering={FadeIn.duration(300)}
                  exiting={FadeOut.duration(200)}
                  style={styles.fileItem}
                >
                  {file.type?.startsWith("image/") ? (
                    <Image
                      source={{ uri: file.uri }}
                      style={styles.filePreview}
                    />
                  ) : (
                    <Ionicons
                      name="document"
                      size={24}
                      color={THEME.colors.text.secondary}
                    />
                  )}
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <TouchableOpacity onPress={() => removeFile(index)}>
                    <Ionicons
                      name="trash"
                      size={20}
                      color={THEME.colors.error}
                    />
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </ScrollView>

          {/* Botón submit fijo abajo */}
          <View style={styles.fixedBottom}>
            <View style={{ width: "100%" }}>
              <Button
                isLoading={loading}
                onPress={handleSave}
                loadingText="Enviando..."
                loadingTextColor="#fff"
                backgroundColor={getAvisoColor(formData.prioridad)}
                loadingTextBackgroundColor={getAvisoColor(formData.prioridad)}
                height={56}
                borderRadius={12}
                style={{ width: "100%" }}
              >
                <Text style={styles.submitText}>Enviar Comunicado</Text>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  flex: {
    flex: 1,
    backgroundColor: "transparent",
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  buttonContainer: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.lg,
    alignItems: "center",
  },
  saveButtonText: {
    color: THEME.colors.text.inverse,
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 20,
  },
  section: {
    marginBottom: THEME.spacing.lg,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.text.heading,
    marginBottom: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.text.heading,
    marginBottom: 8,
  },
  input: {
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.heading,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  textArea: {
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.heading,
    backgroundColor: "#FFFFFF",
    minHeight: 100,
    textAlignVertical: "top",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  inputError: {
    borderWidth: 2,
    borderColor: THEME.colors.error,
  },
  errorText: {
    color: THEME.colors.error,
    fontSize: 14,
    marginTop: 6,
  },
  helpText: {
    color: THEME.colors.text.secondary,
    fontSize: THEME.fontSize.xs,
    marginTop: THEME.spacing.xs,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    minWidth: "30%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  selectedOption: {
    borderWidth: 2,
    shadowOpacity: 0.15,
    elevation: 5,
  },
  optionText: {
    fontSize: 13,
    fontWeight: "500",
    color: THEME.colors.text.secondary,
  },
  priorityOptions: {
    flexDirection: "row",
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  priorityText: {
    fontSize: THEME.fontSize.sm,
    fontWeight: "500",
    color: THEME.colors.text.secondary,
  },
  priorityTextSelected: {
    color: THEME.colors.text.inverse,
    fontWeight: "600",
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    gap: THEME.spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  datePickerText: {
    flex: 1,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.primary,
    textTransform: "capitalize",
  },
  datePickerPlaceholder: {
    color: THEME.colors.text.muted,
  },
  clearDateButton: {
    padding: 2,
  },
  fileButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },
  fileButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 0,
    backgroundColor: "#FFFFFF",
    gap: THEME.spacing.xs,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  fileButtonText: {
    color: THEME.colors.primary,
    fontSize: THEME.fontSize.md,
    fontWeight: "500",
  },
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: THEME.spacing.sm,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    marginBottom: THEME.spacing.xs,
    gap: THEME.spacing.xs,
    borderWidth: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  filePreview: {
    width: 32,
    height: 32,
    borderRadius: 4,
  },
  fileName: {
    flex: 1,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.primary,
  },
  fixedBottom: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: THEME.spacing.sm,
    paddingBottom: THEME.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    alignItems: "center",
  },
  submitText: {
    color: "white",
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },
});
