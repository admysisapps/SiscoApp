import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { THEME, COLORS } from "@/constants/theme";
import { useRouter, useLocalSearchParams } from "expo-router";
import { propietarioService } from "@/services/propietarioService";
import { useLoading } from "@/contexts/LoadingContext";
import Toast from "@/components/Toast";

export default function CrearUsuarioScreen() {
  const router = useRouter();
  const { cedula } = useLocalSearchParams<{ cedula: string }>();
  const { showLoading, hideLoading, isLoading } = useLoading();

  const [formData, setFormData] = useState({
    documento: cedula || "",
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
  });
  const [fieldErrors, setFieldErrors] = useState<{
    documento?: string;
    nombre?: string;
    apellido?: string;
    email?: string;
    telefono?: string;
  }>({});
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (fieldErrors[field as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof typeof newErrors];
        return newErrors;
      });
    }
  };

  const setFieldError = (field: string, message: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: message }));
  };

  const crearUsuario = async () => {
    // Limpiar errores previos
    setFieldErrors({});
    let hasErrors = false;

    // Validar campos con errores en línea
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
      setFieldError("nombre", "El nombre debe tener al menos 2 caracteres");
      hasErrors = true;
    }

    if (!formData.apellido) {
      setFieldError("apellido", "El apellido es obligatorio");
      hasErrors = true;
    } else if (formData.apellido.length < 2) {
      setFieldError("apellido", "El apellido debe tener al menos 2 caracteres");
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
      const cleanTelefono = formData.telefono.trim();
      if (!/^3[0-9]{9}$/.test(cleanTelefono)) {
        setFieldError(
          "telefono",
          "El teléfono debe empezar con 3 y tener 10 dígitos"
        );
        hasErrors = true;
      }
    }

    if (hasErrors) {
      return;
    }

    showLoading("Creando usuario...");
    try {
      const resultado = await propietarioService.crearUsuario(formData);

      if (resultado.success) {
        // Navegar automáticamente a seleccionar apartamento
        router.push({
          pathname: "/(screens)/propietarios/seleccionar-apartamento",
          params: {
            usuario: JSON.stringify({
              documento: formData.documento,
              nombre: formData.nombre,
              apellido: formData.apellido,
              email: formData.email,
              telefono: formData.telefono,
            }),
            esUsuarioNuevo: "true",
          },
        });
      } else {
        setToast({
          visible: true,
          message: resultado.error || "No se pudo crear el usuario",
          type: "error",
        });
      }
    } catch {
      setToast({
        visible: true,
        message: "Error al crear usuario",
        type: "error",
      });
    } finally {
      hideLoading();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Background decorativo */}
      <View style={styles.backgroundDecoration}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={COLORS.text.primary}
              />
            </TouchableOpacity>
            <View style={styles.headerContent}>
              <Text style={styles.title}>Crear Usuario</Text>
              <Text style={styles.subtitle}>
                Complete los datos del nuevo propietario
              </Text>
            </View>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
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
                  onChangeText={(value) =>
                    handleInputChange("documento", value)
                  }
                  keyboardType="numeric"
                  maxLength={11}
                  editable={!cedula}
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
                  onChangeText={(value) => handleInputChange("nombre", value)}
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
                  onChangeText={(value) => handleInputChange("apellido", value)}
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
                  color={
                    fieldErrors.email ? COLORS.error : COLORS.text.secondary
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor={COLORS.text.muted}
                  value={formData.email}
                  onChangeText={(value) => handleInputChange("email", value)}
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
                  placeholder="Teléfono"
                  placeholderTextColor={COLORS.text.muted}
                  value={formData.telefono}
                  onChangeText={(value) => handleInputChange("telefono", value)}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              </View>
              {fieldErrors.telefono && (
                <Text style={styles.errorText}>{fieldErrors.telefono}</Text>
              )}
            </View>

            {/* Botón crear */}
            <TouchableOpacity
              style={styles.createButton}
              onPress={crearUsuario}
              disabled={isLoading}
            >
              <Text style={styles.createButtonText}>
                {isLoading ? "Creando Usuario..." : "Crear Usuario"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    backgroundColor: "#f8fafc",
  },
  backgroundDecoration: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: "absolute",
    borderRadius: 1000,
    opacity: 0.08,
  },
  circle1: {
    width: 250,
    height: 250,
    backgroundColor: COLORS.primary,
    top: -125,
    right: -125,
  },
  circle2: {
    width: 180,
    height: 180,
    backgroundColor: COLORS.primaryLight,
    bottom: -90,
    left: -90,
  },
  circle3: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.primary,
    top: 200,
    right: -60,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.xl * 2,
    paddingBottom: THEME.spacing.xl,
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: THEME.spacing.xl,
    paddingHorizontal: THEME.spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: THEME.spacing.xs,
  },
  subtitle: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.text.secondary,
    textAlign: "left",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputIcon: {
    marginRight: THEME.spacing.sm,
  },
  input: {
    flex: 1,
    height: 50,
    color: COLORS.text.primary,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 1,
  },
  errorText: {
    color: COLORS.error,
    fontSize: THEME.fontSize.xs,
    marginTop: -THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
    marginLeft: THEME.spacing.sm,
  },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.md,
    alignItems: "center",
    marginTop: THEME.spacing.lg,
  },
  createButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: THEME.fontSize.md,
  },
});
