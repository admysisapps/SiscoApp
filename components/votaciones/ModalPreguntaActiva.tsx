import React, { useEffect, useState } from "react";
import { Ionicons, Octicons } from "@expo/vector-icons";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  AppState,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { THEME } from "@/constants/theme";
import { votacionesService } from "@/services/votacionesService";

const { height } = Dimensions.get("window");

interface Opcion {
  id: number;
  opcion: string;
}

interface PreguntaActiva {
  id: number;
  pregunta: string;
  tipo_pregunta: "si_no" | "multiple";
  opciones: Opcion[];
  segundos_restantes: number;
  ya_voto?: boolean;
}

interface ModalPreguntaActivaProps {
  visible: boolean;
  pregunta: PreguntaActiva | null;
  onClose: () => void;
  onVotar?: (opcionId: number) => void;
}

export const ModalPreguntaActiva: React.FC<ModalPreguntaActivaProps> = ({
  visible,
  pregunta,
  onClose,
  onVotar,
}) => {
  const insets = useSafeAreaInsets();
  const [slideAnim] = useState(new Animated.Value(height));
  const [timeLeft, setTimeLeft] = useState(0);
  const [votando, setVotando] = useState(false);
  const [preguntaFinalizada, setPreguntaFinalizada] = useState(false);
  const [errorVoto, setErrorVoto] = useState<string | null>(null);
  const onCloseRef = React.useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (visible && pregunta) {
      setPreguntaFinalizada(false);
      setTimeLeft(pregunta.segundos_restantes);

      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, pregunta, slideAnim]);

  useEffect(() => {
    if (!visible || !pregunta || preguntaFinalizada) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimeout(() => onCloseRef.current(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, pregunta, preguntaFinalizada]);

  useEffect(() => {
    if (!visible) return;

    const subscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        onCloseRef.current();
      }
    });

    return () => subscription.remove();
  }, [visible]);

  useEffect(() => {
    if (preguntaFinalizada) {
      const timeout = setTimeout(() => {
        onCloseRef.current();
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [preguntaFinalizada]);

  const handleVotar = async (opcionId: number) => {
    if (votando || !pregunta || pregunta.ya_voto || preguntaFinalizada) return;

    setErrorVoto(null); // Limpiar error anterior
    console.log("[ModalPreguntaActiva] Registrando voto:", {
      pregunta_id: pregunta.id,
      opcion_id: opcionId,
    });

    setVotando(true);
    try {
      const response = await votacionesService.registrarVoto(
        pregunta.id,
        opcionId
      );

      console.log("[ModalPreguntaActiva] Respuesta del voto:", response);

      if (response.success) {
        onVotar?.(opcionId);
        onClose();
      } else {
        const errorMsg = response.error || "Error al registrar voto";
        const lowerMsg = errorMsg.toLowerCase();

        // Detectar si la pregunta finalizó
        if (
          lowerMsg.includes("finalizada") ||
          lowerMsg.includes("cerrada") ||
          lowerMsg.includes("no existe") ||
          lowerMsg.includes("no encontrada") ||
          lowerMsg.includes("no está activa") ||
          lowerMsg.includes("expirado") ||
          lowerMsg.includes("tiempo")
        ) {
          console.log("[ModalPreguntaActiva] Pregunta finalizada detectada");
          setPreguntaFinalizada(true);
        } else {
          // Otros errores (ya votó, no registrado, etc.)
          setErrorVoto(errorMsg);
        }
      }
    } catch (error: any) {
      console.error("[ModalPreguntaActiva] Error al registrar voto:", error);
      setErrorVoto("Error de conexión. Intenta nuevamente.");
    } finally {
      setVotando(false);
    }
  };

  if (!pregunta) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLowTime = timeLeft <= 30;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }],
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Octicons
                name="question"
                size={24}
                color={THEME.colors.primary}
              />
              <Text style={styles.headerTitle}>Pregunta Activa</Text>
            </View>
            <View style={[styles.timer, isLowTime && styles.timerWarning]}>
              <Ionicons
                name="timer-outline"
                size={18}
                color={isLowTime ? "#EF4444" : "#10B981"}
              />
              <Text
                style={[styles.timerText, isLowTime && styles.timerTextWarning]}
              >
                {minutes}:{seconds.toString().padStart(2, "0")}
              </Text>
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.pregunta}>{pregunta.pregunta}</Text>

            {preguntaFinalizada && (
              <View style={styles.preguntaFinalizadaContainer}>
                <Ionicons name="warning" size={20} color="#F59E0B" />
                <Text style={styles.preguntaFinalizadaText}>
                  El administrador cerró esta pregunta
                </Text>
              </View>
            )}

            {errorVoto && !preguntaFinalizada && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text style={styles.errorText}>{errorVoto}</Text>
              </View>
            )}

            {pregunta.ya_voto && !preguntaFinalizada && !errorVoto && (
              <View style={styles.yaVotoContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.yaVotoText}>
                  Ya has votado en esta pregunta
                </Text>
              </View>
            )}

            <ScrollView
              style={styles.opcionesContainer}
              contentContainerStyle={[
                styles.opcionesContent,
                { paddingBottom: insets.bottom || 20 },
              ]}
              showsVerticalScrollIndicator={true}
            >
              {pregunta.opciones.map((opcion) => (
                <TouchableOpacity
                  key={opcion.id}
                  style={[
                    styles.opcionButton,
                    (votando || pregunta.ya_voto || preguntaFinalizada) &&
                      styles.opcionButtonDisabled,
                  ]}
                  onPress={() => handleVotar(opcion.id)}
                  activeOpacity={0.7}
                  disabled={votando || pregunta.ya_voto || preguntaFinalizada}
                >
                  <Text style={styles.opcionText}>{opcion.opcion}</Text>
                  {votando && (
                    <ActivityIndicator
                      size="small"
                      color={THEME.colors.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.8,
    paddingBottom: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
  },
  timer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B98120",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  timerWarning: {
    backgroundColor: "#EF444420",
  },
  timerText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#10B981",
  },
  timerTextWarning: {
    color: "#EF4444",
  },
  content: {
    padding: 20,
  },
  pregunta: {
    fontSize: 17,
    fontWeight: "600",
    color: "#0F172A",
    lineHeight: 24,
    marginBottom: 20,
  },
  opcionesContainer: {
    maxHeight: height * 0.5,
  },
  opcionesContent: {
    gap: 12,
    paddingTop: 8,
  },
  opcionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  opcionButtonDisabled: {
    opacity: 0.5,
  },
  opcionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#0F172A",
    flex: 1,
  },
  yaVotoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B98120",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  yaVotoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
  },
  preguntaFinalizadaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#F59E0B",
  },
  preguntaFinalizadaText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#D97706",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#DC2626",
  },
});
