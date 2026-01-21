import React, { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
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

import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { THEME, COLORS } from "@/constants/theme";
import LoadingOverlay from "@/components/LoadingOverlay";
import Toast from "@/components/Toast";

export default function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });
  const [fieldError, setFieldError] = useState("");

  const { forgotPasswordSubmit } = useAuth();
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

  const getCognitoErrorMessage = (error: any): string => {
    switch (error.name) {
      case "UserNotFoundException":
        return "No existe un usuario con esta cédula o email";
      case "InvalidParameterException":
        return "Datos inválidos. Verifica la información";
      case "LimitExceededException":
        return "Demasiados intentos. Intenta más tarde";
      case "NotAuthorizedException":
        return "No autorizado para esta operación";
      case "TooManyRequestsException":
        return "Demasiadas solicitudes. Espera un momento";
      case "UserNotConfirmedException":
        return "Cuenta no confirmada. Confirma tu cuenta primero";
      default:
        return error.message || "Error al solicitar recuperación";
    }
  };

  const handleForgotPassword = async () => {
    setFieldError("");

    // Limpiar espacios en blanco
    const cleanUsername = username.trim();

    if (!cleanUsername) {
      setFieldError("Ingresa tu cédula o correo electrónico");
      return;
    }

    // Validar formato si es email
    if (cleanUsername.includes("@")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanUsername)) {
        setFieldError("Ingresa un correo electrónico válido");
        return;
      }
    } else {
      // Validar formato si es cédula
      if (!/^\d{7,10}$/.test(cleanUsername)) {
        setFieldError("La cédula debe tener entre 7 y 10 dígitos");
        return;
      }
    }

    setLoading(true);
    try {
      await forgotPasswordSubmit(cleanUsername);
      showToast("Código de recuperación enviado a tu correo", "success");
      setTimeout(() => {
        router.push(
          `/(auth)/reset-password?username=${encodeURIComponent(cleanUsername)}`
        );
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
      <LoadingOverlay visible={loading} message="Enviando código..." />

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
          <View style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Cambiar contraseña</Text>
              {/* <Text style={styles.subtitle}>
                Ingresa tu documento o correo para continuar
              </Text> */}
            </View>

            {/* Formulario */}
            <View style={styles.form}>
              <View style={styles.inputCard}>
                <View style={styles.inputIconContainer}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={COLORS.primary}
                  />
                </View>
                <View style={styles.inputContent}>
                  <Text style={styles.label}>
                    Documento o correo electrónico
                  </Text>
                  <TextInput
                    style={[styles.input, fieldError && styles.inputError]}
                    placeholder="Ingresa tu cédula o email"
                    placeholderTextColor={COLORS.text.muted}
                    value={username}
                    onChangeText={(text) => {
                      setUsername(text);
                      if (fieldError) setFieldError("");
                    }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>
              </View>
              {fieldError && <Text style={styles.errorText}>{fieldError}</Text>}

              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleForgotPassword}
              >
                <Text style={styles.sendButtonText}>Enviar código</Text>
              </TouchableOpacity>

              <View style={styles.helpCard}>
                <Ionicons
                  name="information-circle-outline"
                  size={18}
                  color={COLORS.primary}
                  style={styles.helpIcon}
                />
                <Text style={styles.helpText}>
                  Ingresa tu cédula o correo. Si usas tu cédula, el código se
                  enviará al correo asociado a tu cuenta.
                </Text>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.push("/(auth)/login")}
              >
                <Text style={styles.backButtonText}>
                  {" "}
                  Volver al inicio de sesión
                </Text>
              </TouchableOpacity>
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
    top: 300,
    right: -60,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.lg,
  },
  content: {
    width: "100%",
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: THEME.spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: THEME.spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    fontSize: THEME.fontSize.lg,
    color: COLORS.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  form: {
    width: "100%",
    gap: THEME.spacing.md,
  },
  inputCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  inputIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: THEME.spacing.md,
  },
  inputContent: {
    flex: 1,
  },
  label: {
    fontSize: THEME.fontSize.xs,
    fontWeight: "500",
    color: COLORS.text.secondary,
    marginBottom: THEME.spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    fontSize: THEME.fontSize.lg,
    color: COLORS.text.primary,
    fontWeight: "600",
    padding: 0,
  },
  inputError: {
    color: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: THEME.fontSize.xs,
    marginTop: -THEME.spacing.sm,
    marginLeft: THEME.spacing.sm,
  },
  sendButton: {
    backgroundColor: COLORS.primary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: THEME.fontSize.md,
  },
  helpCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.primaryLight + "20",
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.primaryLight + "40",
  },
  helpIcon: {
    marginRight: THEME.spacing.sm,
    marginTop: 1,
  },
  helpText: {
    flex: 1,
    fontSize: THEME.fontSize.xs,
    color: COLORS.text.secondary,
    lineHeight: 18,
  },
  footer: {
    marginTop: THEME.spacing.lg,
    alignItems: "center",
  },
  backButton: {
    paddingVertical: THEME.spacing.sm,
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: THEME.fontSize.md,
    fontWeight: "500",
  },
});
