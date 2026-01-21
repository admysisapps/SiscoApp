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
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { THEME } from "@/constants/theme";
import { asistenciaService } from "@/services/asistenciaService";

interface ModalConexionAsambleaAdminProps {
  visible: boolean;
  onClose: () => void;
  asambleaId: number;
  onSuccess?: () => void;
}

const ModalConexionAsambleaAdmin: React.FC<ModalConexionAsambleaAdminProps> = ({
  visible,
  onClose,
  asambleaId,
  onSuccess,
}) => {
  const [step, setStep] = useState<"loading" | "success" | "error">("loading");
  const [registroData, setRegistroData] = useState<any>(null);
  const [countdown, setCountdown] = useState(2);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const countdownScaleAnim = useRef(new Animated.Value(0)).current;
  const countdownOpacityAnim = useRef(new Animated.Value(0)).current;

  const registrarAsistencia = useCallback(async () => {
    try {
      setStep("loading");
      const response = await asistenciaService.validarAsistencia(asambleaId);
      setRegistroData(response);
      setStep("success");
    } catch (error) {
      setStep("error");
      console.error("Error registrando asistencia admin:", error);
    }
  }, [asambleaId]);

  useEffect(() => {
    if (visible) {
      setStep("loading");
      setCountdown(2);
      setRegistroData(null);

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

      registrarAsistencia();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible, registrarAsistencia, scaleAnim, fadeAnim]);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (step === "success" && countdown > 0) {
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
      router.replace({
        pathname: "/(admin)/(asambleas)/asamblea-moderacion",
        params: {
          asambleaId: asambleaId.toString(),
          registroData: JSON.stringify(registroData),
        },
      });
      onSuccess?.();
      onClose();
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [
    step,
    countdown,
    registroData,
    asambleaId,
    onClose,
    onSuccess,
    countdownScaleAnim,
    countdownOpacityAnim,
  ]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
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
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons
              name="close"
              size={24}
              color={THEME.colors.text.secondary}
            />
          </TouchableOpacity>

          {step === "loading" && (
            <View style={styles.content}>
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={THEME.colors.primary} />
              </View>
              <Text style={styles.title}>Iniciando moderación</Text>
              <Text style={styles.subtitle}>Un momento por favor...</Text>
            </View>
          )}

          {step === "success" && registroData && (
            <View style={styles.content}>
              <View style={styles.successIconContainer}>
                <LottieView
                  source={require("@/assets/lottie/conexionAsamblea.json")}
                  autoPlay
                  renderMode="HARDWARE"
                  cacheComposition={true}
                  hardwareAccelerationAndroid={true}
                  loop={false}
                  style={styles.lottieSuccess}
                />
              </View>
              <Text style={styles.title}>¡Moderación iniciada!</Text>

              {registroData.apartamentos_count > 0 ? (
                <>
                  <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                      <Text style={styles.statNumber}>
                        {registroData.apartamentos_count}
                      </Text>
                      <Text style={styles.statLabel}>
                        Inmueble
                        {registroData.apartamentos_count !== 1 ? "s" : ""}
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

                  <View style={styles.inmueblesChip}>
                    <Text style={styles.inmueblesText}>
                      {registroData.apartamentos_numeros?.join(", ")}
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.observerContainer}>
                  <View style={styles.observerIconCircle}>
                    <Ionicons
                      name="shield-checkmark-outline"
                      size={28}
                      color={THEME.colors.primary}
                    />
                  </View>
                  <Text style={styles.observerTitle}>
                    Acceso como administrador
                  </Text>
                  <Text style={styles.observerDescription}>
                    Podrás moderar la asamblea sin representar inmuebles.
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
                No se pudo iniciar la moderación. Verifica tu conexión a
                internet.
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={registrarAsistencia}
                style={styles.touchable}
              >
                <LinearGradient
                  colors={["#5B9FED", "#2563EB", "#1E40AF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.retryButton}
                >
                  <Ionicons name="refresh" size={20} color="white" />
                  <Text style={styles.retryButtonText}>Reintentar</Text>
                </LinearGradient>
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
  closeButton: {
    position: "absolute",
    top: THEME.spacing.md,
    right: THEME.spacing.md,
    padding: THEME.spacing.sm,
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
    backgroundColor: "#E0F2FE",
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
  observerDescription: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: THEME.spacing.md,
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
  touchable: {
    borderRadius: THEME.borderRadius.md,
    overflow: "hidden",
    marginTop: THEME.spacing.xl,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: THEME.spacing.xl,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    gap: THEME.spacing.sm,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: THEME.fontSize.md,
  },
});

export default ModalConexionAsambleaAdmin;
