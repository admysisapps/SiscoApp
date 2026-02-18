import React, { useEffect, useState, useRef, useCallback } from "react";
import { Ionicons, Octicons } from "@expo/vector-icons";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  AppState,
  PanResponder,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { THEME } from "@/constants/theme";
import { votacionesService } from "@/services/votacionesService";
import { TimerView } from "./base/TimerView";
import { OpcionItem } from "./base/OpcionItem";
import { PreguntaActiva } from "@/types/Votaciones";

const { height } = Dimensions.get("window");

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
  const slideAnim = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [votando, setVotando] = useState(false);
  const [preguntaFinalizada, setPreguntaFinalizada] = useState(false);
  const [errorVoto, setErrorVoto] = useState<string | null>(null);

  useEffect(() => {
    if (visible && pregunta) {
      setPreguntaFinalizada(false);
      setErrorVoto(null);
      slideAnim.setValue(height);
      backdropOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 30,
          stiffness: 250,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, pregunta, slideAnim, backdropOpacity]);

  useEffect(() => {
    if (!visible) return;

    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") onClose();
    });

    return () => sub.remove();
  }, [visible, onClose]);

  const handleVotar = useCallback(
    async (opcionId: number) => {
      if (votando || !pregunta || pregunta.ya_voto || preguntaFinalizada)
        return;

      setErrorVoto(null);
      setVotando(true);
      try {
        const response = await votacionesService.registrarVoto(
          pregunta.id,
          opcionId
        );

        if (response.success) {
          onVotar?.(opcionId);
          onClose();
        } else {
          const errorMsg = response.error || "Error al registrar voto";
          const lowerMsg = errorMsg.toLowerCase();

          if (
            lowerMsg.includes("finalizada") ||
            lowerMsg.includes("cerrada") ||
            lowerMsg.includes("no existe") ||
            lowerMsg.includes("no encontrada") ||
            lowerMsg.includes("no está activa") ||
            lowerMsg.includes("expirado") ||
            lowerMsg.includes("tiempo")
          ) {
            setPreguntaFinalizada(true);
          } else {
            setErrorVoto(errorMsg);
          }
        }
      } catch {
        setErrorVoto("Error de conexión. Intenta nuevamente.");
      } finally {
        setVotando(false);
      }
    },
    [votando, pregunta, preguntaFinalizada, onVotar, onClose]
  );

  const handleClose = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  }, [slideAnim, backdropOpacity, onClose]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50 || gestureState.vy > 0.5) {
          handleClose();
        } else {
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!pregunta && !visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity
            style={styles.backdropTouch}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ translateY: slideAnim }],
              paddingBottom: insets.bottom + 10,
            },
          ]}
        >
          <View {...panResponder.panHandlers}>
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
              <TimerView
                initialSeconds={pregunta?.segundos_restantes || 0}
                onTimeUp={handleClose}
                isFinalizada={preguntaFinalizada}
              />
            </View>
          </View>

          <View style={styles.content}>
            <Text style={styles.pregunta}>{pregunta?.pregunta}</Text>

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

            {pregunta?.ya_voto && !preguntaFinalizada && !errorVoto && (
              <View style={styles.yaVotoContainer}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.yaVotoText}>
                  Ya has votado en esta pregunta
                </Text>
              </View>
            )}

            <ScrollView
              style={styles.opcionesContainer}
              contentContainerStyle={{
                paddingTop: 8,
                gap: 12,
                paddingBottom: 40,
              }}
              showsVerticalScrollIndicator={true}
              scrollEventThrottle={16}
            >
              {pregunta?.opciones.map((opcion) => (
                <OpcionItem
                  key={opcion.id}
                  opcion={opcion}
                  disabled={
                    votando || !!pregunta?.ya_voto || preguntaFinalizada
                  }
                  onPress={handleVotar}
                  isVotando={votando}
                />
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
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.colors.modalOverlay,
  },
  backdropTouch: {
    flex: 1,
  },
  container: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.9,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: THEME.colors.border,
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
    borderBottomColor: THEME.colors.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.colors.text.heading,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    flexShrink: 1,
  },
  pregunta: {
    fontSize: 17,
    fontWeight: "600",
    color: THEME.colors.text.heading,
    lineHeight: 24,
    marginBottom: 20,
  },
  opcionesContainer: {
    flexGrow: 0,
    flexShrink: 1,
  },
  yaVotoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.successLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  yaVotoText: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.success,
  },
  preguntaFinalizadaContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.warningLight,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: THEME.colors.warning,
  },
  preguntaFinalizadaText: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.text.warningDark,
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
    borderColor: THEME.colors.error,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.error,
  },
});
