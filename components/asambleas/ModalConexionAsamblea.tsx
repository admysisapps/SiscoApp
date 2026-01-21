import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { THEME } from "@/constants/theme";
import { asistenciaService } from "@/services/asistenciaService";
import { apoderadoService } from "@/services/apoderadoService";
import { ApoderadoSession } from "@/types/Apoderado";

interface ModalConexionAsambleaProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (data: any) => void;
  onError?: (error: string) => void;
  asambleaId: number;
  apoderadoSession?: ApoderadoSession;
}

const ModalConexionAsamblea: React.FC<ModalConexionAsambleaProps> = ({
  visible,
  onClose,
  onSuccess,
  onError,
  asambleaId,
  apoderadoSession,
}) => {
  const [step, setStep] = useState<
    "loading" | "success" | "error" | "duplicate"
  >("loading");
  const [registroData, setRegistroData] = useState<any>(null);
  const [countdown, setCountdown] = useState(3);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const countdownScaleAnim = useRef(new Animated.Value(0)).current;
  const countdownOpacityAnim = useRef(new Animated.Value(0)).current;

  const registrarAsistencia = useCallback(async () => {
    try {
      let response;

      if (apoderadoSession) {
        response = await apoderadoService.validarAsistenciaApoderado(
          asambleaId,
          apoderadoSession
        );
      } else {
        response = await asistenciaService.validarAsistencia(asambleaId);
      }

      if (response.success) {
        setRegistroData(response);
        setStep("success");
      } else if (response.error === "No tienes inmuebles disponibles") {
        const observerData = {
          success: true,
          observer_mode: true,
          documento_participante: apoderadoSession?.documento || "usuario",
          coeficiente_total: 0,
          apartamentos_count: 0,
          apartamentos_numeros: [],
        };
        setRegistroData(observerData);
        setStep("success");
      } else {
        if (
          response.error &&
          response.error.includes("Duplicate entry") &&
          response.error.includes("unique_apartamento_asamblea")
        ) {
          setErrorMessage("Este inmueble ya está registrado en la asamblea");
          setStep("duplicate");
        } else if (apoderadoSession && onError) {
          onError(response.error || "Error al registrar asistencia");
          onClose();
        } else {
          setErrorMessage(response.error || "Error al registrar asistencia");
          setStep("error");
        }
      }
    } catch {
      if (apoderadoSession && onError) {
        onError("Error de conexión");
        onClose();
      } else {
        setErrorMessage(
          "No se pudo conectar con el servidor. Verifica tu conexión a internet."
        );
        setStep("error");
      }
    }
  }, [asambleaId, apoderadoSession, onError, onClose]);

  useEffect(() => {
    if (visible) {
      setStep("loading");
      setCountdown(3);
      setRegistroData(null);

      // Animación de entrada
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const doRegistration = async () => {
        try {
          let response;

          if (apoderadoSession) {
            response = await apoderadoService.validarAsistenciaApoderado(
              asambleaId,
              apoderadoSession
            );
          } else {
            response = await asistenciaService.validarAsistencia(asambleaId);
          }

          if (response.success) {
            if (apoderadoSession) {
              await AsyncStorage.setItem(
                "user_context",
                JSON.stringify({
                  documento: apoderadoSession.documento,
                  copropiedad: apoderadoSession.copropiedad,
                  nombre_completo: apoderadoSession.nombre,
                })
              );
            }
            setRegistroData(response);
            setStep("success");
          } else if (response.error === "No tienes inmuebles disponibles") {
            const observerData = {
              success: true,
              observer_mode: true,
              documento_participante: apoderadoSession?.documento || "usuario",
              coeficiente_total: 0,
              apartamentos_count: 0,
              apartamentos_numeros: [],
            };
            setRegistroData(observerData);
            setStep("success");
          } else {
            if (
              response.error &&
              response.error.includes("Duplicate entry") &&
              response.error.includes("unique_apartamento_asamblea")
            ) {
              setErrorMessage(
                "Este inmueble ya está registrado en la asamblea"
              );
              setStep("duplicate");
            } else if (apoderadoSession && onError) {
              onError(response.error || "Error al registrar asistencia");
              onClose();
            } else {
              setErrorMessage(
                response.error || "Error al registrar asistencia"
              );
              setStep("error");
            }
          }
        } catch {
          if (apoderadoSession && onError) {
            onError("Error de conexión");
            onClose();
          } else {
            setErrorMessage(
              "No se pudo conectar con el servidor. Verifica tu conexión a internet."
            );
            setStep("error");
          }
        }
      };

      doRegistration();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [
    visible,
    asambleaId,
    apoderadoSession,
    onError,
    onClose,
    scaleAnim,
    fadeAnim,
  ]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (step === "loading") {
      const startPulse = () => {
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]).start(() => startPulse());
      };
      startPulse();
    }

    if (step === "success" && countdown > 0) {
      // Animación cinematográfica del contador
      countdownScaleAnim.setValue(0);
      countdownOpacityAnim.setValue(0);

      Animated.parallel([
        Animated.spring(countdownScaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.timing(countdownOpacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(countdownScaleAnim, {
            toValue: 1.5,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(countdownOpacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setCountdown((prev) => prev - 1);
        });
      }, 700);
    } else if (step === "success" && countdown === 0 && registroData) {
      onSuccess(registroData);
      onClose();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [
    step,
    countdown,
    onSuccess,
    onClose,
    registroData,
    pulseAnim,
    countdownScaleAnim,
    countdownOpacityAnim,
  ]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          {step === "loading" && (
            <Animated.View
              style={[styles.content, { transform: [{ scale: pulseAnim }] }]}
            >
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
              </View>
              <Text style={styles.title}>Conectando a la asamblea</Text>
              <Text style={styles.subtitle}>Un momento por favor...</Text>
            </Animated.View>
          )}

          {step === "success" && registroData && (
            <View style={styles.content}>
              <View style={styles.successIconContainer}>
                <LottieView
                  source={require("@/assets/lottie/conexionAsamblea.json")}
                  autoPlay
                  loop={false}
                  renderMode="HARDWARE"
                  cacheComposition={true}
                  hardwareAccelerationAndroid={true}
                  style={styles.lottieSuccess}
                />
              </View>
              <Text style={styles.title}>
                {registroData.observer_mode
                  ? "Modo Observador"
                  : "¡Asistencia registrada!"}
              </Text>

              {registroData.observer_mode ? (
                <View style={styles.observerContainer}>
                  <View style={styles.observerIconCircle}>
                    <Ionicons
                      name="people-outline"
                      size={28}
                      color={THEME.colors.warning}
                    />
                  </View>
                  <Text style={styles.observerTitle}>
                    Has otorgado poder de tus inmuebles
                  </Text>
                </View>
              ) : (
                <View style={styles.statsContainer}>
                  <View style={styles.statBox}>
                    <Text style={styles.statNumber}>
                      {registroData.apartamentos_count}
                    </Text>
                    <Text style={styles.statLabel}>
                      Inmueble{registroData.apartamentos_count !== 1 ? "s" : ""}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBox}>
                    <Text style={styles.statNumber}>
                      {(registroData.coeficiente_total * 100).toFixed(2)}%
                    </Text>
                    <Text style={styles.statLabel}>Coeficiente</Text>
                  </View>
                </View>
              )}

              {!registroData.observer_mode && (
                <View style={styles.inmueblesChip}>
                  <Text style={styles.inmueblesText}>
                    {registroData.apartamentos_numeros?.join(", ")}
                  </Text>
                </View>
              )}

              <View style={styles.countdownContainer}>
                <Animated.View
                  style={[
                    styles.countdownCircle,
                    {
                      transform: [{ scale: countdownScaleAnim }],
                      opacity: countdownOpacityAnim,
                    },
                  ]}
                >
                  <Text style={styles.countdownNumber}>{countdown}</Text>
                </Animated.View>
              </View>
            </View>
          )}

          {step === "error" && (
            <View style={styles.content}>
              <View style={styles.errorIconContainer}>
                <Ionicons
                  name="alert-circle"
                  size={72}
                  color={THEME.colors.error}
                />
              </View>
              <Text style={styles.title}>Error de conexión</Text>
              <Text style={styles.subtitle}>
                {errorMessage ||
                  "No se pudo registrar tu asistencia. Verifica tu conexión a internet."}
              </Text>
              <TouchableOpacity
                onPress={registrarAsistencia}
                style={styles.retryButton}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="refresh"
                  size={20}
                  color="white"
                  style={styles.retryIcon}
                />
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === "duplicate" && (
            <View style={styles.content}>
              <View style={styles.errorIconContainer}>
                <Ionicons
                  name="warning"
                  size={72}
                  color={THEME.colors.warning}
                />
              </View>
              <Text style={styles.title}>Inmueble ya registrado</Text>
              <Text style={styles.subtitle}>{errorMessage}</Text>
              <TouchableOpacity
                onPress={onClose}
                style={[
                  styles.retryButton,
                  { backgroundColor: THEME.colors.warning },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="checkmark"
                  size={20}
                  color="white"
                  style={styles.retryIcon}
                />
                <Text style={styles.retryButtonText}>Entendido</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: THEME.colors.modalOverlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    width: "85%",
    maxWidth: 340,
  },

  content: {
    alignItems: "center",
    paddingTop: THEME.spacing.lg,
    width: "100%",
  },
  loadingContainer: {
    alignItems: "center",
    marginBottom: THEME.spacing.lg,
  },
  successIconContainer: {
    marginBottom: THEME.spacing.sm,
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  lottieSuccess: {
    width: 250,
    height: 250,
  },
  errorIconContainer: {
    marginBottom: THEME.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: THEME.spacing.lg,
    width: "100%",
  },
  statBox: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: "700",
    color: THEME.colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: THEME.colors.border,
    marginHorizontal: THEME.spacing.md,
  },
  inmueblesChip: {
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.borderRadius.lg,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    marginBottom: THEME.spacing.lg,
  },
  inmueblesText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.primary,
    fontWeight: "600",
    textAlign: "center",
  },
  observerContainer: {
    alignItems: "center",
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.sm,
    width: "100%",
  },
  observerIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFF3CD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: THEME.spacing.md,
  },
  observerTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.heading,
    textAlign: "center",
    marginBottom: THEME.spacing.sm,
  },
  countdownContainer: {
    alignItems: "center",
  },
  countdownCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: THEME.colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: THEME.spacing.md,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: "900",
    color: "white",
  },
  countdownText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    fontStyle: "italic",
  },
  retryButton: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: THEME.spacing.xl,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    marginTop: THEME.spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  retryIcon: {
    marginRight: THEME.spacing.sm,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: THEME.fontSize.md,
  },
});

export default ModalConexionAsamblea;
