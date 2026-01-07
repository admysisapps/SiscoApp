import Toast from "@/components/Toast";
import { COLORS, THEME } from "@/constants/theme";
import { useAuth } from "@/contexts/AuthContext";
import { useLoading } from "@/contexts/LoadingContext";
import { validationService } from "@/services/auth/validationService";
import { Ionicons } from "@expo/vector-icons";
import Entypo from "@expo/vector-icons/Entypo";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUp() {
  const [cedula, setCedula] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [codigoInvitacion, setCodigoInvitacion] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });
  const [fieldErrors, setFieldErrors] = useState<{
    cedula?: string;
    email?: string;
    codigoInvitacion?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const { register } = useAuth();
  const { showLoading, hideLoading, isLoading } = useLoading();
  const router = useRouter();

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" = "success"
  ) => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ visible: false, message: "", type: "success" });
  };

  const clearFieldErrors = () => {
    setFieldErrors({});
  };

  const setFieldError = (field: string, message: string) => {
    setFieldErrors((prev) => ({ ...prev, [field]: message }));
  };

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field as keyof typeof newErrors];
      return newErrors;
    });
  };

  // Validar política de contraseña
  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push("Mínimo 8 caracteres");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Falta una letra minúscula");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Falta una letra mayúscula");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Falta un número");
    }
    if (!/[\^$*.\[\]{}()?\-"!@#%&\/\\,><':;|_~`+= ]/.test(password)) {
      errors.push("Falta un carácter especial");
    }

    return errors;
  };

  // Obtener mensaje de error específico de validación
  const getValidationErrorMessage = (error: string): string => {
    switch (error) {
      // Errores de validación de campos
      case "Documento, email y código de invitación son requeridos":
        return "Todos los campos son obligatorios. Verifica la información.";

      // Errores de código de invitación
      case "CODIGO_INVALIDO":
        return "Código de invitación inválido. Verifica que sea correcto.";

      // Errores de usuario
      case "USUARIO_NO_ENCONTRADO":
        return "Los datos ingresados incorrectos.";
      case "USUARIO_INACTIVO_PROYECTO":
        return "Tu cuenta está desactivada en este proyecto. Contacta al administrador.";
      case "USUARIO_SIN_APARTAMENTOS":
        return "No tienes unidades registrados en este proyecto. Verifica con tu administrador.";
      case "USUARIO_DESHABILITADO":
        return "Tu acceso ha sido deshabilitado. Contacta al administrador.";

      // Errores de servidor
      case "Error interno del servidor":
        return "Error del sistema. Inténtalo más tarde o contacta soporte.";

      default:
        // Si el error contiene texto específico
        if (error.includes("Error interno del servidor")) {
          return "Error del sistema. Inténtalo más tarde o contacta soporte.";
        }
        return "No se pudo validar la información. Inténtalo nuevamente.";
    }
  };

  // Obtener mensaje de error específico de Cognito
  const getCognitoErrorMessage = (error: any): string => {
    switch (error.name) {
      case "UsernameExistsException":
        return "Ya existe un usuario con esta cédula";
      case "InvalidParameterException":
        return "Datos inválidos. Verifica la información";
      case "InvalidPasswordException":
        return "La contraseña no cumple con los requisitos";
      case "CodeMismatchException":
        return "Código de verificación incorrecto";
      case "ExpiredCodeException":
        return "El código de verificación ha expirado";
      case "LimitExceededException":
        return "Demasiados intentos. Intenta más tarde";
      case "NotAuthorizedException":
        return "Credenciales incorrectas";
      case "UserNotFoundException":
        return "Usuario no encontrado";
      case "UserNotConfirmedException":
        return "Cuenta no confirmada. Revisa tu correo";
      case "TooManyRequestsException":
        return "Demasiadas solicitudes. Espera un momento";
      case "NetworkError":
        return "Sin conexión a internet. Verifica tu conexión";
      case "TimeoutError":
        return "La conexión está muy lenta. Inténtalo de nuevo";
      default:
        if (error.message?.includes("Network")) {
          return "Sin conexión a internet. Verifica tu conexión";
        }
        if (error.message?.includes("timeout")) {
          return "La conexión está muy lenta. Inténtalo de nuevo";
        }
        return error.message || "Error desconocido";
    }
  };

  const handleSignUp = async () => {
    clearFieldErrors();
    let hasErrors = false;

    // Validar campos obligatorios con errores en línea
    if (!cedula) {
      setFieldError("cedula", "Ingresa tu cédula");
      hasErrors = true;
    } else if (!/^[1-9][0-9]{3,10}$/.test(cedula)) {
      setFieldError("cedula", "Verifica tu cédula");
      hasErrors = true;
    }

    if (!email) {
      setFieldError("email", "Ingresa tu correo");
      hasErrors = true;
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)
    ) {
      setFieldError("email", "Verifica tu correo");
      hasErrors = true;
    }

    if (!codigoInvitacion) {
      setFieldError("codigoInvitacion", "Ingresa el código de tu copropiedad");
      hasErrors = true;
    } else if (!/^[A-Z0-9]{6,8}$/.test(codigoInvitacion)) {
      setFieldError("codigoInvitacion", "Verifica el código");
      hasErrors = true;
    }

    if (!password) {
      setFieldError("password", "La contraseña es obligatoria");
      hasErrors = true;
    } else {
      const passwordErrors = validatePassword(password);
      if (passwordErrors.length > 0) {
        setFieldError("password", passwordErrors.join(", "));
        hasErrors = true;
      }
    }

    if (!confirmPassword) {
      setFieldError("confirmPassword", "Confirma tu contraseña");
      hasErrors = true;
    } else if (password !== confirmPassword) {
      setFieldError("confirmPassword", "Las contraseñas no coinciden");
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    showLoading("Registrando usuario...");
    try {
      // NUEVA VALIDACIÓN PREVIA - Validar con backend antes de Cognito
      const validation = await validationService.validateAndPrepareUser(
        cedula,
        email,
        codigoInvitacion
      );

      if (!validation.success) {
        // Mostrar error específico de la lambda
        const errorMessage = getValidationErrorMessage(
          validation.error || "Error de validación"
        );
        showToast(errorMessage, "error");
        hideLoading();
        return;
      }

      // Si validación OK → Proceder con Cognito

      // Usar el email devuelto por la validación (puede ser diferente al ingresado)
      const validatedEmail = validation.email || email;
      const proyectoNit = validation.proyecto_nit;

      await register(cedula, password, validatedEmail);

      showToast("Registro exitoso. Revisa tu correo para confirmar", "success");

      const confirmUrl = `/(auth)/confirm?username=${encodeURIComponent(cedula)}&email=${encodeURIComponent(validatedEmail)}&proyecto_nit=${encodeURIComponent(proyectoNit || "")}`;
      router.push(confirmUrl as any);
      // No hideLoading() aquí - se mantendrá hasta confirm
    } catch (error: any) {
      console.error("SIGNUP error:", error.message || error);
      const errorMessage = getCognitoErrorMessage(error);
      showToast(errorMessage, "error");
      hideLoading();
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Background decorativo igual al login */}
      <View style={styles.backgroundDecoration}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header animado igual al login */}
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
              <Text style={styles.title}>Crear Cuenta</Text>
              <Text style={styles.subtitle}>Regístrate como propietario</Text>
            </View>
          </View>

          {/* Formulario con estilo consistente */}
          <View style={styles.form}>
            {/* Cédula */}
            <View>
              <View
                style={[
                  styles.inputContainer,
                  fieldErrors.cedula && styles.inputError,
                ]}
              >
                <Ionicons
                  name="card-outline"
                  size={20}
                  color={
                    fieldErrors.cedula ? COLORS.error : COLORS.text.secondary
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Ingrese su número de cédula"
                  placeholderTextColor={COLORS.text.muted}
                  value={cedula}
                  maxLength={11}
                  onChangeText={(text) => {
                    setCedula(text);
                    if (fieldErrors.cedula) clearFieldError("cedula");
                  }}
                  keyboardType="numeric"
                />
              </View>
              {fieldErrors.cedula && (
                <Text style={styles.errorText}>{fieldErrors.cedula}</Text>
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
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (fieldErrors.email) clearFieldError("email");
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
              {fieldErrors.email && (
                <Text style={styles.errorText}>{fieldErrors.email}</Text>
              )}
            </View>

            {/* Código de Invitación */}
            <View>
              <View
                style={[
                  styles.inputContainer,
                  fieldErrors.codigoInvitacion && styles.inputError,
                ]}
              >
                <Ionicons
                  name="key-outline"
                  size={20}
                  color={
                    fieldErrors.codigoInvitacion
                      ? COLORS.error
                      : COLORS.text.secondary
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Código de la copropiedad"
                  placeholderTextColor={COLORS.text.muted}
                  value={codigoInvitacion}
                  onChangeText={(text) => {
                    setCodigoInvitacion(text.toUpperCase());
                    if (fieldErrors.codigoInvitacion)
                      clearFieldError("codigoInvitacion");
                  }}
                  autoCapitalize="characters"
                  maxLength={8}
                />
              </View>
              {fieldErrors.codigoInvitacion && (
                <Text style={styles.errorText}>
                  {fieldErrors.codigoInvitacion}
                </Text>
              )}
            </View>

            {/* Contraseña */}
            <View>
              <View
                style={[
                  styles.inputContainer,
                  fieldErrors.password && styles.inputError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={
                    fieldErrors.password ? COLORS.error : COLORS.text.secondary
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor={COLORS.text.muted}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (fieldErrors.password) clearFieldError("password");
                  }}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeButton}
                >
                  <Entypo
                    name={showPassword ? "lock-open" : "lock"}
                    size={18}
                    color={COLORS.text.secondary}
                  />
                </TouchableOpacity>
              </View>
              {fieldErrors.password && (
                <Text style={styles.errorText}>{fieldErrors.password}</Text>
              )}
            </View>

            {/* Confirmar Contraseña */}
            <View>
              <View
                style={[
                  styles.inputContainer,
                  fieldErrors.confirmPassword && styles.inputError,
                ]}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={
                    fieldErrors.confirmPassword
                      ? COLORS.error
                      : COLORS.text.secondary
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Repita su contraseña"
                  placeholderTextColor={COLORS.text.muted}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (fieldErrors.confirmPassword)
                      clearFieldError("confirmPassword");
                  }}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Entypo
                    name={showConfirmPassword ? "lock-open" : "lock"}
                    size={18}
                    color={COLORS.text.secondary}
                  />
                </TouchableOpacity>
              </View>
              {fieldErrors.confirmPassword && (
                <Text style={styles.errorText}>
                  {fieldErrors.confirmPassword}
                </Text>
              )}
            </View>

            {/* Botón de registro */}
            <TouchableOpacity
              style={[
                styles.registerButton,
                isLoading && styles.buttonDisabled,
              ]}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              <Text style={styles.registerButtonText}>Crear Cuenta</Text>
            </TouchableOpacity>

            {/* Link a login */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.push("/(auth)/login")}
            >
              <Text style={styles.loginLinkText}>
                ¿Ya tienes cuenta? Inicia sesión
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  eyeButton: {
    padding: 4,
  },
  registerButton: {
    backgroundColor: COLORS.primary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.md,
    alignItems: "center",
    marginBottom: THEME.spacing.md,
  },
  registerButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: THEME.fontSize.md,
  },
  loginLink: {
    alignItems: "center",
    marginBottom: THEME.spacing.xl,
  },
  loginLinkText: {
    color: COLORS.primary,
    fontSize: THEME.fontSize.sm,
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
  buttonDisabled: {
    // Sin cambios visuales, solo previene múltiples clics
  },
});
