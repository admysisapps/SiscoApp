import React, { useState, useEffect, useRef } from "react";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
  Animated,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { THEME } from "@/constants/theme";
import RepresentacionCard from "@/components/votaciones/base/RepresentacionCard";
import ConexionStatus from "@/components/votaciones/base/ConexionStatus";
import Toast from "@/components/Toast";
import ApoderadosList from "@/components/votaciones/base/ApoderadosList";
import { asistenciaService } from "@/services/asistenciaService";
import { votacionesService } from "@/services/votacionesService";
import { ModalPreguntaActiva } from "@/components/votaciones/ModalPreguntaActiva";
import { ResultadosVotacion } from "@/components/votaciones/base/ResultadosVotacion";
import ScreenHeader from "@/components/shared/ScreenHeader";
import {
  RegistroAsambleaData,
  PreguntaActiva,
  ResultadoPregunta,
  ToastState,
  transformarResultadosAPI,
} from "@/types/Votaciones";

const AsambleaActivaScreen: React.FC = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();

  const [registroData, setRegistroData] = useState<RegistroAsambleaData | null>(
    null
  );
  const [asambleaId, setAsambleaId] = useState<number | null>(null);
  const [isObserver, setIsObserver] = useState<boolean>(false);
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: "",
    type: "success",
  });
  const [canExit, setCanExit] = useState(false);
  const [showPreguntaModal, setShowPreguntaModal] = useState(false);
  const [preguntaActiva, setPreguntaActiva] = useState<PreguntaActiva | null>(
    null
  );
  const [showResultados, setShowResultados] = useState(false);
  const [resultadosData, setResultadosData] = useState<ResultadoPregunta[]>([]);
  const [loadingResultados, setLoadingResultados] = useState(false);
  const [loadingPreguntaActiva, setLoadingPreguntaActiva] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loadingResultados) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [loadingResultados, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  useEffect(() => {
    // Obtener datos de los parámetros de navegación
    if (params.registroData && params.asambleaId) {
      try {
        const data = JSON.parse(params.registroData as string);
        setRegistroData(data);
        setAsambleaId(parseInt(params.asambleaId as string));
        setIsObserver(data.observer_mode || data.apartamentos_count === 0);
      } catch (error) {
        console.error("Error parsing params:", error);
        Alert.alert("Error", "Datos de asamblea inválidos");
        router.back();
      }
    }
  }, [params.registroData, params.asambleaId, router]);

  // Interceptar navegación
  useFocusEffect(
    React.useCallback(() => {
      const onBeforeRemove = (e: any) => {
        if (canExit || isObserver) {
          // Permitir salida si ya fue confirmada o es observador
          return;
        }

        // Prevenir navegación por defecto
        e.preventDefault();

        // Mostrar modal de confirmación
        setShowExitModal(true);
      };

      // Agregar listener de navegación
      const unsubscribe = navigation.addListener(
        "beforeRemove",
        onBeforeRemove
      );

      return () => {
        unsubscribe();
      };
    }, [canExit, isObserver, navigation])
  );

  const handleConnectionChange = (isConnected: boolean) => {
    setToast({
      visible: true,
      message: isConnected ? "Conexión restaurada" : "Sin conexión a internet",
      type: isConnected ? "success" : "error",
    });
  };

  if (!registroData) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["left", "right", "bottom"]}
      >
        <View style={styles.loadingContainer}>
          <Text>Cargando datos de asamblea...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScreenHeader
        title="Asamblea en Curso"
        showBackButton={false}
        rightButton={
          <ConexionStatus onConnectionChange={handleConnectionChange} />
        }
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Resumen de representación */}
        <RepresentacionCard
          coeficienteTotal={registroData.coeficiente_total}
          apartamentosCount={registroData.apartamentos_count}
          apartamentosNumeros={registroData.apartamentos_numeros}
          asambleaId={asambleaId ?? undefined}
          observerMode={isObserver}
        />

        {/* Info disponible para observadores */}
        {isObserver && (
          <>
            <Text style={styles.sectionTitle}>Información disponible</Text>
            <ApoderadosList asambleaId={asambleaId!} />
          </>
        )}

        {/* Acciones disponibles */}
        <View style={styles.actionsCard}>
          <Text style={styles.cardTitle}>
            {isObserver ? "Resultados" : "Acciones disponibles"}
          </Text>

          {isObserver ? (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={async () => {
                if (!showResultados) {
                  setLoadingResultados(true);
                  try {
                    const response = await votacionesService.obtenerResultados(
                      asambleaId!
                    );
                    if (response.success && response.preguntas) {
                      const transformedData = transformarResultadosAPI(
                        response.preguntas
                      );
                      setResultadosData(transformedData);
                    }
                  } catch (error) {
                    console.error("Error obteniendo resultados:", error);
                    setToast({
                      visible: true,
                      message: "Error al cargar resultados",
                      type: "error",
                    });
                  } finally {
                    setLoadingResultados(false);
                  }
                }
                setShowResultados(!showResultados);
              }}
            >
              <Ionicons
                name="stats-chart"
                size={22}
                color={THEME.colors.primary}
              />
              <Text style={styles.actionButtonText}>Ver resultados</Text>
              {loadingResultados ? (
                <Animated.View style={{ transform: [{ rotate: spin }] }}>
                  <Ionicons
                    name="sync"
                    size={22}
                    color={THEME.colors.primary}
                  />
                </Animated.View>
              ) : (
                <Ionicons
                  name={showResultados ? "chevron-up" : "chevron-down"}
                  size={22}
                  color={THEME.colors.primary}
                />
              )}
            </TouchableOpacity>
          ) : (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  router.push(`/votaciones-lista?asambleaId=${asambleaId}`)
                }
              >
                <Ionicons name="list" size={22} color={THEME.colors.primary} />
                <Text style={styles.actionButtonText}>
                  Ver preguntas de votación
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={async () => {
                  if (!asambleaId || loadingPreguntaActiva) return;

                  setLoadingPreguntaActiva(true);
                  try {
                    const response =
                      await votacionesService.obtenerPreguntaActivaAsamblea(
                        asambleaId
                      );
                    if (response.success && response.pregunta_activa) {
                      setPreguntaActiva(response.pregunta_activa);
                      setShowPreguntaModal(true);
                    } else {
                      setToast({
                        visible: true,
                        message: "No hay preguntas activas en este momento",
                        type: "warning",
                      });
                    }
                  } catch {
                    setToast({
                      visible: true,
                      message: "Error al obtener pregunta activa",
                      type: "error",
                    });
                  } finally {
                    setLoadingPreguntaActiva(false);
                  }
                }}
              >
                <FontAwesome5
                  name="vote-yea"
                  size={22}
                  color={THEME.colors.primary}
                />
                <Text style={styles.actionButtonText}>Pregunta activa</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={async () => {
                  if (!showResultados) {
                    setLoadingResultados(true);
                    try {
                      const response =
                        await votacionesService.obtenerResultados(asambleaId!);
                      if (response.success && response.preguntas) {
                        const transformedData = transformarResultadosAPI(
                          response.preguntas
                        );
                        setResultadosData(transformedData);
                      }
                    } catch (error) {
                      console.error("Error obteniendo resultados:", error);
                      setToast({
                        visible: true,
                        message: "Error al cargar resultados",
                        type: "error",
                      });
                    } finally {
                      setLoadingResultados(false);
                    }
                  }
                  setShowResultados(!showResultados);
                }}
              >
                <Ionicons
                  name="stats-chart"
                  size={22}
                  color={THEME.colors.primary}
                />
                <Text style={styles.actionButtonText}>Resultados</Text>
                {loadingResultados ? (
                  <Animated.View style={{ transform: [{ rotate: spin }] }}>
                    <Ionicons
                      name="sync"
                      size={22}
                      color={THEME.colors.primary}
                    />
                  </Animated.View>
                ) : (
                  <Ionicons
                    name={showResultados ? "chevron-up" : "chevron-down"}
                    size={22}
                    color={THEME.colors.primary}
                  />
                )}
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Resultados de votación */}
        {showResultados &&
          (loadingResultados ? (
            <View style={styles.loadingContainer}>
              <Text>Cargando resultados...</Text>
            </View>
          ) : resultadosData.length === 0 ? (
            <ResultadosVotacion
              preguntaTexto="Resultados"
              resultados={[]}
              preguntaId={0}
            />
          ) : (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
            >
              {resultadosData.map((pregunta) => (
                <View key={pregunta.pregunta_id} style={styles.resultadoItem}>
                  <ResultadosVotacion
                    preguntaTexto={pregunta.pregunta_texto}
                    resultados={pregunta.resultados}
                    preguntaId={pregunta.pregunta_id}
                  />
                </View>
              ))}
            </ScrollView>
          ))}
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <ModalPreguntaActiva
        visible={showPreguntaModal}
        pregunta={preguntaActiva}
        onClose={() => setShowPreguntaModal(false)}
        onVotar={(opcionId) => {
          setShowPreguntaModal(false);
          setToast({
            visible: true,
            message: "Voto registrado exitosamente",
            type: "success",
          });
        }}
      />

      <Modal
        visible={showExitModal}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="exit-outline" size={48} color="#F59E0B" />
            <Text style={styles.modalTitle}>Salir de la asamblea</Text>
            <Text style={styles.modalMessage}>
              Se descontará tu participación del quórum. ¿Estás seguro?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowExitModal(false)}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => {
                  setShowExitModal(false);
                  setCanExit(true);
                  router.back();

                  if (asambleaId && !isObserver) {
                    asistenciaService
                      .salirAsamblea(asambleaId)
                      .catch((error) => {
                        console.error("[NAVIGATION] Error al salir:", error);
                      });
                  }
                }}
              >
                <Ionicons name="checkmark" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    padding: THEME.spacing.lg,
  },
  scrollContent: {
    paddingBottom: THEME.spacing.xl * 2,
  },
  statusCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: THEME.colors.success,
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: THEME.spacing.sm,
  },
  statusTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.success,
    marginLeft: THEME.spacing.sm,
  },
  statusSubtitle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
  },
  connectionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: THEME.spacing.sm,
  },
  onlineIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: THEME.colors.success,
    marginRight: THEME.spacing.xs,
  },
  onlineText: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.success,
    fontWeight: "500",
  },

  actionsCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  actionButtonText: {
    flex: 1,
    fontSize: THEME.fontSize.lg,
    color: THEME.colors.text.primary,
    marginLeft: THEME.spacing.md,
  },
  observerActionText: {
    color: THEME.colors.text.secondary,
  },
  cardTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: THEME.spacing.md,
  },
  sectionTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: THEME.colors.text.heading,
    marginBottom: THEME.spacing.md,
  },
  resultadoItem: {
    width: Dimensions.get("window").width - THEME.spacing.lg * 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME.colors.modalOverlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "80%",
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 16,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    backgroundColor: THEME.colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonSecondary: {
    backgroundColor: "#E2E8F0",
  },
});

export default AsambleaActivaScreen;
