import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { THEME, COLORS } from "@/constants/theme";
import { useRouter } from "expo-router";
import { useLoading } from "@/contexts/LoadingContext";
import ScreenHeader from "@/components/shared/ScreenHeader";
import Toast from "@/components/Toast";

// Mock — reemplazar con llamada real a siscoapp_staff_crear
const ROLES_STAFF = [
  {
    key: "contador",
    label: "Contador",
    descripcion: "Ver indicadores de la copropiedad y responder PQRs.",
    icon: "calculator-outline" as const,
  },
];

interface FormData {
  documento: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: string;
}

interface FieldErrors {
  documento?: string;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  rol?: string;
}

export default function CrearStaffScreen() {
  const router = useRouter();
  const { showLoading, hideLoading } = useLoading();

  const [formData, setFormData] = useState<FormData>({
    documento: "",
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    rol: "",
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const setFieldError = (field: keyof FieldErrors, message: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: message }));
  };

  const crearStaff = async () => {
    setFieldErrors({});
    let hasErrors = false;

    if (!formData.documento) {
      setFieldError("documento", "Ingresa la cédula");
      hasErrors = true;
    } else if (!/^[1-9][0-9]{3,10}$/.test(formData.documento)) {
      setFieldError("documento", "Verifica la cédula");
      hasErrors = true;
    }

    if (!formData.nombre) {
      setFieldError("nombre", "El nombre es obligatorio");
      hasErrors = true;
    } else if (formData.nombre.length < 2) {
      setFieldError("nombre", "Mínimo 2 caracteres");
      hasErrors = true;
    }

    if (!formData.apellido) {
      setFieldError("apellido", "El apellido es obligatorio");
      hasErrors = true;
    } else if (formData.apellido.length < 2) {
      setFieldError("apellido", "Mínimo 2 caracteres");
      hasErrors = true;
    }

    if (!formData.email) {
      setFieldError("email", "Ingresa el correo");
      hasErrors = true;
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.email)
    ) {
      setFieldError("email", "Verifica el correo");
      hasErrors = true;
    }

    if (formData.telefono) {
      if (!/^3[0-9]{9}$/.test(formData.telefono.trim())) {
        setFieldError("telefono", "Debe empezar con 3 y tener 10 dígitos");
        hasErrors = true;
      }
    }

    if (!formData.rol) {
      setFieldError("rol", "Selecciona un rol");
      hasErrors = true;
    }

    if (hasErrors) return;

    showLoading("Creando usuario...");
    try {
      // TODO: reemplazar con staffService.crearStaff(formData)
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setToast({
        visible: true,
        message: "Staff creado exitosamente",
        type: "success",
      });

      setTimeout(() => router.back(), 1500);
    } catch {
      setToast({
        visible: true,
        message: "Error al crear el usuario",
        type: "error",
      });
    } finally {
      hideLoading();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScreenHeader title="Crear Staff" onBackPress={() => router.back()} />

      <KeyboardAwareScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        {/* Selector de rol */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <AntDesign name="usergroup-add" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Tipo de usuario</Text>
          </View>

          {fieldErrors.rol && (
            <Text style={styles.errorText}>{fieldErrors.rol}</Text>
          )}

          {ROLES_STAFF.map((rol) => (
            <TouchableOpacity
              key={rol.key}
              style={[
                styles.rolCard,
                formData.rol === rol.key && styles.rolCardActive,
              ]}
              onPress={() => handleInputChange("rol", rol.key)}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.rolIconContainer,
                  formData.rol === rol.key && styles.rolIconContainerActive,
                ]}
              >
                <Ionicons
                  name={rol.icon}
                  size={22}
                  color={formData.rol === rol.key ? "white" : COLORS.primary}
                />
              </View>
              <View style={styles.rolInfo}>
                <Text
                  style={[
                    styles.rolLabel,
                    formData.rol === rol.key && styles.rolLabelActive,
                  ]}
                >
                  {rol.label}
                </Text>
                <Text style={styles.rolDescripcion}>{rol.descripcion}</Text>
              </View>
              {formData.rol === rol.key && (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={COLORS.primary}
                />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Datos personales */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-outline" size={20} color={COLORS.primary} />
            <Text style={styles.cardTitle}>Datos personales</Text>
          </View>

          {/* Documento */}
          <View>
            <View
              style={[
                styles.inputContainer,
                fieldErrors.documento && styles.inputError,
              ]}
            >
              <Ionicons
                name="card-outline"
                size={20}
                color={
                  fieldErrors.documento ? COLORS.error : COLORS.text.secondary
                }
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Número de cédula"
                placeholderTextColor={COLORS.text.muted}
                value={formData.documento}
                onChangeText={(v) => handleInputChange("documento", v)}
                keyboardType="numeric"
                maxLength={11}
              />
            </View>
            {fieldErrors.documento && (
              <Text style={styles.errorText}>{fieldErrors.documento}</Text>
            )}
          </View>

          {/* Nombre */}
          <View>
            <View
              style={[
                styles.inputContainer,
                fieldErrors.nombre && styles.inputError,
              ]}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={
                  fieldErrors.nombre ? COLORS.error : COLORS.text.secondary
                }
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Nombre"
                placeholderTextColor={COLORS.text.muted}
                value={formData.nombre}
                onChangeText={(v) => handleInputChange("nombre", v)}
                autoCapitalize="words"
              />
            </View>
            {fieldErrors.nombre && (
              <Text style={styles.errorText}>{fieldErrors.nombre}</Text>
            )}
          </View>

          {/* Apellido */}
          <View>
            <View
              style={[
                styles.inputContainer,
                fieldErrors.apellido && styles.inputError,
              ]}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={
                  fieldErrors.apellido ? COLORS.error : COLORS.text.secondary
                }
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Apellido"
                placeholderTextColor={COLORS.text.muted}
                value={formData.apellido}
                onChangeText={(v) => handleInputChange("apellido", v)}
                autoCapitalize="words"
              />
            </View>
            {fieldErrors.apellido && (
              <Text style={styles.errorText}>{fieldErrors.apellido}</Text>
            )}
          </View>

          {/* Email */}
          <View>
            <View
              style={[
                styles.inputContainer,
                fieldErrors.email && styles.inputError,
              ]}
            >
              <Ionicons
                name="mail-outline"
                size={20}
                color={fieldErrors.email ? COLORS.error : COLORS.text.secondary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="correo@ejemplo.com"
                placeholderTextColor={COLORS.text.muted}
                value={formData.email}
                onChangeText={(v) => handleInputChange("email", v)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {fieldErrors.email && (
              <Text style={styles.errorText}>{fieldErrors.email}</Text>
            )}
          </View>

          {/* Teléfono */}
          <View>
            <View
              style={[
                styles.inputContainer,
                fieldErrors.telefono && styles.inputError,
              ]}
            >
              <Ionicons
                name="call-outline"
                size={20}
                color={
                  fieldErrors.telefono ? COLORS.error : COLORS.text.secondary
                }
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Teléfono (opcional)"
                placeholderTextColor={COLORS.text.muted}
                value={formData.telefono}
                onChangeText={(v) => handleInputChange("telefono", v)}
                keyboardType="phone-pad"
                maxLength={10}
              />
            </View>
            {fieldErrors.telefono && (
              <Text style={styles.errorText}>{fieldErrors.telefono}</Text>
            )}
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={COLORS.primary}
          />
          <Text style={styles.infoText}>
            El usuario recibirá sus credenciales de acceso al correo registrado.
          </Text>
        </View>

        {/* Botón */}
        <TouchableOpacity
          style={[
            styles.createButton,
            (!formData.rol || !formData.documento) &&
              styles.createButtonDisabled,
          ]}
          onPress={crearStaff}
          disabled={!formData.rol || !formData.documento}
        >
          <AntDesign name="usergroup-add" size={20} color="white" />
          <Text style={styles.createButtonText}>Crear Usuario</Text>
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast((prev) => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: THEME.spacing.md,
  },
  scrollContent: {
    paddingTop: THEME.spacing.lg,
    paddingBottom: THEME.spacing.xl * 2,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: THEME.spacing.lg,
  },
  cardTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginLeft: THEME.spacing.sm,
  },
  rolCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: THEME.spacing.sm,
    backgroundColor: THEME.colors.background,
  },
  rolCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "08",
  },
  rolIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: THEME.spacing.md,
  },
  rolIconContainerActive: {
    backgroundColor: COLORS.primary,
  },
  rolInfo: {
    flex: 1,
  },
  rolLabel: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: 2,
  },
  rolLabelActive: {
    color: COLORS.primary,
  },
  rolDescripcion: {
    fontSize: THEME.fontSize.xs,
    color: COLORS.text.secondary,
    lineHeight: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 50,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  inputIcon: {
    marginRight: THEME.spacing.sm,
  },
  input: {
    flex: 1,
    color: COLORS.text.primary,
    fontSize: THEME.fontSize.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: THEME.fontSize.xs,
    marginTop: -THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
    marginLeft: THEME.spacing.sm,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.primary + "10",
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + "25",
  },
  infoText: {
    flex: 1,
    fontSize: THEME.fontSize.sm,
    color: COLORS.primary,
    marginLeft: THEME.spacing.sm,
    lineHeight: 18,
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.md,
    gap: 8,
  },
  createButtonDisabled: {
    backgroundColor: COLORS.text.muted,
  },
  createButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: THEME.fontSize.md,
    marginLeft: THEME.spacing.sm,
  },
});
