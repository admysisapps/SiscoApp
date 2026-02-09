import React, { useState } from "react";
import { Entypo, Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";

import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { THEME, COLORS } from "@/constants/theme";
import LoadingOverlay from "@/components/LoadingOverlay";
import Toast from "@/components/Toast";
import OTPInput from "@/components/auth/OTPInput";

export default function ResetPassword() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });
  const [fieldErrors, setFieldErrors] = useState<{
    code?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const { resetPasswordSubmit } = useAuth();
  const router = useRouter();
  const { username } = useLocalSearchParams<{ username: string }>();

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

  const getCognitoErrorMessage = (error: any): string => {
    switch (error.name) {
      case "CodeMismatchException":
        return "Código de verificación incorrecto";
      case "ExpiredCodeException":
        return "El código ha expirado. Solicita uno nuevo";
      case "InvalidPasswordException":
        return "La contraseña no cumple con los requisitos";
      case "LimitExceededException":
        return "Demasiados intentos. Intenta más tarde";
      case "NotAuthorizedException":
        return "No autorizado para esta operación";
      case "UserNotFoundException":
        return "Usuario no encontrado";
      case "TooManyRequestsException":
        return "Demasiadas solicitudes. Espera un momento";
      default:
        return error.message || "Error al restablecer contraseña";
    }
  };

  const handleResetPassword = async () => {
    clearFieldErrors();
    let hasErrors = false;

    // Limpiar espacios en blanco
    const cleanCode = code.join("").trim();
    const cleanNewPassword = newPassword.trim();
    const cleanConfirmPassword = confirmPassword.trim();

    // Validar código
    if (!cleanCode) {
      setFieldError("code", "Ingresa el código de verificación");
      hasErrors = true;
    } else if (cleanCode.length !== 6) {
      setFieldError("code", "El código debe tener 6 dígitos");
      hasErrors = true;
    }

    // Validar nueva contraseña
    if (!cleanNewPassword) {
      setFieldError("newPassword", "Ingresa tu nueva contraseña");
      hasErrors = true;
    } else {
      const passwordErrors = validatePassword(cleanNewPassword);
      if (passwordErrors.length > 0) {
        setFieldError("newPassword", passwordErrors.join(", "));
        hasErrors = true;
      }
    }

    // Validar confirmación
    if (!cleanConfirmPassword) {
      setFieldError("confirmPassword", "Confirma tu nueva contraseña");
      hasErrors = true;
    } else if (cleanNewPassword !== cleanConfirmPassword) {
      setFieldError("confirmPassword", "Las contraseñas no coinciden");
      hasErrors = true;
    }

    if (hasErrors) {
      return;
    }

    if (!username) {
      showToast("Error: Usuario no encontrado", "error");
      return;
    }

    setLoading(true);
    try {
      await resetPasswordSubmit(username, cleanCode, cleanNewPassword);
      showToast("¡Contraseña restablecida exitosamente!", "success");
      setTimeout(() => {
        router.push("/(auth)/login");
      }, 2000);
    } catch (error: any) {
      const errorMessage = getCognitoErrorMessage(error);
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LoadingOverlay
        visible={loading}
        message="Restableciendo contraseña..."
      />

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
            <View style={styles.headerContent}>
              <Text style={styles.title}>Nueva Contraseña</Text>
              <Text style={styles.subtitle}>
                Ingresa el código y tu nueva contraseña
              </Text>
            </View>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            {/* Usuario */}
            <View style={styles.inputCard}>
              <Text style={styles.label}>Usuario: {username}</Text>
            </View>

            {/* Código */}
            <View style={styles.otpContainer}>
              <OTPInput
                value={code}
                onChange={(newCode) => {
                  setCode(newCode);
                  if (fieldErrors.code) clearFieldError("code");
                }}
                error={fieldErrors.code}
                disabled={loading}
              />
            </View>

            {/* Nueva contraseña */}
            <View>
              <View
                style={[
                  styles.inputContainer,
                  fieldErrors.newPassword && styles.inputError,
                  code.join("").length !== 6 && styles.inputContainerDisabled,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={
                    fieldErrors.newPassword
                      ? COLORS.error
                      : COLORS.text.secondary
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[
                    styles.input,
                    code.join("").length !== 6 && styles.inputDisabled,
                  ]}
                  placeholder="Nueva contraseña"
                  placeholderTextColor={COLORS.text.muted}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (fieldErrors.newPassword) clearFieldError("newPassword");
                  }}
                  secureTextEntry={!showNewPassword}
                  editable={code.join("").length === 6}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeButton}
                  disabled={code.join("").length !== 6}
                >
                  <Entypo
                    name={showNewPassword ? "lock-open" : "lock"}
                    size={18}
                    color={COLORS.text.secondary}
                  />
                </TouchableOpacity>
              </View>
              {fieldErrors.newPassword && (
                <Text style={styles.errorText}>{fieldErrors.newPassword}</Text>
              )}
            </View>

            {/* Confirmar contraseña */}
            <View>
              <View
                style={[
                  styles.inputContainer,
                  fieldErrors.confirmPassword && styles.inputError,
                  code.join("").length !== 6 && styles.inputContainerDisabled,
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
                  style={[
                    styles.input,
                    code.join("").length !== 6 && styles.inputDisabled,
                  ]}
                  placeholder="Confirmar nueva contraseña"
                  placeholderTextColor={COLORS.text.muted}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (fieldErrors.confirmPassword)
                      clearFieldError("confirmPassword");
                  }}
                  secureTextEntry={!showConfirmPassword}
                  editable={code.join("").length === 6}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                  disabled={code.join("").length !== 6}
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

            {/* Botón restablecer */}
            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleResetPassword}
            >
              <Text style={styles.resetButtonText}>Restablecer Contraseña</Text>
            </TouchableOpacity>

            {/* Link a login */}
            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => router.push("/(auth)/login")}
            >
              <Text style={styles.loginLinkText}>
                Volver al inicio de sesión
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
    </View>
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
  infoContainer: {
    alignItems: "center",
    marginBottom: THEME.spacing.xl,
    padding: THEME.spacing.lg,
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  shieldIcon: {
    marginBottom: THEME.spacing.md,
  },
  infoText: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.text.secondary,
    textAlign: "center",
    marginBottom: THEME.spacing.sm,
    lineHeight: 20,
  },
  usernameText: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.text.primary,
    fontWeight: "600",
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
  resetButton: {
    backgroundColor: COLORS.primary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.md,
    alignItems: "center",
    marginBottom: THEME.spacing.md,
  },
  resetButtonText: {
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
  inputCard: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: THEME.spacing.md,
  },
  label: {
    fontSize: THEME.fontSize.sm,
    fontWeight: "500",
    color: COLORS.text.secondary,
    marginBottom: THEME.spacing.sm,
  },
  userDisplayText: {
    fontSize: THEME.fontSize.md,
    color: COLORS.text.primary,
    fontWeight: "600",
  },
  inputDisabled: {
    opacity: 0.5,
    color: COLORS.text.muted,
  },
  inputContainerDisabled: {
    backgroundColor: COLORS.background,
    opacity: 0.6,
  },
  otpContainer: {
    marginBottom: THEME.spacing.lg,
  },
});
