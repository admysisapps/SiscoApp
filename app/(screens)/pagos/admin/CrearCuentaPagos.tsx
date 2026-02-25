import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { THEME } from "@/constants/theme";
import Toast from "@/components/Toast";
import { CuentaPago } from "@/types/CuentaPago";
import { TIPOS_CUENTA, requiereNumeroCuenta } from "@/constants/pagos";
import { cuentasPagoService } from "@/services/cuentasPagoService";
import ScreenHeader from "@/components/shared/ScreenHeader";

export default function CrearCuentaPagosScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isEditMode = params.mode === "edit";
  const initialDataString = params.data as string | undefined;
  const initialData = useMemo(
    () => (initialDataString ? JSON.parse(initialDataString) : null),
    [initialDataString]
  );
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(() => ({
    nombre_banco: initialData?.nombre_banco || "",
    tipo_cuenta: (initialData?.tipo_cuenta ||
      "ahorros") as CuentaPago["tipo_cuenta"],
    titular: initialData?.titular || "",
    numero_cuenta: initialData?.numero_cuenta || "",
    descripcion: initialData?.descripcion || "",
    enlace_pago: initialData?.enlace_pago || "",
    informacion_adicional: initialData?.informacion_adicional || "",
  }));

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });
  const [behavior, setBehavior] = useState<"padding" | "height" | undefined>(
    Platform.OS === "ios" ? "padding" : "height"
  );

  const hasChanges = useMemo(() => {
    if (!initialData) return true;
    const normalize = (val: string | undefined) => (val || "").trim();
    return (
      normalize(formData.nombre_banco) !==
        normalize(initialData.nombre_banco) ||
      formData.tipo_cuenta !== initialData.tipo_cuenta ||
      normalize(formData.titular) !== normalize(initialData.titular) ||
      normalize(formData.numero_cuenta) !==
        normalize(initialData.numero_cuenta) ||
      normalize(formData.descripcion) !== normalize(initialData.descripcion) ||
      normalize(formData.enlace_pago) !== normalize(initialData.enlace_pago) ||
      normalize(formData.informacion_adicional) !==
        normalize(initialData.informacion_adicional)
    );
  }, [formData, initialData]);

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

    if (requiereNumeroCuenta(formData.tipo_cuenta) && !cleanNumeroCuenta) {
      newErrors.numero_cuenta =
        "El número de cuenta es obligatorio para este tipo";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (loading) return;

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const cuentaData: Omit<CuentaPago, "id"> = {
        nombre_banco: formData.nombre_banco.trim(),
        tipo_cuenta: formData.tipo_cuenta,
        titular: formData.titular.trim(),
        numero_cuenta: formData.numero_cuenta.trim() || undefined,
        descripcion: formData.descripcion.trim(),
        enlace_pago: formData.enlace_pago.trim() || undefined,
        informacion_adicional:
          formData.informacion_adicional.trim() || undefined,
      };

      const response =
        isEditMode && initialData
          ? await cuentasPagoService.editarCuentaPago(
              initialData.id,
              cuentaData
            )
          : await cuentasPagoService.crearCuentaPago(cuentaData);

      if (response.success) {
        router.back();
      } else {
        setToast({
          visible: true,
          message:
            response.error ||
            `Error al ${isEditMode ? "actualizar" : "crear"} el método de pago`,
          type: "error",
        });
      }
    } catch {
      setToast({
        visible: true,
        message: "Ocurrió un error inesperado",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;

    if (hasChanges) {
      setToast({
        visible: true,
        message: "Tienes cambios sin guardar",
        type: "warning",
      });
    } else {
      router.back();
    }
  };

  const showNumberField = requiereNumeroCuenta(formData.tipo_cuenta);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title={isEditMode ? "Editar Método de Pago" : "Nuevo Método de Pago"}
        onBackPress={handleClose}
      />
      <KeyboardAvoidingView behavior={behavior} style={styles.flex}>
        <LinearGradient colors={["#FAFAFA", "#F5F5F5"]} style={styles.flex}>
          <ScrollView
            style={styles.flex}
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
                          ? THEME.colors.text.inverse
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

            {/* Botones dentro del scroll */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.saveButton,
                  loading && styles.saveButtonDisabled,
                ]}
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color={THEME.colors.text.inverse}
                  />
                ) : (
                  <Text style={styles.saveText}>
                    {isEditMode ? "Actualizar" : "Guardar"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 40,
  },
  field: {
    marginBottom: 20,
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
    backgroundColor: THEME.colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    margin: 2,
  },
  textArea: {
    minHeight: 100,
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
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 0,
    backgroundColor: THEME.colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    gap: 6,
  },
  typeButtonActive: {
    backgroundColor: THEME.colors.success,
    shadowOpacity: 0.2,
    elevation: 4,
  },
  typeText: {
    fontSize: 13,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
  },
  typeTextActive: {
    color: THEME.colors.text.inverse,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: THEME.colors.surface,
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.text.secondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: THEME.colors.success,
    alignItems: "center",
    shadowColor: THEME.colors.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveText: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.text.inverse,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  inputError: {
    borderColor: THEME.colors.error,
    borderWidth: 2,
  },
  errorText: {
    fontSize: 14,
    color: THEME.colors.error,
    marginTop: 6,
  },
});
