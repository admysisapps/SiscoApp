import React, { useState, useEffect, useRef } from "react";
import { Feather, Ionicons } from "@expo/vector-icons";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { COLORS, THEME } from "@/constants/theme";
import { projectService, ProjectInfo } from "@/services/proyectosService";
import { router } from "expo-router";
import { useProject } from "@/contexts/ProjectContext";
import { useUser } from "@/contexts/UserContext";
import LoadingOverlay from "@/components/LoadingOverlay";
import { notificationService } from "@/services/notificacionesService";

interface UnirseProyectoModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function UnirseProyectoModal({
  visible,
  onClose,
  onSuccess,
  onError,
}: UnirseProyectoModalProps) {
  const { reloadProjects } = useProject();
  const { user } = useUser();
  const [codigoInvitacion, setCodigoInvitacion] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"input" | "confirm">("input");
  const [projectInfo, setProjectInfo] = useState<ProjectInfo | null>(null);

  const [inputError, setInputError] = useState("");

  const spinValue = useRef(new Animated.Value(0)).current;
  const scaleValue = useRef(new Animated.Value(1)).current;
  const animationsRef = useRef<{ spin?: any; pulse?: any }>({});

  useEffect(() => {
    // Detener animaciones anteriores
    if (animationsRef.current.spin) {
      animationsRef.current.spin.stop();
    }
    if (animationsRef.current.pulse) {
      animationsRef.current.pulse.stop();
    }

    if (visible && step === "input") {
      // Reset valores animados
      spinValue.setValue(0);
      scaleValue.setValue(1);

      // Animación de rotación continua
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        { iterations: -1 }
      );

      // Animación de pulso sutil
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(scaleValue, {
            toValue: 1.05,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(scaleValue, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      );

      animationsRef.current.spin = spinAnimation;
      animationsRef.current.pulse = pulseAnimation;

      // Copiar referencias para el cleanup
      const spin = spinAnimation;
      const pulse = pulseAnimation;

      spinAnimation.start();
      pulseAnimation.start();

      return () => {
        spin?.stop();
        pulse?.stop();
      };
    } else if (step === "confirm") {
      // Detener animaciones y resetear valores para el paso de confirmación
      spinValue.setValue(0);
      scaleValue.setValue(1);
    }
  }, [visible, step, spinValue, scaleValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handleClose = () => {
    setCodigoInvitacion("");
    setStep("input");

    setInputError("");
    onClose();
  };

  const handleVerificarCodigo = async () => {
    setInputError("");

    if (!codigoInvitacion.trim()) {
      setInputError("Ingresa el código de copropiedad");
      return;
    }

    if (codigoInvitacion.length < 6) {
      setInputError("El código debe tener al menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const response =
        await projectService.verificarCodigoInvitacion(codigoInvitacion);

      if (response.success) {
        if (response.yaUnido) {
          // Usuario ya está unido - mostrar toast
          setLoading(false);
          onError("Ya perteneces a este proyecto");
          handleClose();
        } else if (response.proyecto) {
          // Mostrar info del proyecto para confirmar
          setProjectInfo(response.proyecto);
          setStep("confirm");
          setLoading(false);
        }
      } else {
        setLoading(false);
        setInputError(response.error || "Código de copropiedad inválido");
      }
    } catch {
      setLoading(false);
      setInputError("Error verificando código. Inténtalo de nuevo");
    }
  };

  const handleConfirmarUnion = async () => {
    setLoading(true);
    try {
      // Guardar contexto temporal con documento y email antes de unirse
      const AsyncStorage = (
        await import("@react-native-async-storage/async-storage")
      ).default;
      const tempContext = {
        documento: user?.documento,
        email: user?.email,
      };
      await AsyncStorage.setItem("user_context", JSON.stringify(tempContext));

      const response = await projectService.unirseAProyecto(codigoInvitacion);

      if (response.success) {
        console.log("Usuario unido exitosamente al proyecto");

        // Recargar proyectos y navegar (mantiene loading activo)
        await reloadProjects();
        router.replace("/project-selector");

        // Registrar notificaciones en background
        setTimeout(async () => {
          try {
            const documento = user?.documento;
            const proyectoNit = projectInfo?.nit;
            const proyectoNombre = projectInfo?.nombre;

            console.log(
              " Registrando notificaciones para:",
              documento,
              "en proyecto:",
              proyectoNombre
            );

            if (documento && proyectoNit) {
              // Configurar FCM si no existe
              if (!notificationService.getToken()) {
                await notificationService.setupNotifications();
              }

              // Registrar en el nuevo proyecto
              const registered =
                await notificationService.registerTokenForNewProject(
                  documento,
                  proyectoNit
                );
              console.log(
                " Resultado notificaciones:",
                registered ? "ÉXITO" : "FALLÓ"
              );

              // Enviar notificación de bienvenida al nuevo proyecto
              if (proyectoNombre) {
                await notificationService.sendWelcomeToNewProjectNotification(
                  proyectoNombre
                );
              }
            }
          } catch {}
        }, 1000);
      } else {
        // Manejar errores específicos
        let errorMessage = response.error || "Error uniéndose al proyecto";

        if (response.error === "Código de invitación inválido") {
          errorMessage = "Código de copropiedad inválido";
        } else if (
          response.error === "Usuario no encontrado en este proyecto"
        ) {
          errorMessage = "No estás registrado en este proyecto";
        } else if (
          response.error === "Usuario deshabilitado en este proyecto"
        ) {
          errorMessage = "Tu acceso a este proyecto está deshabilitado";
        }

        onError(errorMessage);
        handleClose();
      }
    } catch {
      onError("Error de conexión. Inténtalo de nuevo");
      handleClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <LoadingOverlay visible={loading} message="Procesando..." />

      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.modal}>
              {/* Header */}
              <View style={styles.header}></View>

              <View style={styles.iconContainer}>
                {step === "input" ? (
                  <Animated.View
                    style={[
                      styles.iconBackground,
                      styles.iconBackgroundAnimated,
                      {
                        transform: [{ rotate: spin }, { scale: scaleValue }],
                      },
                    ]}
                  >
                    <View style={styles.iconInner}>
                      <Feather
                        name="compass"
                        size={28}
                        color={THEME.colors.primary}
                      />
                    </View>
                  </Animated.View>
                ) : (
                  <View
                    style={[
                      styles.iconBackground,
                      styles.iconBackgroundSuccess,
                    ]}
                  >
                    <View style={styles.iconInner}>
                      <Feather
                        name="check-circle"
                        size={28}
                        color={THEME.colors.success}
                      />
                    </View>
                  </View>
                )}
              </View>

              <Text style={styles.title}>
                {step === "input" ? "Unirse a Proyecto" : "¡Perfecto!"}
              </Text>

              {step === "input" ? (
                // PASO 1: Ingresar código
                <>
                  <Text style={styles.description}>
                    Ingresa el código de copropiedad.
                  </Text>

                  <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>
                      Código de copropiedad:
                    </Text>
                    <View
                      style={[
                        styles.inputContainer,
                        inputError && styles.inputError,
                      ]}
                    >
                      <Ionicons
                        name="key-outline"
                        size={20}
                        color={
                          inputError ? COLORS.error : COLORS.text.secondary
                        }
                        style={styles.inputIcon}
                      />
                      <TextInput
                        style={styles.input}
                        placeholder="Código"
                        placeholderTextColor={COLORS.text.muted}
                        value={codigoInvitacion}
                        onChangeText={(text) => {
                          setCodigoInvitacion(text.toUpperCase());
                          if (inputError) setInputError("");
                        }}
                        autoCapitalize="characters"
                        maxLength={8}
                      />
                    </View>
                    {inputError && (
                      <Text style={styles.errorText}>{inputError}</Text>
                    )}
                  </View>

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={handleClose}
                    >
                      <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.button, styles.primaryButton]}
                      onPress={handleVerificarCodigo}
                    >
                      <Text style={styles.primaryButtonText}>Verificar</Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : (
                // PASO 2: Confirmar unión
                <>
                  <View style={styles.projectInfo}>
                    <Text style={styles.confirmText}>
                      Te vas a unir al proyecto:
                    </Text>
                    <View style={styles.projectCard}>
                      <View style={styles.projectDetails}>
                        <Text style={styles.projectName}>
                          {projectInfo?.nombre}
                        </Text>
                        <Text style={styles.projectNit}>
                          NIT: {projectInfo?.nit}
                        </Text>
                      </View>
                    </View>
                    {projectInfo?.descripcion && (
                      <Text style={styles.projectDescription}>
                        {projectInfo.descripcion}
                      </Text>
                    )}
                    <Text style={styles.confirmSubtext}>
                      Tendrás acceso a todas las funciones de la copropiedad
                    </Text>
                  </View>

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity
                      style={[styles.button, styles.cancelButton]}
                      onPress={() => setStep("input")}
                    >
                      <Text style={styles.cancelButtonText}>Volver</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.button, styles.successButton]}
                      onPress={handleConfirmarUnion}
                    >
                      <Text style={styles.successButtonText}>Unirse</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: THEME.colors.modalOverlay,
  },
  keyboardView: {
    flex: 1,
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: THEME.spacing.lg,
  },
  modal: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 24,
    paddingTop: 20,
    paddingBottom: 30,
    paddingHorizontal: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.35,
    shadowRadius: 35,
    elevation: 20,
    width: 350,
    maxWidth: "90%",
  },
  header: {
    alignItems: "flex-end",
    marginBottom: 10,
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  iconBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconBackgroundAnimated: {
    borderColor: THEME.colors.border,
    borderTopColor: THEME.colors.primary,
    borderRightColor: THEME.colors.primary,
  },
  iconBackgroundSuccess: {
    borderColor: THEME.colors.success,
    shadowColor: THEME.colors.success,
  },
  iconInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
    color: THEME.colors.text.heading,
    textAlign: "center",
    marginBottom: 8,
  },

  description: {
    fontSize: 16,
    color: THEME.colors.text.secondary,
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 22,
  },
  inputSection: {
    marginBottom: 30,
  },
  inputLabel: {
    fontSize: 17,
    color: THEME.colors.text.heading,
    marginBottom: 8,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    backgroundColor: THEME.colors.surface,
  },
  inputIcon: {
    marginLeft: 16,
    marginRight: 12,
  },
  inputError: {
    borderColor: THEME.colors.error,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    fontSize: 17,
    color: THEME.colors.text.heading,
    fontWeight: "400",
    letterSpacing: 1,
  },
  errorText: {
    color: THEME.colors.error,
    fontSize: 15,
    marginTop: 8,
    marginLeft: 4,
  },
  projectInfo: {
    alignItems: "center",
    marginBottom: 30,
  },
  projectCard: {
    backgroundColor: THEME.colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginVertical: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  projectDetails: {
    alignItems: "center",
  },
  projectName: {
    fontSize: 17,
    fontWeight: "600",
    color: THEME.colors.primary,
    textAlign: "center",
  },
  projectNit: {
    fontSize: 14,
    fontWeight: "500",
    color: THEME.colors.text.secondary,
    marginTop: 4,
    textAlign: "center",
  },
  projectDescription: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    textAlign: "center",
    marginTop: 8,
    fontStyle: "italic",
  },
  confirmText: {
    fontSize: 17,
    color: THEME.colors.text.heading,
    textAlign: "center",
    fontWeight: "400",
  },
  confirmSubtext: {
    fontSize: 15,
    color: THEME.colors.text.secondary,
    textAlign: "center",
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: THEME.colors.surfaceLight,
  },
  cancelButtonText: {
    color: THEME.colors.text.heading,
    fontSize: 17,
    fontWeight: "400",
  },
  primaryButton: {
    backgroundColor: THEME.colors.primary,
  },
  primaryButtonText: {
    color: THEME.colors.text.inverse,
    fontSize: 17,
    fontWeight: "600",
  },
  successButton: {
    backgroundColor: THEME.colors.success,
  },
  successButtonText: {
    color: THEME.colors.text.inverse,
    fontSize: 17,
    fontWeight: "600",
  },
});
