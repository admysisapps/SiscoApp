import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";
import { CuentaPago } from "@/types/CuentaPago";
import { TIPOS_CUENTA, TIPOS_CON_NUMERO } from "@/constants/pagos";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (cuenta: Omit<CuentaPago, "id">) => void;
  loading?: boolean;
  isEditMode?: boolean;
  initialData?: CuentaPago;
}

export default function CreateAccountModal({
  visible,
  onClose,
  onSave,
  loading = false,
  isEditMode = false,
  initialData,
}: Props) {
  const [formData, setFormData] = useState({
    nombre_banco: initialData?.nombre_banco || "",
    tipo_cuenta: (initialData?.tipo_cuenta ||
      "ahorros") as CuentaPago["tipo_cuenta"],
    titular: initialData?.titular || "",
    numero_cuenta: initialData?.numero_cuenta || "",
    descripcion: initialData?.descripcion || "",
    enlace_pago: initialData?.enlace_pago || "",
    informacion_adicional: initialData?.informacion_adicional || "",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [initialFormData, setInitialFormData] = useState(formData);

  const handleFieldChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    const cleanNombreBanco = formData.nombre_banco.trim();
    const cleanTitular = formData.titular.trim();
    const cleanDescripcion = formData.descripcion.trim();
    const cleanNumeroCuenta = formData.numero_cuenta.trim();

    if (!cleanNombreBanco) {
      newErrors.nombre_banco = "El nombre del banco es obligatorio";
    } else if (cleanNombreBanco.length < 2) {
      newErrors.nombre_banco = "El nombre debe tener al menos 2 caracteres";
    }

    if (!cleanTitular) {
      newErrors.titular = "El titular es obligatorio";
    } else if (cleanTitular.length < 3) {
      newErrors.titular = "El titular debe tener al menos 3 caracteres";
    }

    if (!cleanDescripcion) {
      newErrors.descripcion = "La descripción es obligatoria";
    } else if (cleanDescripcion.length < 10) {
      newErrors.descripcion =
        "La descripción debe tener al menos 10 caracteres";
    }

    if (
      TIPOS_CON_NUMERO.includes(formData.tipo_cuenta as any) &&
      !cleanNumeroCuenta
    ) {
      newErrors.numero_cuenta =
        "El número de cuenta es obligatorio para este tipo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (loading) return;

    if (!validateForm()) {
      return;
    }

    const newAccount: Omit<CuentaPago, "id"> = {
      nombre_banco: formData.nombre_banco.trim(),
      tipo_cuenta: formData.tipo_cuenta,
      titular: formData.titular.trim(),
      numero_cuenta: formData.numero_cuenta.trim() || (null as any),
      descripcion: formData.descripcion.trim(),
      enlace_pago: formData.enlace_pago.trim() || (null as any),
      informacion_adicional:
        formData.informacion_adicional.trim() || (null as any),
    };

    onSave(newAccount);
    onClose();
  };

  const handleClose = () => {
    if (loading) return;

    if (hasChanges) {
      Alert.alert(
        "Cambios sin guardar",
        "¿Deseas salir sin guardar los cambios?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Salir", style: "destructive", onPress: onClose },
        ]
      );
    } else {
      onClose();
    }
  };

  // Actualizar formulario cuando cambie initialData o visible
  useEffect(() => {
    if (visible) {
      if (initialData && isEditMode) {
        const newFormData = {
          nombre_banco: initialData.nombre_banco || "",
          tipo_cuenta: initialData.tipo_cuenta || "ahorros",
          titular: initialData.titular || "",
          numero_cuenta: initialData.numero_cuenta || "",
          descripcion: initialData.descripcion || "",
          enlace_pago: initialData.enlace_pago || "",
          informacion_adicional: initialData.informacion_adicional || "",
        };
        setFormData(newFormData);
        setInitialFormData(newFormData);
      } else {
        const emptyForm = {
          nombre_banco: "",
          tipo_cuenta: "ahorros" as CuentaPago["tipo_cuenta"],
          titular: "",
          numero_cuenta: "",
          descripcion: "",
          enlace_pago: "",
          informacion_adicional: "",
        };
        setFormData(emptyForm);
        setInitialFormData(emptyForm);
      }
      setErrors({});
      setHasChanges(false);
    }
  }, [visible, initialData, isEditMode]);

  // Detectar cambios en el formulario
  useEffect(() => {
    // Normalizar valores vacíos para comparación
    const normalize = (val: string | undefined) => (val || "").trim();

    const changed =
      normalize(formData.nombre_banco) !==
        normalize(initialFormData.nombre_banco) ||
      formData.tipo_cuenta !== initialFormData.tipo_cuenta ||
      normalize(formData.titular) !== normalize(initialFormData.titular) ||
      normalize(formData.numero_cuenta) !==
        normalize(initialFormData.numero_cuenta) ||
      normalize(formData.descripcion) !==
        normalize(initialFormData.descripcion) ||
      normalize(formData.enlace_pago) !==
        normalize(initialFormData.enlace_pago) ||
      normalize(formData.informacion_adicional) !==
        normalize(initialFormData.informacion_adicional);
    setHasChanges(changed);
  }, [formData, initialFormData]);

  const showNumberField = useMemo(() => {
    return TIPOS_CON_NUMERO.includes(formData.tipo_cuenta as any);
  }, [formData.tipo_cuenta]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <Ionicons
                name="close"
                size={24}
                color={THEME.colors.text.primary}
              />
            </TouchableOpacity>
            <Text style={styles.title}>
              {isEditMode ? "Editar Método de Pago" : "Nuevo Método de Pago"}
            </Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Nombre del Banco */}
            <View style={styles.field}>
              <Text style={styles.label}>Nombre del Banco/Proveedor *</Text>
              <TextInput
                style={[styles.input, errors.nombre_banco && styles.inputError]}
                value={formData.nombre_banco}
                onChangeText={(text) => handleFieldChange("nombre_banco", text)}
                placeholder="Bancolombia, Nequi, Wompi"
                placeholderTextColor={THEME.colors.text.muted}
              />
              {errors.nombre_banco && (
                <Text style={styles.errorText}>{errors.nombre_banco}</Text>
              )}
            </View>

            {/* Tipo de Cuenta */}
            <View style={styles.field}>
              <Text style={styles.label}>Tipo de Cuenta *</Text>
              <View style={styles.typeGrid}>
                {TIPOS_CUENTA.map((tipo) => (
                  <TouchableOpacity
                    key={tipo.value}
                    style={[
                      styles.typeButton,
                      formData.tipo_cuenta === tipo.value &&
                        styles.typeButtonActive,
                    ]}
                    onPress={() =>
                      setFormData((prev) => ({
                        ...prev,
                        tipo_cuenta: tipo.value,
                      }))
                    }
                  >
                    <Ionicons
                      name={tipo.icon}
                      size={20}
                      color={
                        formData.tipo_cuenta === tipo.value
                          ? "white"
                          : THEME.colors.text.secondary
                      }
                    />
                    <Text
                      style={[
                        styles.typeText,
                        formData.tipo_cuenta === tipo.value &&
                          styles.typeTextActive,
                      ]}
                    >
                      {tipo.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Titular */}
            <View style={styles.field}>
              <Text style={styles.label}>Titular de la Cuenta *</Text>
              <TextInput
                style={[styles.input, errors.titular && styles.inputError]}
                value={formData.titular}
                onChangeText={(text) => handleFieldChange("titular", text)}
                placeholder="Nombre del titular"
                placeholderTextColor={THEME.colors.text.muted}
              />
              {errors.titular && (
                <Text style={styles.errorText}>{errors.titular}</Text>
              )}
            </View>

            {/* Número de Cuenta (condicional) */}
            {showNumberField && (
              <View style={styles.field}>
                <Text style={styles.label}>
                  {formData.tipo_cuenta === "billeteras_digitales"
                    ? "Número de Teléfono *"
                    : "Número de Cuenta *"}
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.numero_cuenta && styles.inputError,
                  ]}
                  value={formData.numero_cuenta}
                  onChangeText={(text) =>
                    handleFieldChange("numero_cuenta", text)
                  }
                  placeholderTextColor={THEME.colors.text.muted}
                  keyboardType="numeric"
                />
                {errors.numero_cuenta && (
                  <Text style={styles.errorText}>{errors.numero_cuenta}</Text>
                )}
              </View>
            )}

            {/* Enlace de Pago (siempre visible) */}
            <View style={styles.field}>
              <Text style={styles.label}>Enlace de Pago</Text>
              <TextInput
                style={[styles.input, errors.enlace_pago && styles.inputError]}
                value={formData.enlace_pago}
                onChangeText={(text) => handleFieldChange("enlace_pago", text)}
                placeholderTextColor={THEME.colors.text.muted}
                keyboardType="url"
              />
              {errors.enlace_pago && (
                <Text style={styles.errorText}>{errors.enlace_pago}</Text>
              )}
            </View>

            {/* Descripción */}
            <View style={styles.field}>
              <Text style={styles.label}>Instrucciones de Pago *</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  errors.descripcion && styles.inputError,
                ]}
                value={formData.descripcion}
                onChangeText={(text) => handleFieldChange("descripcion", text)}
                placeholder="Instrucciones claras para realizar el pago"
                placeholderTextColor={THEME.colors.text.muted}
                multiline
                numberOfLines={3}
              />
              {errors.descripcion && (
                <Text style={styles.errorText}>{errors.descripcion}</Text>
              )}
            </View>

            {/* Información Adicional */}
            <View style={styles.field}>
              <Text style={styles.label}>Información Adicional</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={formData.informacion_adicional}
                onChangeText={(text) =>
                  handleFieldChange("informacion_adicional", text)
                }
                placeholder="Restricciones, horarios, notas especiales..."
                placeholderTextColor={THEME.colors.text.muted}
                multiline
                numberOfLines={2}
              />
            </View>
          </ScrollView>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.saveText}>
                  {isEditMode ? "Actualizar" : "Guardar"}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.colors.text.primary,
    flex: 1,
    textAlign: "center",
  },
  closeButton: {
    padding: 4,
  },
  placeholder: {
    width: 32,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: THEME.colors.text.primary,
    backgroundColor: THEME.colors.surface,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  typeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  typeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
    gap: 6,
  },
  typeButtonActive: {
    backgroundColor: THEME.colors.success,
    borderColor: THEME.colors.success,
  },
  typeText: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
  },
  typeTextActive: {
    color: "white",
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: THEME.colors.surfaceLight,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.text.secondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: THEME.colors.success,
    alignItems: "center",
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  inputError: {
    borderColor: THEME.colors.error,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 12,
    color: THEME.colors.error,
    marginTop: 4,
  },
});
