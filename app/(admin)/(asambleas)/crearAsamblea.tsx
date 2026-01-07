import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { THEME } from "@/constants/theme";
import { asambleaService } from "@/services/asambleaService";
import LoadingOverlay from "@/components/LoadingOverlay";
import Toast from "@/components/Toast";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

// CONFIGURACIÓN: Días mínimos de antelación para crear asamblea
// Cambiar este valor para modificar la antelación requerida
const DIAS_MINIMOS_ANTELACION = 15;

interface AsambleaData {
  titulo: string;
  descripcion: string;
  fecha: Date;
  hora: Date;
  lugar: string;
  modalidad: "presencial" | "virtual" | "mixta";
  enlace_virtual: string;
  tipo_asamblea: "ordinaria" | "extraordinaria";
  quorum_requerido: string;
  tiempo_pregunta: string;
}

interface FormErrors {
  [key: string]: string;
}

export default function CrearAsambleaScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<AsambleaData>({
    titulo: "",
    descripcion: "",
    fecha: new Date(Date.now() + DIAS_MINIMOS_ANTELACION * 24 * 60 * 60 * 1000),
    hora: new Date(new Date().setHours(18, 0, 0, 0)),
    lugar: "",
    modalidad: "presencial",
    enlace_virtual: "",
    tipo_asamblea: "ordinaria",
    quorum_requerido: "50",
    tiempo_pregunta: "3",
  });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" = "success"
  ) => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ visible: false, message: "", type: "success" });
  };

  // Validar fecha y hora mínima
  const validateFechaHora = (): { fecha?: string; hora?: string } => {
    const errors: { fecha?: string; hora?: string } = {};
    const ahora = new Date();
    const fechaHoraSeleccionada = new Date(formData.fecha);
    fechaHoraSeleccionada.setHours(
      formData.hora.getHours(),
      formData.hora.getMinutes(),
      0,
      0
    );

    // Si es extraordinaria, validar mínimo 1 hora de anticipación
    if (formData.tipo_asamblea === "extraordinaria") {
      const unaHoraDespues = new Date(ahora.getTime() + 60 * 60 * 1000);
      if (fechaHoraSeleccionada < unaHoraDespues) {
        errors.hora = "Debe ser con mínimo 1 hora de anticipación";
      }
      return errors;
    }

    // Si es ordinaria, aplicar restricción de días mínimos
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaMinima = new Date();
    fechaMinima.setDate(hoy.getDate() + DIAS_MINIMOS_ANTELACION - 1);

    if (formData.fecha < fechaMinima) {
      errors.fecha = `Debe ser con mínimo ${DIAS_MINIMOS_ANTELACION} días de anticipación`;
    }

    return errors;
  };

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.titulo.trim()) {
      newErrors.titulo = "Título es requerido";
    }

    const fechaHoraErrors = validateFechaHora();
    if (fechaHoraErrors.fecha) {
      newErrors.fecha = fechaHoraErrors.fecha;
    }
    if (fechaHoraErrors.hora) {
      newErrors.hora = fechaHoraErrors.hora;
    }

    if (!formData.lugar.trim()) {
      newErrors.lugar = "Lugar es requerido";
    }

    if (
      (formData.modalidad === "virtual" || formData.modalidad === "mixta") &&
      !formData.enlace_virtual.trim()
    ) {
      newErrors.enlace_virtual = "Enlace virtual es requerido";
    }

    const quorum = parseFloat(formData.quorum_requerido);
    if (isNaN(quorum) || quorum <= 0 || quorum > 100) {
      newErrors.quorum_requerido = "Quórum debe estar entre 1 y 100";
    }

    const tiempo = parseInt(formData.tiempo_pregunta);
    if (isNaN(tiempo) || tiempo < 1 || tiempo > 15) {
      newErrors.tiempo_pregunta = "Tiempo debe estar entre 1 y 15 minutos";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      showToast("Corrige los errores en el formulario", "error");
      return;
    }

    setLoading(true);
    try {
      const asambleaData = {
        ...formData,
        fecha: dayjs(formData.fecha).format("YYYY-MM-DD"),
        hora: dayjs(formData.hora).format("HH:mm"),
      };
      const response = await asambleaService.crearAsamblea(asambleaData);

      if (response.success) {
        showToast("Asamblea creada exitosamente", "success");
        setTimeout(() => {
          router.push("/(admin)/(asambleas)");
        }, 2000);
      } else {
        showToast(response.error || "Error al crear asamblea", "error");
      }
    } catch {
      showToast("Error al crear asamblea", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    field: keyof AsambleaData,
    value: string | Date
  ) => {
    const newFormData = { ...formData, [field]: value };

    // Si cambia el tipo de asamblea, ajustar la fecha
    if (field === "tipo_asamblea") {
      if (value === "extraordinaria") {
        newFormData.fecha = new Date(); // Fecha actual
      } else {
        newFormData.fecha = new Date(
          Date.now() + DIAS_MINIMOS_ANTELACION * 24 * 60 * 60 * 1000
        ); // 15 días
      }
    }

    setFormData(newFormData);
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      handleInputChange("fecha", selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      handleInputChange("hora", selectedTime);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <LoadingOverlay visible={loading} message="Creando asamblea..." />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={THEME.colors.header.title}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Crear Asamblea</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Título */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={[styles.input, errors.titulo && styles.inputError]}
            value={formData.titulo}
            onChangeText={(text) => handleInputChange("titulo", text)}
            placeholder="Ej: Asamblea Ordinaria 2025"
            placeholderTextColor={THEME.colors.text.muted}
            maxLength={100}
          />
          {errors.titulo && (
            <Text style={styles.errorText}>{errors.titulo}</Text>
          )}
        </View>

        {/* Descripción */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.textArea, errors.descripcion && styles.inputError]}
            value={formData.descripcion}
            onChangeText={(text) => handleInputChange("descripcion", text)}
            placeholder="Descripción de la asamblea..."
            placeholderTextColor={THEME.colors.text.muted}
            multiline
            numberOfLines={3}
            maxLength={250}
          />
        </View>

        {/* Tipo */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Tipo de Asamblea </Text>
          <View style={styles.segmentedControl}>
            {[
              { value: "ordinaria", label: "Ordinaria", icon: "calendar" },
              {
                value: "extraordinaria",
                label: "Extraordinaria",
                icon: "flash",
              },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.segmentButton,
                  formData.tipo_asamblea === option.value &&
                    styles.segmentButtonActive,
                ]}
                onPress={() =>
                  handleInputChange("tipo_asamblea", option.value as any)
                }
              >
                <Ionicons
                  name={option.icon as any}
                  size={18}
                  color={
                    formData.tipo_asamblea === option.value
                      ? THEME.colors.text.inverse
                      : THEME.colors.text.secondary
                  }
                />
                <Text
                  style={[
                    styles.segmentButtonText,
                    formData.tipo_asamblea === option.value &&
                      styles.segmentButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Fecha y Hora */}
        <View style={styles.rowContainer}>
          <View style={[styles.fieldContainer, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Fecha *</Text>
            <TouchableOpacity
              style={[styles.pickerButton, errors.fecha && styles.inputError]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.pickerText}>
                {dayjs(formData.fecha).format("DD/MM/YYYY")}
              </Text>
            </TouchableOpacity>
            {errors.fecha && (
              <Text style={styles.errorText}>{errors.fecha}</Text>
            )}
            <View style={styles.helperContainer}>
              <Ionicons
                name="information-circle"
                size={16}
                color={THEME.colors.primary}
              />
              <Text style={styles.helperText}>
                {formData.tipo_asamblea === "ordinaria"
                  ? `Mínimo ${DIAS_MINIMOS_ANTELACION} días de anticipación`
                  : "Sin restricción de días"}
              </Text>
            </View>
          </View>

          <View style={[styles.fieldContainer, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Hora *</Text>
            <TouchableOpacity
              style={[styles.pickerButton, errors.hora && styles.inputError]}
              onPress={() => setShowTimePicker(true)}
            >
              <Ionicons name="time" size={20} color={THEME.colors.primary} />
              <Text style={styles.pickerText}>
                {dayjs(formData.hora).format("HH:mm")}
              </Text>
            </TouchableOpacity>
            {errors.hora && <Text style={styles.errorText}>{errors.hora}</Text>}
            {formData.tipo_asamblea === "extraordinaria" && (
              <View style={styles.helperContainer}>
                <Ionicons
                  name="information-circle"
                  size={16}
                  color={THEME.colors.primary}
                />
                <Text style={styles.helperText}>
                  Mínimo 1 hora de anticipación
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Lugar */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Lugar *</Text>
          <TextInput
            style={[styles.input, errors.lugar && styles.inputError]}
            value={formData.lugar}
            onChangeText={(text) => handleInputChange("lugar", text)}
            placeholder="Ej: Salón Comunal"
            placeholderTextColor={THEME.colors.text.muted}
            maxLength={100}
          />
          {errors.lugar && <Text style={styles.errorText}>{errors.lugar}</Text>}
        </View>

        {/* Modalidad */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Modalidad *</Text>
          <View style={styles.segmentedControl}>
            {[
              { value: "presencial", label: "Presencial" },
              { value: "virtual", label: "Virtual", icon: "videocam" },
              { value: "mixta", label: "Mixta", icon: "layers" },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.segmentButton,
                  formData.modalidad === option.value &&
                    styles.segmentButtonActive,
                ]}
                onPress={() =>
                  handleInputChange("modalidad", option.value as any)
                }
              >
                {option.icon && (
                  <Ionicons
                    name={option.icon as any}
                    size={18}
                    color={
                      formData.modalidad === option.value
                        ? THEME.colors.text.inverse
                        : THEME.colors.text.secondary
                    }
                  />
                )}
                <Text
                  style={[
                    styles.segmentButtonText,
                    formData.modalidad === option.value &&
                      styles.segmentButtonTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Enlace Virtual */}
        {(formData.modalidad === "virtual" ||
          formData.modalidad === "mixta") && (
          <View style={styles.fieldContainer}>
            <Text style={styles.label}>Enlace Virtual *</Text>
            <TextInput
              style={[styles.input, errors.enlace_virtual && styles.inputError]}
              value={formData.enlace_virtual}
              onChangeText={(text) => handleInputChange("enlace_virtual", text)}
              placeholder="https://meet.google.com/..."
              placeholderTextColor={THEME.colors.text.muted}
              maxLength={255}
              keyboardType="url"
            />
            {errors.enlace_virtual && (
              <Text style={styles.errorText}>{errors.enlace_virtual}</Text>
            )}
          </View>
        )}

        {/* Quórum y Tiempo por pregunta */}
        <View style={styles.rowContainer}>
          <View style={[styles.fieldContainer, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Quórum Requerido </Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={[
                  styles.inputIcon,
                  errors.quorum_requerido && styles.inputError,
                ]}
                value={formData.quorum_requerido}
                onChangeText={(text) =>
                  handleInputChange("quorum_requerido", text)
                }
                placeholder="50"
                placeholderTextColor={THEME.colors.text.muted}
                keyboardType="numeric"
                maxLength={3}
              />
              <Text style={styles.inputSuffix}>%</Text>
            </View>
            {errors.quorum_requerido && (
              <Text style={styles.errorText}>{errors.quorum_requerido}</Text>
            )}
            <View style={styles.helperContainer}>
              <Ionicons
                name="information-circle"
                size={14}
                color={THEME.colors.primary}
              />
              <Text style={styles.helperText}>Porcentaje de coeficientes</Text>
            </View>
          </View>

          <View style={[styles.fieldContainer, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Tiempo por pregunta </Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={[
                  styles.inputIcon,
                  errors.tiempo_pregunta && styles.inputError,
                ]}
                value={formData.tiempo_pregunta}
                onChangeText={(text) =>
                  handleInputChange("tiempo_pregunta", text)
                }
                placeholder="3"
                placeholderTextColor={THEME.colors.text.muted}
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={styles.inputSuffix}>min</Text>
            </View>
            {errors.tiempo_pregunta && (
              <Text style={styles.errorText}>{errors.tiempo_pregunta}</Text>
            )}
            <View style={styles.helperContainer}>
              <Ionicons
                name="information-circle"
                size={14}
                color={THEME.colors.primary}
              />
              <Text style={styles.helperText}>Entre 1 y 15 minutos</Text>
            </View>
          </View>
        </View>

        {/* Botón */}
        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.createButtonText}>Creando...</Text>
            </View>
          ) : (
            <>
              <Ionicons
                name="checkmark-circle"
                size={22}
                color={THEME.colors.text.inverse}
              />
              <Text style={styles.createButtonText}>Crear Asamblea</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 80 }} />
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />

      {showDatePicker && (
        <DateTimePicker
          value={formData.fecha}
          mode="date"
          display="default"
          minimumDate={
            formData.tipo_asamblea === "extraordinaria"
              ? new Date() // Solo fecha actual para extraordinarias
              : new Date(
                  Date.now() + DIAS_MINIMOS_ANTELACION * 24 * 60 * 60 * 1000
                ) // 15 días para ordinarias
          }
          onChange={handleDateChange}
        />
      )}

      {showTimePicker && (
        <DateTimePicker
          value={formData.hora}
          mode="time"
          is24Hour={true}
          display="spinner"
          onChange={handleTimeChange}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerSpacer: {
    width: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.text.heading,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.text.heading,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: THEME.colors.text.heading,
    backgroundColor: THEME.colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: THEME.colors.text.heading,
    backgroundColor: THEME.colors.surface,
    minHeight: 120,
    textAlignVertical: "top",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: THEME.colors.error,
  },
  errorText: {
    fontSize: 14,
    color: THEME.colors.error,
    marginTop: 6,
  },
  helperContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 6,
  },
  helperText: {
    fontSize: 13,
    color: THEME.colors.text.secondary,
    flex: 1,
  },
  rowContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: THEME.colors.surfaceLight,
    borderRadius: 12,
    padding: 4,
  },
  segmentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    gap: 6,
  },
  segmentButtonActive: {
    backgroundColor: THEME.colors.primary,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: THEME.colors.text.secondary,
  },
  segmentButtonTextActive: {
    color: THEME.colors.text.inverse,
    fontWeight: "600",
  },
  createButton: {
    backgroundColor: THEME.colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 32,
    shadowColor: THEME.colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  createButtonDisabled: {
    opacity: 0.7,
  },
  createButtonText: {
    color: THEME.colors.text.inverse,
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 8,
    letterSpacing: 0.2,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: THEME.colors.surface,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  pickerText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.primary,
    fontWeight: "600",
  },
  inputWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    backgroundColor: THEME.colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputIcon: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.primary,
    borderWidth: 0,
  },
  inputSuffix: {
    paddingRight: 16,
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.text.secondary,
  },
});
