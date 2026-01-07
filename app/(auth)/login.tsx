import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/contexts/UserContext";
import { THEME, COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import LoadingOverlay from "@/components/LoadingOverlay";
import ConfirmationModal from "@/components/auth/ConfirmationModal";
import Toast from "@/components/Toast";
import Fontisto from "@expo/vector-icons/Fontisto";
import Entypo from "@expo/vector-icons/Entypo";
import { notificationService } from "@/services/notificacionesService";
import { sessionService } from "@/services/cache/sessionService";
import { asistenciaService } from "@/services/asistenciaService";

const { height } = Dimensions.get("window");

// Helper para construir URL de confirmación
const buildConfirmUrl = (username: string): string => {
  const emailParam = username.includes("@")
    ? `&email=${encodeURIComponent(username)}`
    : "";
  return `/(auth)/confirm?username=${encodeURIComponent(username)}${emailParam}`;
};

const Login = React.memo(function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });
  const [isCheckingSession, setIsCheckingSession] = useState(false);

  const fadeAnim = useMemo(() => new Animated.Value(0), []);
  const slideAnim = useMemo(() => new Animated.Value(30), []);
  const iconPulseAnim = useMemo(() => new Animated.Value(1), []);

  const { login, isLoading: authLoading } = useAuth();
  const { loadUserInfo } = useUser();
  const router = useRouter();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    return () => {};
  }, [fadeAnim, slideAnim]);

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "warning" = "success") => {
      setToast((prev) => {
        if (prev.visible && prev.message === message && prev.type === type) {
          return prev; // Evitar re-render si es el mismo toast
        }
        return { visible: true, message, type };
      });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast((prev) => {
      if (!prev.visible) return prev; // Evitar re-render si ya está oculto
      return { visible: false, message: "", type: "success" };
    });
  }, []);

  const handleLogin = async () => {
    // Limpiar toast anterior
    hideToast();

    // Limpiar espacios en blanco
    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setTimeout(
        () => showToast("Por favor ingresa tu usuario y contraseña", "error"),
        100
      );
      return;
    }

    try {
      const result = await login(cleanUsername, cleanPassword);

      if (result.isSignedIn) {
        // Obtener el username real
        let actualUsername = cleanUsername;
        if (cleanUsername.includes("@")) {
          try {
            const { getCurrentUser } = await import("aws-amplify/auth");
            const currentUser = await getCurrentUser();
            actualUsername = currentUser.username;
          } catch (error) {
            console.error("Error getting current user:", error);
            // Usar el username original si falla
          }
        }

        // Cargar datos del usuario manualmente (sin contexto en login inicial)
        await loadUserInfo(actualUsername, false);

        // Configurar notificaciones silenciosamente
        setTimeout(async () => {
          try {
            await notificationService.setupNotificationsForAllProjects(
              actualUsername
            );
          } catch {
            // Error silencioso
          }
        }, 2000);
      } else if (result.nextStep?.signInStep === "CONFIRM_SIGN_UP") {
        // Usuario necesita confirmar su cuenta
        setShowConfirmModal(true);
        return;
      } else if (result.nextStep?.signInStep === "RESET_PASSWORD") {
        // Usuario debe cambiar contraseña
        setShowPasswordResetModal(true);
        return;
      } else if (
        result.nextStep?.signInStep ===
        "CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED"
      ) {
        // Usuario debe cambiar contraseña (challenge)
        router.push(
          `/(auth)/force-password-change?username=${encodeURIComponent(cleanUsername)}`
        );
        return;
      }
    } catch (error: any) {
      let message = "Error al iniciar sesión";
      let shouldNavigate = false;
      let navigateUrl = "";

      if (error.name === "UserNotConfirmedException") {
        message =
          "Tu cuenta no ha sido confirmada. Te redirigiremos para completar la verificación.";
        shouldNavigate = true;
        navigateUrl = buildConfirmUrl(cleanUsername);
      } else if (
        error.name === "PasswordResetRequiredException" ||
        error.__type === "PasswordResetRequiredException"
      ) {
        message =
          "Debes cambiar tu contraseña. Te redirigiremos para establecer una nueva.";
        shouldNavigate = true;
        navigateUrl = "/(auth)/forgot-password";
      } else if (
        error.name === "NotAuthorizedException" ||
        error.name === "NotAuthorized"
      ) {
        message = "Credenciales incorrectas. Verifica tu usuario y contraseña.";
      } else if (error.name === "UserNotFoundException") {
        message = "Usuario no encontrado. Verifica tu documento de identidad.";
      } else if (error.name === "TooManyRequestsException") {
        message =
          "Demasiados intentos. Espera unos minutos antes de intentar nuevamente.";
      } else if (error.name === "LimitExceededException") {
        message = "Has excedido el límite de intentos. Intenta más tarde.";
      } else if (
        error.name === "NetworkError" ||
        error.message?.includes("Network")
      ) {
        message =
          "Sin conexión a internet. Verifica tu conexión y vuelve a intentar.";
      } else if (
        error.name === "TimeoutError" ||
        error.message?.includes("timeout")
      ) {
        message = "La conexión está muy lenta. Inténtalo de nuevo.";
      }

      // Mostrar toast con delay para evitar conflictos
      setTimeout(() => {
        showToast(message, "error");

        // Navegar después del toast si es necesario
        if (shouldNavigate) {
          setTimeout(() => {
            router.push(navigateUrl as any);
          }, 2000);
        }
      }, 100);
    }
  };

  const handleApoderadoLogin = async () => {
    setIsCheckingSession(true);

    // Iniciar animación de palpitación del ícono
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulseAnim, {
          toValue: 1.3,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(iconPulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Verificar sesión guardada en background
    try {
      const hasSession = await sessionService.hasValidSession();
      if (!hasSession) {
        router.push("/(apoderado)/login");
        return;
      }

      const session = await sessionService.getSession();
      if (!session) {
        router.push("/(apoderado)/login");
        return;
      }

      // Validar sesión con servidor usando login
      const validation = await asistenciaService.validarSesion(
        session.correo,
        session.documento,
        session.codigo_otp,
        session.codigo_copropiedad
      );

      if (validation.success) {
        router.replace(`/(apoderado)/asamblea/${session.asamblea.id}`);
      } else {
        // Sesión inválida, limpiar y ir a login con mensaje
        await sessionService.clearSession();

        // Determinar mensaje según el error
        let mensaje = "";
        const errorMsg = validation.error || "";

        if (errorMsg.includes("finalizado")) {
          mensaje = "La asamblea ya ha finalizado";
        } else if (errorMsg.includes("cancelada")) {
          mensaje = "La asamblea ha sido cancelada";
        } else if (errorMsg.includes("no ha iniciado")) {
          mensaje = "La asamblea aun no ha iniciado";
        } else if (errorMsg.includes("no encontrada")) {
          mensaje = "Sesion expirada";
        } else {
          mensaje = "Sesion invalida";
        }

        router.push({
          pathname: "/(apoderado)/login",
          params: { mensaje },
        });
      }
    } catch (error) {
      console.error("APODERADO_LOGIN: Error verificando sesion -", error);
      // En caso de error, ir al login normal
      router.push("/(apoderado)/login");
    } finally {
      setIsCheckingSession(false);
      iconPulseAnim.stopAnimation();
      iconPulseAnim.setValue(1);
    }
  };

  const handleForgotPassword = () => {
    router.push("/(auth)/forgot-password");
  };

  const handleSignUp = () => {
    router.push("/(auth)/signup");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <LoadingOverlay visible={authLoading} message="Iniciando sesión..." />

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
          {/* HEADER ANIMADO */}
          <Animated.View
            style={[
              styles.header,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <Text style={styles.title}>Bienvenido</Text>
            <Text style={styles.subtitle}>
              Ingresa con tu cuenta de propietario
            </Text>
          </Animated.View>

          {/* FORMULARIO */}
          <View style={styles.form}>
            {/* Input Usuario */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="person-outline"
                size={20}
                color={COLORS.text.secondary}
                style={styles.inputIcon}
              />
              <TextInput
                testID="input-username"
                style={styles.input}
                placeholder="Cédula o correo electrónico"
                placeholderTextColor={COLORS.text.muted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            {/* Input Contraseña */}
            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={COLORS.text.secondary}
                style={styles.inputIcon}
              />
              <TextInput
                testID="input-password"
                style={styles.input}
                placeholder="Contraseña"
                placeholderTextColor={COLORS.text.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                <Entypo
                  name={showPassword ? "lock-open" : "lock"}
                  size={20}
                  color={showPassword ? COLORS.primary : COLORS.text.secondary}
                />
              </TouchableOpacity>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
            >
              <Text style={styles.forgotPasswordText}>
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>

            {/* Botón Login */}
            <TouchableOpacity
              testID="button-login"
              style={styles.loginButton}
              onPress={handleLogin}
            >
              <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
            </TouchableOpacity>

            {/* Sign Up */}
            <TouchableOpacity
              style={styles.signupButton}
              onPress={handleSignUp}
            >
              <Text style={styles.signupButtonText}>
                ¿No tienes cuenta? Regístrate
              </Text>
            </TouchableOpacity>

            {/* SEPARADOR ANIMADO */}
            <Animated.View style={[styles.separator, { opacity: fadeAnim }]}>
              <View style={styles.line} />
              <Text style={styles.separatorText}>o</Text>
              <View style={styles.line} />
            </Animated.View>

            {/* BOTÓN APODERADO ANIMADO */}
            <Animated.View
              style={[
                { opacity: fadeAnim },
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              <TouchableOpacity
                style={styles.apoderadoButton}
                onPress={handleApoderadoLogin}
                disabled={isCheckingSession}
              >
                <Animated.View
                  style={{
                    transform: [{ scale: iconPulseAnim }],
                  }}
                >
                  <Fontisto
                    name="persons"
                    size={20}
                    color={
                      isCheckingSession ? COLORS.primaryLight : COLORS.primary
                    }
                    style={styles.apoderadoIcon}
                  />
                </Animated.View>
                <Text style={styles.apoderadoButtonText}>
                  Ingresar como Apoderado
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Modal de confirmación */}
      <ConfirmationModal
        visible={showConfirmModal}
        title="Cuenta no confirmada"
        message="Tu cuenta no ha sido confirmada. Te guiaremos para completar la verificación."
        confirmText="Continuar"
        onConfirm={() => {
          setShowConfirmModal(false);
          const confirmUrl = buildConfirmUrl(username);
          router.push(confirmUrl as any);
        }}
        onCancel={() => setShowConfirmModal(false)}
      />

      {/* Modal de password reset */}
      <ConfirmationModal
        visible={showPasswordResetModal}
        title="Cambio de contraseña requerido"
        message="Debes cambiar tu contraseña. Te guiaremos para establecer una nueva."
        confirmText="Continuar"
        onConfirm={() => {
          setShowPasswordResetModal(false);
          router.push(`/(auth)/forgot-password`);
        }}
        onCancel={() => setShowPasswordResetModal(false)}
      />

      {/* Toast */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
});

export default Login;

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
    top: height * 0.4,
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
  logoContainer: {
    alignItems: "center",
    marginBottom: THEME.spacing.lg,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  logo: {
    width: 80,
    height: 80,
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
    marginBottom: THEME.spacing.xl,
    textAlign: "center",
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: THEME.spacing.lg,
  },
  forgotPasswordText: {
    color: COLORS.primary,
    fontSize: THEME.fontSize.sm,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.md,
    alignItems: "center",
    marginBottom: THEME.spacing.md,
  },
  loginButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: THEME.fontSize.md,
  },
  signupButton: {
    alignItems: "center",
    marginBottom: THEME.spacing.xl,
  },
  signupButtonText: {
    color: COLORS.primary,
    fontSize: THEME.fontSize.sm,
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: THEME.spacing.lg,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  separatorText: {
    marginHorizontal: THEME.spacing.md,
    color: COLORS.text.secondary,
  },
  apoderadoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  apoderadoIcon: {
    marginRight: THEME.spacing.sm,
  },
  apoderadoButtonText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: THEME.fontSize.md,
  },
  eyeButton: {
    padding: 4,
  },
});
