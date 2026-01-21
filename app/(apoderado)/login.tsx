import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Dimensions,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import { useRouter, useLocalSearchParams } from "expo-router";
import { useApoderado } from "@/contexts/ApoderadoContext";
import { sessionService } from "@/services/cache/sessionService";
import { THEME, COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import {
  getCrashlytics,
  recordError,
  log,
} from "@react-native-firebase/crashlytics";

import Toast from "@/components/Toast";

const { height } = Dimensions.get("window");

export default function ApoderadoLogin() {
  const [correo, setCorreo] = useState("");
  const [cedula, setCedula] = useState("");
  const [codigoOtp, setCodigoOtp] = useState("");
  const [codigoCopropiedad, setCodigoCopropiedad] = useState("");
  const [errors, setErrors] = useState({
    correo: false,
    cedula: false,
    codigoOtp: false,
    codigoCopropiedad: false,
  });
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });

  // ANIMACIONES
  const pulseAnim = useMemo(() => new Animated.Value(1), []);

  //  HOOKS
  const { login, loading } = useApoderado();
  const router = useRouter();
  const params = useLocalSearchParams();

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "warning" = "success") => {
      setToast({ visible: true, message, type });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast({ visible: false, message: "", type: "success" });
  }, []);

  const clearFieldError = (field: keyof typeof errors) => {
    setErrors((prev) => ({ ...prev, [field]: false }));
  };

  //  EFECTOS
  useEffect(() => {
    // Animación de pulso sutil para el ícono
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => pulseAnimation.stop();
  }, [pulseAnim]);

  // Mostrar mensaje si viene de sesión inválida
  useEffect(() => {
    if (params.mensaje) {
      setTimeout(() => {
        showToast(params.mensaje as string, "warning");
      }, 500);
    }
  }, [params.mensaje, showToast]);

  // FUNCIONES
  const handleLogin = async () => {
    hideToast();
    setErrors({
      correo: false,
      cedula: false,
      codigoOtp: false,
      codigoCopropiedad: false,
    });

    // Limpiar espacios en blanco
    const cleanCorreo = correo.trim();
    const cleanCedula = cedula.trim();
    const cleanCodigoOtp = codigoOtp.trim();
    const cleanCodigoCopropiedad = codigoCopropiedad.trim();

    // Validar campos
    const newErrors = {
      correo: false,
      cedula: false,
      codigoOtp: false,
      codigoCopropiedad: false,
    };
    let hasErrors = false;

    if (!cleanCodigoCopropiedad) {
      newErrors.codigoCopropiedad = true;
      hasErrors = true;
    } else if (!/^[A-Z0-9]{6,8}$/.test(cleanCodigoCopropiedad)) {
      newErrors.codigoCopropiedad = true;
      hasErrors = true;
    }

    if (!cleanCedula) {
      newErrors.cedula = true;
      hasErrors = true;
    } else if (!/^[1-9][0-9]{3,10}$/.test(cleanCedula)) {
      newErrors.cedula = true;
      hasErrors = true;
    }

    if (!cleanCorreo) {
      newErrors.correo = true;
      hasErrors = true;
    } else if (
      !/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(cleanCorreo)
    ) {
      newErrors.correo = true;
      hasErrors = true;
    }

    if (!cleanCodigoOtp) {
      newErrors.codigoOtp = true;
      hasErrors = true;
    } else if (cleanCodigoOtp.length !== 6) {
      newErrors.codigoOtp = true;
      hasErrors = true;
    }

    if (hasErrors) {
      setErrors(newErrors);
      setTimeout(() => showToast("Verifica los campos marcados", "error"), 100);
      return;
    }

    try {
      const response = await login({
        correo: cleanCorreo,
        cedula: cleanCedula,
        codigo_otp: cleanCodigoOtp,
        codigo_copropiedad: cleanCodigoCopropiedad,
      });

      if (response.data?.asamblea?.id) {
        // Guardar sesión para auto-reconexion
        const sessionData = {
          ...response.data,
          codigo_otp: cleanCodigoOtp,
          codigo_copropiedad: cleanCodigoCopropiedad,
          puede_reingresar: response.data.puede_reingresar || true,
        };

        await sessionService.saveSession(sessionData);
        const crashlytics = getCrashlytics();
        log(crashlytics, "Inicio de sesión exitoso - Apoderado");
        router.replace(`/(apoderado)/asamblea/${response.data.asamblea.id}`);
      } else {
        setTimeout(
          () =>
            showToast("No se pudo obtener información de la asamblea", "error"),
          100
        );
      }
    } catch (error: any) {
      const crashlytics = getCrashlytics();
      recordError(crashlytics, error);
      const errorMessage = error.message || "Error al iniciar sesión";

      const newErrors = {
        correo: false,
        cedula: false,
        codigoOtp: false,
        codigoCopropiedad: false,
      };

      // Mapeo de errores a campos específicos
      const ERROR_FIELD_MAP: Record<string, (keyof typeof newErrors)[]> = {
        "Código de proyecto inválido": ["codigoCopropiedad"],
        "Código de acceso incorrecto": ["codigoOtp"],
        "No pudimos validar el correo o la cédula": ["correo", "cedula"],
        "El código de acceso ya fue utilizado": ["codigoOtp"],
        "El código de acceso ha expirado": ["codigoOtp"],
        // Errores de estado de asamblea (no marcan campos):
        "La asamblea aún no ha iniciado": [],
        "La asamblea ya ha finalizado": [],
        "La asamblea ha sido cancelada": [],
      };

      // Buscar coincidencia y marcar campos
      for (const [key, fields] of Object.entries(ERROR_FIELD_MAP)) {
        if (errorMessage.includes(key)) {
          fields.forEach((field) => (newErrors[field] = true));
          break;
        }
      }

      setErrors(newErrors);
      setTimeout(() => showToast(errorMessage, "error"), 100);
    }
  };

  return (
    <View style={styles.container}>
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
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* HEADER */}
            <View style={styles.header}>
              <Animated.View
                style={[
                  styles.iconContainer,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                <Ionicons name="person-add" size={50} color="white" />
              </Animated.View>
              <Text style={styles.title}>Acceso Apoderado</Text>
              <Text style={styles.subtitle}>
                Ingresa con tu código de acceso
              </Text>
            </View>

            {/* FORMULARIO */}
            <View style={styles.form}>
              {/* Input Código Copropiedad */}
              <View
                style={[
                  styles.inputContainer,
                  errors.codigoCopropiedad && styles.inputError,
                ]}
              >
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={
                    errors.codigoCopropiedad ? "#ef4444" : COLORS.text.secondary
                  }
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Código de copropiedad (ej: LP251234)"
                  placeholderTextColor={COLORS.text.muted}
                  value={codigoCopropiedad}
                  onChangeText={(text) => {
                    setCodigoCopropiedad(text);
                    clearFieldError("codigoCopropiedad");
                  }}
                  autoCapitalize="characters"
                  maxLength={8}
                />
              </View>

              {/* Input Cédula */}
              <View
                style={[
                  styles.inputContainer,
                  errors.cedula && styles.inputError,
                ]}
              >
                <Ionicons
                  name="card-outline"
                  size={20}
                  color={errors.cedula ? "#ef4444" : COLORS.text.secondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Número de cédula"
                  placeholderTextColor={COLORS.text.muted}
                  value={cedula}
                  onChangeText={(text) => {
                    setCedula(text);
                    clearFieldError("cedula");
                  }}
                  keyboardType="numeric"
                  maxLength={11}
                />
              </View>

              <View
                style={[
                  styles.inputContainer,
                  errors.correo && styles.inputError,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={errors.correo ? "#ef4444" : COLORS.text.secondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Correo electrónico"
                  placeholderTextColor={COLORS.text.muted}
                  value={correo}
                  onChangeText={(text) => {
                    setCorreo(text);
                    clearFieldError("correo");
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Input Código OTP */}
              <View
                style={[
                  styles.inputContainer,
                  errors.codigoOtp && styles.inputError,
                ]}
              >
                <Ionicons
                  name="key-outline"
                  size={20}
                  color={errors.codigoOtp ? "#ef4444" : COLORS.text.secondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Código de acceso (6 dígitos)"
                  placeholderTextColor={COLORS.text.muted}
                  value={codigoOtp}
                  onChangeText={(text) => {
                    setCodigoOtp(text);
                    clearFieldError("codigoOtp");
                  }}
                  keyboardType="numeric"
                  maxLength={6}
                />
              </View>

              {/* Botón Login */}
              <TouchableOpacity
                style={[
                  styles.loginButton,
                  loading && styles.loginButtonDisabled,
                ]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#013973" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>
                    Ingresar a Asamblea
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
}

// ========== ESTILOS MODERNOS ==========
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingBottom: THEME.spacing.xl,
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
    opacity: 0.1,
  },
  circle1: {
    width: 200,
    height: 200,
    backgroundColor: COLORS.primary,
    top: -100,
    right: -100,
  },
  circle2: {
    width: 150,
    height: 150,
    backgroundColor: COLORS.primaryLight,
    bottom: -75,
    left: -75,
  },
  circle3: {
    width: 100,
    height: 100,
    backgroundColor: COLORS.primary,
    top: height * 0.3,
    left: -50,
  },
  content: {
    padding: THEME.spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: THEME.spacing.xl * 1.5,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: THEME.spacing.lg,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: THEME.spacing.xs,
  },
  subtitle: {
    fontSize: THEME.fontSize.md,
    color: COLORS.text.secondary,
    textAlign: "center",
    lineHeight: 22,
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
    height: 50,
  },

  inputError: {
    borderColor: "#ef4444",
    backgroundColor: "#fef2f2",
    borderWidth: 2,
  },

  inputIcon: {
    marginRight: THEME.spacing.sm,
  },
  input: {
    flex: 1,
    height: 50,
    color: COLORS.text.primary,
  },
  form: {
    width: "100%",
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.md,
    alignItems: "center",
    marginBottom: THEME.spacing.md,
  },
  loginButtonDisabled: {
    backgroundColor: COLORS.text.muted,
    opacity: 0.6,
  },
  loginButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: THEME.fontSize.md,
  },
});
