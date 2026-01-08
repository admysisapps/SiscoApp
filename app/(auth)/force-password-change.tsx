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
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { THEME, COLORS } from "@/constants/theme";
import LoadingOverlay from "@/components/LoadingOverlay";
import Toast from "@/components/Toast";
export default function ForcePasswordChange() {
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
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const { confirmSignInChallenge } = useAuth();
  const { username } = useLocalSearchParams<{ username?: string }>();

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

  const handleChangePassword = async () => {
    clearFieldErrors();
    let hasErrors = false;

    // Limpiar espacios en blanco
    const cleanNewPassword = newPassword.trim();
    const cleanConfirmPassword = confirmPassword.trim();

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

    setLoading(true);
    try {
      await confirmSignInChallenge(cleanNewPassword);
      showToast(
        "Contraseña actualizada exitosamente. Inicia sesión nuevamente",
        "success"
      );
    } catch (error: any) {
      let message = "Error al cambiar contraseña";

      if (error.name === "InvalidPasswordException") {
        message = "La contraseña no cumple con los requisitos";
      } else if (error.name === "LimitExceededException") {
        message = "Demasiados intentos. Intenta más tarde";
      }

      showToast(message, "error");
    } finally {
      setLoading(false);
    }

    // No redirigir automáticamente - dejar que el sistema de routing maneje la navegación
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <LoadingOverlay visible={loading} message="Actualizando contraseña..." />

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
            <Text style={styles.title}>Cambio Obligatorio</Text>
            <Text style={styles.subtitle}>
              Por seguridad, debes establecer una nueva contraseña
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            {/* Información */}
            <View style={styles.infoContainer}>
              <Ionicons
                name="shield-checkmark"
                size={48}
                color={COLORS.primary}
                style={styles.shieldIcon}
              />
              <Text style={styles.infoText}>
                Tu contraseña actual es temporal. Establece una nueva contraseña
                segura para continuar
              </Text>
              {username && (
                <Text style={styles.usernameText}>Usuario: {username}</Text>
              )}
            </View>

            {/* Nueva contraseña */}
            <View>
              <View
                style={[
                  styles.inputContainer,
                  fieldErrors.newPassword && styles.inputError,
                ]}
              >
                <Ionicons
                  name="lock-open-outline"
                  size={20}
                  color={
                    fieldErrors.newPassword
                      ? COLORS.error
                      : COLORS.text.secondary
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Nueva contraseña"
                  placeholderTextColor={COLORS.text.muted}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (fieldErrors.newPassword) clearFieldError("newPassword");
                  }}
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeButton}
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

            {/* Confirmar nueva contraseña */}
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
                  placeholder="Confirmar nueva contraseña"
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

            {/* Botón cambiar */}
            <TouchableOpacity
              style={styles.changeButton}
              onPress={handleChangePassword}
            >
              <Text style={styles.changeButtonText}>Establecer Contraseña</Text>
            </TouchableOpacity>

            {/* Información adicional */}
            <View style={styles.helpContainer}>
              <Ionicons
                name="information-circle-outline"
                size={16}
                color={COLORS.text.secondary}
                style={styles.helpIcon}
              />
              <Text style={styles.helpText}>
                Tu contraseña debe tener al menos 8 caracteres, incluyendo
                mayúsculas, minúsculas, números y símbolos
              </Text>
            </View>
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
    alignItems: "center",
    marginBottom: THEME.spacing.xl,
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
    textAlign: "center",
    lineHeight: 20,
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
    borderRadius: THEME.borderRadius.lg,
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
    lineHeight: 20,
    marginBottom: THEME.spacing.sm,
  },
  usernameText: {
    fontSize: THEME.fontSize.xs,
    color: COLORS.primary,
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
  changeButton: {
    backgroundColor: COLORS.primary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.md,
    alignItems: "center",
    marginBottom: THEME.spacing.lg,
  },
  changeButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: THEME.fontSize.md,
  },
  helpContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.primaryLight + "20",
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.lg,
  },
  helpIcon: {
    marginRight: THEME.spacing.sm,
    marginTop: 2,
  },
  helpText: {
    flex: 1,
    fontSize: THEME.fontSize.xs,
    color: COLORS.text.secondary,
    lineHeight: 16,
  },
  inputError: {
    borderColor: COLORS.error,
    borderWidth: 1,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
    marginBottom: 8,
    marginLeft: 4,
  },
});
