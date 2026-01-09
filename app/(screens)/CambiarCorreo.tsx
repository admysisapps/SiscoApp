import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import OTPInput from "@/components/auth/OTPInput";
import { useUser } from "@/contexts/UserContext";
import { useProject } from "@/contexts/ProjectContext";
import { userCacheService } from "@/services/cache/userCacheService";
import { profileService } from "@/services/auth/profileService";
import Toast from "@/components/Toast";
import { THEME, COLORS } from "@/constants/theme";

export default function CambiarCorreoScreen() {
  const { user, updateUserInfo } = useUser();
  const { selectedProject } = useProject();
  const [step, setStep] = useState<"input" | "verify">("input");
  const [newEmail, setNewEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error" | "warning",
  });

  const showToast = (
    message: string,
    type: "success" | "error" | "warning"
  ) => {
    setToast({ visible: true, message, type });
  };

  const handleSendCode = async () => {
    if (!newEmail.trim()) {
      showToast("Ingresa el nuevo correo", "error");
      return;
    }

    setLoading(true);
    try {
      const result = await profileService.updateEmail(newEmail);

      if (
        result.result?.nextStep?.updateAttributeStep ===
        "CONFIRM_ATTRIBUTE_WITH_CODE"
      ) {
        setStep("verify");
        showToast("Código enviado. Revisa tu bandeja de entrada", "success");
      } else if (result.result?.nextStep?.updateAttributeStep === "DONE") {
        await profileService.syncEmailToDatabase(
          user?.documento || "",
          newEmail
        );

        if (user?.documento && selectedProject) {
          await userCacheService.invalidateProject(
            user.documento,
            selectedProject.NIT
          );
        }

        if (user) {
          updateUserInfo({ ...user, email: newEmail });
        }

        showToast("Correo actualizado correctamente", "success");
        setTimeout(() => router.back(), 1500);
      }
    } catch (error: any) {
      let errorMessage = "Error al enviar código";
      if (error.message?.includes("InvalidParameterException")) {
        errorMessage = "Correo inválido o ya en uso";
      } else if (error.message?.includes("LimitExceededException")) {
        errorMessage = "Demasiados intentos. Espera unos minutos";
      } else if (error.message) {
        errorMessage = error.message;
      }
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    const code = verificationCode.join("").trim();
    if (!code || code.length !== 6) {
      showToast("Ingresa el código de verificación completo", "error");
      return;
    }

    setLoading(true);
    try {
      await profileService.confirmEmailChange(code);
      await profileService.syncEmailToDatabase(user?.documento || "", newEmail);

      if (user?.documento && selectedProject) {
        await userCacheService.invalidateProject(
          user.documento,
          selectedProject.NIT
        );
      }

      if (user) {
        updateUserInfo({ ...user, email: newEmail });
      }

      showToast("Correo actualizado correctamente", "success");
      setTimeout(() => router.back(), 1500);
    } catch (error: any) {
      let errorMessage = "Código inválido o expirado";
      if (error.message) {
        errorMessage = error.message;
      }
      showToast(errorMessage, "error");
    } finally {
      setLoading(false);
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
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
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
              <Text style={styles.title}>Actualizar Correo</Text>
            </View>
          </View>
          {/* Formulario */}
          <View style={styles.form}>
            {step === "input" ? (
              <>
                <View style={styles.infoContainer}>
                  <MaterialCommunityIcons
                    name="email-arrow-right"
                    size={48}
                    color={COLORS.primary}
                    style={styles.icon}
                  />
                  <Text style={styles.infoText}>
                    Por tu seguridad, necesitamos validar tu identidad. Te
                    enviaremos un código de verificación a tu correo actual.
                  </Text>
                </View>
                <View style={styles.currentEmailCard}>
                  <Text style={styles.currentEmailLabel}>
                    Correo actual: {user?.email || "No especificado"}
                  </Text>
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons
                    name="mail"
                    size={20}
                    color={COLORS.text.secondary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    value={newEmail}
                    onChangeText={setNewEmail}
                    placeholder="nuevo@correo.com"
                    placeholderTextColor={COLORS.text.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>

                <TouchableOpacity
                  style={[
                    styles.buttonWrapper,
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleSendCode}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark || "#1e40af"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientButton}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.buttonText}>Enviar Código</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <View style={styles.infoContainer}>
                  <MaterialCommunityIcons
                    name="email-check"
                    size={48}
                    color={COLORS.primary}
                    style={styles.icon}
                  />
                  <Text style={styles.infoText}>
                    Ingresa el código de 6 dígitos enviado a:
                  </Text>
                  <Text style={styles.emailHighlight}>{newEmail}</Text>
                </View>

                <OTPInput
                  value={verificationCode}
                  onChange={setVerificationCode}
                  disabled={loading}
                />

                <TouchableOpacity
                  style={[
                    styles.buttonWrapper,
                    loading && styles.buttonDisabled,
                  ]}
                  onPress={handleConfirm}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={[COLORS.primary, COLORS.primaryDark || "#1e40af"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientButton}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.buttonText}>Confirmar</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.resendButton}
                  onPress={() => setStep("input")}
                  disabled={loading}
                >
                  <Text style={styles.resendText}>Cambiar correo</Text>
                </TouchableOpacity>
              </>
            )}
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
    lineHeight: 20,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.xl,
    paddingBottom: THEME.spacing.xl,
  },
  form: {
    width: "100%",
  },
  infoContainer: {
    alignItems: "center",
    marginBottom: THEME.spacing.lg,
    padding: THEME.spacing.lg,
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  icon: {
    marginBottom: THEME.spacing.md,
  },
  infoText: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
  currentEmailCard: {
    backgroundColor: COLORS.primaryLight + "20",
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.lg,
  },
  currentEmailLabel: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.text.secondary,
    textAlign: "center",
  },
  emailHighlight: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: COLORS.primary,
    textAlign: "center",
    marginTop: THEME.spacing.sm,
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
    fontSize: THEME.fontSize.md,
  },
  buttonWrapper: {
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.lg,
    overflow: "hidden",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  gradientButton: {
    paddingVertical: THEME.spacing.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.md,
    alignItems: "center",
    marginBottom: THEME.spacing.lg,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: THEME.fontSize.md,
  },
  resendButton: {
    alignItems: "center",
    paddingVertical: THEME.spacing.sm,
  },
  resendText: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.primary,
    fontWeight: "500",
  },
});
