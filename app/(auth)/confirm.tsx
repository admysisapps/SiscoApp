import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { THEME, COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import Toast from "@/components/Toast";
import { validationService } from "@/services/auth/validationService";
import { authService } from "@/services/auth/authService";
import ChangeEmailModal from "@/components/auth/ChangeEmailModal";
import { useLoading } from "@/contexts/LoadingContext";

const { width, height } = Dimensions.get("window");

export default function Confirm() {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error" | "warning",
  });
  const [fieldError, setFieldError] = useState("");
  const [showChangeEmailModal, setShowChangeEmailModal] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [updatedEmail, setUpdatedEmail] = useState<string | null>(null);
  const [canResend, setCanResend] = useState(false);
  const [isCodeFocused, setIsCodeFocused] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const inputRef = useRef<TextInput | null>(null);
  const resendTimerRef = useRef<NodeJS.Timeout | null>(null);

  const { confirmRegistration, resendConfirmationCode } = useAuth();
  const { showLoading, hideLoading } = useLoading();
  const router = useRouter();
  const { username, email } = useLocalSearchParams<{
    username: string;
    email?: string;
  }>();

  // Limpiar loading al montar (por si viene de signup)
  useEffect(() => {
    hideLoading();
  }, [hideLoading]);

  // Obtener email desde BD si no viene como parámetro
  useEffect(() => {
    const fetchUserEmail = async () => {
      if (!email && username) {
        try {
          const response = await validationService.getUserEmail(username);
          if (response.success && response.email) {
            setUserEmail(response.email);
          }
        } catch {
          // Error silencioso
        }
      }
    };
    fetchUserEmail();
  }, [username, email]);

  // Enviar código automáticamente cuando llegamos a la pantalla
  useEffect(() => {
    if (username && !email && !userEmail) {
      const sendCode = async () => {
        try {
          await resendConfirmationCode(username);
          showToast("Código enviado a tu correo", "success");
          enableResendAfterDelay();
        } catch (error: any) {
          const errorMessage = getCognitoErrorMessage(error);
          showToast(errorMessage, "error");
        }
      };
      sendCode();
    } else if (username && email) {
      enableResendAfterDelay();
    }
  }, [username, email, userEmail, resendConfirmationCode]);

  // Habilitar reenvío después de 60 segundos
  const enableResendAfterDelay = () => {
    setCanResend(false);
    if (resendTimerRef.current) {
      clearTimeout(resendTimerRef.current);
    }
    resendTimerRef.current = setTimeout(() => {
      setCanResend(true);
    }, 60000); // 60 segundos
  };

  // Limpiar timer al desmontar componente
  useEffect(() => {
    return () => {
      if (resendTimerRef.current) {
        clearTimeout(resendTimerRef.current);
      }
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

  const getCognitoErrorMessage = (error: any): string => {
    switch (error.name) {
      case "CodeMismatchException":
        return "Código de verificación incorrecto";
      case "ExpiredCodeException":
        return "El código ha expirado. Solicita uno nuevo";
      case "LimitExceededException":
        return "Demasiados intentos. Intenta más tarde";
      case "NotAuthorizedException":
        return "No autorizado para confirmar esta cuenta";
      case "UserNotFoundException":
        return "Usuario no encontrado";
      case "AliasExistsException":
        return "Ya existe una cuenta con este email";
      case "TooManyRequestsException":
        return "Demasiadas solicitudes. Espera un momento";
      default:
        return error.message || "Error al confirmar cuenta";
    }
  };

  const handleConfirm = async () => {
    setFieldError("");

    // Limpiar espacios en blanco del código
    const code = otp.join("").trim();
    if (!code || code.length !== 6) {
      setFieldError("Ingresa el código de verificación completo");
      return;
    }

    if (!username) {
      showToast("Error: Usuario no encontrado", "error");
      return;
    }

    showLoading("Confirmando cuenta...");
    try {
      await confirmRegistration(username, code);
      hideLoading();

      // Navegar inmediatamente
      const finalEmail = updatedEmail || email || userEmail || "";
      router.push(
        `/(auth)/registration-success?username=${encodeURIComponent(username)}&email=${encodeURIComponent(finalEmail)}`
      );
    } catch (error: any) {
      const errorMessage = getCognitoErrorMessage(error);
      showToast(errorMessage, "error");
      hideLoading();
    }
  };

  const handleResendCode = async () => {
    if (!canResend) return;

    if (!username) {
      showToast("Error: Usuario no encontrado", "error");
      return;
    }

    try {
      await authService.resendConfirmationCode(username);
      showToast("Código reenviado a tu correo", "success");
      enableResendAfterDelay();
    } catch (error: any) {
      const errorMessage = getCognitoErrorMessage(error);
      showToast(errorMessage, "error");
    }
  };

  const handleChangeEmail = async (newEmail: string) => {
    if (!username) {
      showToast("Error: Usuario no encontrado", "error");
      return;
    }

    setIsChangingEmail(true);

    try {
      const response = await validationService.changeEmailUnconfirmed(
        username,
        newEmail
      );

      if (response.success) {
        showToast("Email actualizado exitosamente", "success");
        setUpdatedEmail(newEmail);
        setUserEmail(newEmail);
        setShowChangeEmailModal(false);

        // Reenviar código en background sin activar loading global
        setTimeout(async () => {
          try {
            await authService.resendConfirmationCode(username);
            showToast("Código enviado al nuevo Correo", "success");
            enableResendAfterDelay();
          } catch {
            showToast(
              "Correo actualizado. Usa 'Reenviar código' para recibir el código",
              "warning"
            );
          }
        }, 1000);
      } else {
        showToast(response.error || "Error actualizando el correo", "error");
      }
    } catch {
      showToast("Error actualizando email", "error");
    } finally {
      setIsChangingEmail(false);
    }
  };

  const finalEmail = updatedEmail || email || userEmail || "";
  const emailDisplay = finalEmail || "Cargando el correo...";

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Background decorativo igual al signup */}
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
          showsVerticalScrollIndicator={false}
        >
          {/* Header animado  */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text style={styles.title} allowFontScaling={true}>
                Verificar Cuenta
              </Text>
              <Text style={styles.subtitle} allowFontScaling={true}>
                Ingresa el código que enviamos a tu correo
              </Text>
            </View>
          </View>

          {/* Formulario con estilo consistente */}
          <View style={styles.form}>
            {/* Información del correo con estilo de input */}
            <View>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={COLORS.text.secondary}
                  style={styles.inputIcon}
                />
                <Text style={styles.emailDisplayText} allowFontScaling={true}>
                  {emailDisplay}
                </Text>
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => setShowChangeEmailModal(true)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.editButtonText}>Cambiar</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.emailLabel} allowFontScaling={true}>
                Código enviado a este correo
              </Text>
            </View>

            {/* Información del usuario con estilo de input */}
            <View>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={COLORS.text.secondary}
                  style={styles.inputIcon}
                />
                <Text style={styles.userDisplayText} allowFontScaling={true}>
                  {username}
                </Text>
              </View>
            </View>

            {/* Input del código con estilo consistente */}
            <View>
              <TouchableOpacity
                style={[styles.inputContainer, fieldError && styles.inputError]}
                onPress={() => inputRef.current?.focus()}
                activeOpacity={0.7}
              >
                <View style={styles.codeInputWrapper}>
                  <View style={styles.codeInputContainer}>
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <View
                        key={index}
                        style={[
                          styles.codeBox,
                          otp[index] && styles.codeBoxFilled,
                          fieldError && styles.codeBoxError,
                          index === 0 && isCodeFocused && styles.codeBoxFocused,
                        ]}
                      >
                        <Text style={styles.codeDigit} allowFontScaling={true}>
                          {otp[index] || ""}
                        </Text>
                      </View>
                    ))}
                  </View>
                  <TextInput
                    ref={inputRef}
                    style={styles.hiddenInput}
                    value={otp.join("")}
                    onChangeText={(text) => {
                      const cleanText = text.replace(/[^0-9]/g, "").slice(0, 6);
                      const newOtp = cleanText.split("");
                      while (newOtp.length < 6) {
                        newOtp.push("");
                      }
                      setOtp(newOtp);
                      if (fieldError) setFieldError("");
                    }}
                    onFocus={() => setIsCodeFocused(true)}
                    onBlur={() => setIsCodeFocused(false)}
                    keyboardType="numeric"
                    maxLength={6}
                    autoFocus
                    placeholder="Código de verificación"
                    placeholderTextColor={COLORS.text.muted}
                  />
                </View>
              </TouchableOpacity>
              {fieldError && (
                <Text style={styles.errorText} allowFontScaling={true}>
                  {fieldError}
                </Text>
              )}
            </View>

            {/* Botón principal con estilo consistente */}
            <TouchableOpacity
              style={[
                styles.confirmButton,
                otp.join("").length !== 6 && styles.confirmButtonDisabled,
              ]}
              onPress={handleConfirm}
              disabled={otp.join("").length !== 6}
            >
              <Text style={styles.confirmButtonText} allowFontScaling={true}>
                Verificar Cuenta
              </Text>
            </TouchableOpacity>

            {/* Opciones adicionales */}
            <View style={styles.helpSection}>
              <TouchableOpacity
                style={[
                  styles.resendButton,
                  !canResend && styles.resendButtonDisabled,
                ]}
                onPress={handleResendCode}
                disabled={!canResend}
              >
                <Ionicons
                  name="refresh-outline"
                  size={16}
                  color={canResend ? COLORS.primary : COLORS.text.muted}
                />
                <Text
                  style={[
                    styles.resendButtonText,
                    !canResend && styles.resendButtonTextDisabled,
                  ]}
                  allowFontScaling={true}
                >
                  {!canResend ? "Reenviar código " : "Reenviar código"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.loginLink}
                onPress={() => router.push("/(auth)/login")}
              >
                <Ionicons
                  name="arrow-back-outline"
                  size={16}
                  color={COLORS.text.secondary}
                />
                <Text style={styles.loginLinkText} allowFontScaling={true}>
                  Volver al login
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

      {/* Modal cambiar email */}
      <ChangeEmailModal
        visible={showChangeEmailModal}
        currentEmail={email || userEmail || undefined}
        onConfirm={handleChangeEmail}
        onCancel={() => setShowChangeEmailModal(false)}
        loading={isChangingEmail}
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
    width: width * 0.6,
    height: width * 0.6,
    backgroundColor: COLORS.primary,
    top: -width * 0.3,
    right: -width * 0.3,
  },
  circle2: {
    width: width * 0.45,
    height: width * 0.45,
    backgroundColor: COLORS.primaryLight,
    bottom: -width * 0.225,
    left: -width * 0.225,
  },
  circle3: {
    width: width * 0.3,
    height: width * 0.3,
    backgroundColor: COLORS.primary,
    top: height * 0.25,
    right: -width * 0.15,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: width < 360 ? 80 : 120,
    flexGrow: 1,
    paddingBottom: THEME.spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: THEME.spacing.xl,
    paddingHorizontal: width < 360 ? THEME.spacing.md : THEME.spacing.lg,
    paddingTop: THEME.spacing.xl,
  },

  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: width < 360 ? 24 : 28,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: THEME.spacing.xs,
  },
  subtitle: {
    fontSize: width < 360 ? THEME.fontSize.sm : THEME.fontSize.md,
    color: COLORS.text.secondary,
    lineHeight: width < 360 ? 20 : 22,
  },
  form: {
    paddingHorizontal: width < 360 ? THEME.spacing.md : THEME.spacing.lg,
    gap: THEME.spacing.lg,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.error + "08",
  },
  inputIcon: {
    marginRight: THEME.spacing.sm,
  },
  emailDisplayText: {
    flex: 1,
    fontSize: width < 360 ? THEME.fontSize.sm : THEME.fontSize.md,
    color: COLORS.primary,
    fontWeight: "600",
  },
  userDisplayText: {
    flex: 1,
    fontSize: width < 360 ? THEME.fontSize.sm : THEME.fontSize.md,
    color: COLORS.text.primary,
    fontWeight: "600",
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "15",
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  editButtonText: {
    fontSize: THEME.fontSize.xs,
    color: COLORS.primary,
    fontWeight: "600",
  },
  editIcon: {
    marginLeft: THEME.spacing.xs / 2,
  },
  emailLabel: {
    fontSize: THEME.fontSize.xs,
    color: COLORS.text.secondary,
    marginTop: THEME.spacing.xs,
    marginLeft: THEME.spacing.sm,
  },

  codeInputWrapper: {
    flex: 1,
    position: "relative",
  },
  codeInputContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingRight: THEME.spacing.sm,
  },
  codeBox: {
    width: Math.min(width * 0.12, 50),
    height: Math.min(width * 0.14, 60),
    borderRadius: THEME.borderRadius.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 1,
  },
  codeBoxFilled: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + "10",
  },
  codeBoxError: {
    borderColor: COLORS.error,
  },
  codeBoxFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.primary + "10",
  },
  codeDigit: {
    fontSize: width < 360 ? 16 : 18,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  hiddenInput: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: COLORS.primary,
    borderRadius: THEME.borderRadius.lg,
    paddingVertical: THEME.spacing.lg,
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  confirmButtonDisabled: {
    backgroundColor: COLORS.text.muted,
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "700",
    fontSize: width < 360 ? THEME.fontSize.md : THEME.fontSize.lg,
  },
  helpSection: {
    gap: THEME.spacing.md,
  },
  resendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: THEME.spacing.md,
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  resendButtonDisabled: {
    opacity: 0.6,
    shadowOpacity: 0,
    elevation: 0,
  },
  resendButtonText: {
    color: COLORS.primary,
    fontSize: width < 360 ? THEME.fontSize.sm : THEME.fontSize.md,
    marginLeft: THEME.spacing.xs,
    fontWeight: "600",
  },
  resendButtonTextDisabled: {
    color: COLORS.text.muted,
  },
  loginLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: THEME.spacing.md,
  },
  loginLinkText: {
    color: COLORS.text.secondary,
    fontSize: width < 360 ? THEME.fontSize.sm : THEME.fontSize.md,
    marginLeft: THEME.spacing.xs,
    fontWeight: "500",
  },
  errorText: {
    color: COLORS.error,
    fontSize: THEME.fontSize.xs,
    marginTop: THEME.spacing.xs,
    marginLeft: THEME.spacing.sm,
  },
});
