import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  BackHandler,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { votacionesService } from "@/services/votacionesService";
import { Votacion, PreguntaVotacion } from "@/types/Votaciones";
import Toast from "@/components/Toast";
import { THEME } from "@/constants/theme";
import { ModalPreguntaActiva } from "@/components/votaciones/ModalPreguntaActiva";
import ScreenHeader from "@/components/shared/ScreenHeader";

export default function ControlPreguntas() {
  const { asambleaId, registroData: registroDataParam } =
    useLocalSearchParams();
  const [votaciones, setVotaciones] = useState<Votacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuVisible, setMenuVisible] = useState<number | null>(null);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });
  const [showExitModal, setShowExitModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState<number | null>(
    null
  );
  const [showCancelModal, setShowCancelModal] = useState<number | null>(null);
  const [esApoderado, setEsApoderado] = useState(false);
  const [showVotarModal, setShowVotarModal] = useState(false);
  const [preguntaParaVotar, setPreguntaParaVotar] = useState<any>(null);
  const [preguntasActivadas, setPreguntasActivadas] = useState<{
    [key: number]: {
      duracion: number;
      inicioLocal: number;
    };
  }>({});
  const preguntasActivadasRef = useRef(preguntasActivadas);

  useEffect(() => {
    preguntasActivadasRef.current = preguntasActivadas;
  }, [preguntasActivadas]);

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" = "success"
  ) => {
    setTimeout(() => {
      setToast({ visible: true, message, type });
    }, 0);
  };

  const hideToast = () => {
    setToast({ visible: false, message: "", type: "success" });
  };

  const tienePreguntaActiva = useCallback(() => {
    return votaciones.some((v) =>
      v.preguntas?.some((p) => p.estado === "en_curso")
    );
  }, [votaciones]);

  const handleBack = useCallback(() => {
    if (tienePreguntaActiva()) {
      setShowExitModal(true);
      return true;
    }

    router.back();
    return false;
  }, [tienePreguntaActiva]);

  useFocusEffect(
    useCallback(() => {
      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        handleBack
      );
      return () => backHandler.remove();
    }, [handleBack])
  );

  const cargarVotaciones = useCallback(async () => {
    try {
      const response = await votacionesService.obtenerVotaciones(
        Number(asambleaId)
      );
      if (response.success) {
        // Ordenar preguntas por ID para mantener orden consistente
        const votacionesOrdenadas = response.votaciones.map((v: Votacion) => {
          const preguntasOrdenadas =
            v.preguntas?.sort((a, b) => a.id - b.id) || [];

          return {
            ...v,
            preguntas: preguntasOrdenadas,
          };
        });

        setVotaciones(votacionesOrdenadas);

        // Obtener pregunta activa si existe y no está en estado
        const preguntaActiva = votacionesOrdenadas
          .flatMap((v: Votacion) => v.preguntas || [])
          .find((p: any) => p.estado === "en_curso");

        if (
          preguntaActiva &&
          !preguntasActivadasRef.current[preguntaActiva.id]
        ) {
          try {
            const preguntaResponse =
              await votacionesService.obtenerPreguntaActivaAsamblea(
                Number(asambleaId)
              );

            if (preguntaResponse.success && preguntaResponse.pregunta_activa) {
              setPreguntasActivadas((prev) => ({
                ...prev,
                [preguntaActiva.id]: {
                  duracion: preguntaResponse.pregunta_activa.segundos_restantes,
                  inicioLocal: Date.now(),
                },
              }));
            }
          } catch (error) {
            console.error("Error al obtener pregunta activa:", error);
          }
        }
      } else {
        showToast(
          response.error || "No se pudieron cargar las votaciones",
          "error"
        );
      }
    } catch {
      showToast("Error de conexión al cargar votaciones", "error");
    } finally {
      setLoading(false);
    }
  }, [asambleaId]);

  useEffect(() => {
    cargarVotaciones();
  }, [cargarVotaciones]);

  useEffect(() => {
    if (registroDataParam) {
      try {
        const data = JSON.parse(registroDataParam as string);
        const tieneApartamentos = data.success && data.apartamentos_count > 0;
        setEsApoderado(tieneApartamentos);
      } catch {
        setEsApoderado(false);
      }
    }
  }, [registroDataParam]);

  const activarPregunta = useCallback(
    async (preguntaId: number, force = false) => {
      if (!force && tienePreguntaActiva()) {
        setShowActivateModal(preguntaId);
        return;
      }

      setMenuVisible(null);
      setShowActivateModal(null);
      try {
        const response = await votacionesService.activarPregunta(
          preguntaId,
          "activa"
        );
        if (response.success) {
          // Guardar duración del servidor
          setPreguntasActivadas((prev) => ({
            ...prev,
            [preguntaId]: {
              duracion: response.duracion_segundos,
              inicioLocal: Date.now(),
            },
          }));

          showToast("Pregunta activada exitosamente", "success");
          await cargarVotaciones();

          // Si es apoderado, abrir modal automáticamente
          if (esApoderado) {
            try {
              const preguntaResponse =
                await votacionesService.obtenerPreguntaActivaAsamblea(
                  Number(asambleaId)
                );

              if (
                preguntaResponse.success &&
                preguntaResponse.pregunta_activa
              ) {
                setPreguntaParaVotar(preguntaResponse.pregunta_activa);
                setShowVotarModal(true);
              }
            } catch {
              // Error silencioso
            }
          }
        } else {
          showToast(
            response.error || "No se pudo activar la pregunta",
            "error"
          );
        }
      } catch {
        showToast("Error de conexión al activar pregunta", "error");
      }
    },
    [cargarVotaciones, tienePreguntaActiva, esApoderado, asambleaId]
  );

  const finalizarPregunta = useCallback(
    async (preguntaId: number) => {
      setMenuVisible(null);
      try {
        const response = await votacionesService.finalizarPregunta(preguntaId);
        if (response.success) {
          // Limpiar del estado
          setPreguntasActivadas((prev) => {
            const nuevo = { ...prev };
            delete nuevo[preguntaId];
            return nuevo;
          });

          showToast("Pregunta finalizada exitosamente", "success");
          await cargarVotaciones();
        } else {
          showToast(
            response.error || "No se pudo finalizar la pregunta",
            "error"
          );
        }
      } catch {
        showToast("Error de conexión al finalizar pregunta", "error");
      }
    },
    [cargarVotaciones]
  );

  const finalizarPreguntaRef = useRef(finalizarPregunta);
  useEffect(() => {
    finalizarPreguntaRef.current = finalizarPregunta;
  }, [finalizarPregunta]);

  const cancelarPregunta = useCallback(
    async (preguntaId: number, force = false) => {
      if (!force) {
        setShowCancelModal(preguntaId);
        return;
      }

      setMenuVisible(null);
      setShowCancelModal(null);
      try {
        const response = await votacionesService.cancelarPregunta(preguntaId);
        if (response.success) {
          // Limpiar del estado
          setPreguntasActivadas((prev) => {
            const nuevo = { ...prev };
            delete nuevo[preguntaId];
            return nuevo;
          });

          showToast("Pregunta cancelada exitosamente", "success");
          await cargarVotaciones();
        } else {
          showToast(
            response.error || "No se pudo cancelar la pregunta",
            "error"
          );
        }
      } catch {
        showToast("Error de conexión al cancelar pregunta", "error");
      }
    },
    [cargarVotaciones]
  );

  const CountdownTimer = React.memo(function CountdownTimer({
    preguntaId,
  }: {
    preguntaId: number;
  }) {
    const activacion = preguntasActivadas[preguntaId];
    const finalizadoRef = useRef(false);

    const [timeLeft, setTimeLeft] = useState(() => {
      if (!activacion) return 0;
      const transcurrido = (Date.now() - activacion.inicioLocal) / 1000;
      return Math.max(0, Math.floor(activacion.duracion - transcurrido));
    });

    useEffect(() => {
      if (!activacion) return;
      finalizadoRef.current = false;

      const calculateTimeLeft = () => {
        const transcurrido = (Date.now() - activacion.inicioLocal) / 1000;
        const diff = Math.max(
          0,
          Math.floor(activacion.duracion - transcurrido)
        );
        setTimeLeft(diff);

        if (diff === 0 && !finalizadoRef.current) {
          finalizadoRef.current = true;
          finalizarPreguntaRef.current(preguntaId);
        }
      };

      const interval = setInterval(calculateTimeLeft, 1000);
      return () => clearInterval(interval);
    }, [preguntaId, activacion]);

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const isLowTime = timeLeft <= 30;

    if (timeLeft === 0 || !activacion) return null;

    return (
      <View style={[styles.countdown, isLowTime && styles.countdownWarning]}>
        <Ionicons
          name="timer-outline"
          size={16}
          color={isLowTime ? THEME.colors.error : THEME.colors.success}
        />
        <Text
          style={[
            styles.countdownText,
            isLowTime && styles.countdownTextWarning,
          ]}
        >
          {minutes}:{seconds.toString().padStart(2, "0")}
        </Text>
      </View>
    );
  });

  const getEstadoBadge = (estado: string) => {
    const badges = {
      programada: {
        color: THEME.colors.info,
        icon: "time-outline",
        text: "Programada",
      },
      en_curso: {
        color: THEME.colors.success,
        icon: "play-circle",
        text: "En Curso",
      },
      finalizada: {
        color: THEME.colors.text.muted,
        icon: "checkmark-circle",
        text: "Finalizada",
      },
      cancelada: {
        color: THEME.colors.error,
        icon: "close-circle",
        text: "Cancelada",
      },
    };
    return badges[estado as keyof typeof badges] || badges.programada;
  };

  const renderPregunta = React.useCallback(
    ({ item }: { item: PreguntaVotacion }) => {
      const badge = getEstadoBadge(item.estado);

      return (
        <View
          style={[
            styles.preguntaCard,
            item.estado === "en_curso" && styles.preguntaCardActiva,
          ]}
        >
          <View style={styles.preguntaHeader}>
            <View style={styles.preguntaInfo}>
              <Text style={styles.preguntaTexto}>{item.pregunta}</Text>
              <View style={styles.preguntaMeta}>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: badge.color + "20" },
                  ]}
                >
                  <Ionicons
                    name={badge.icon as any}
                    size={14}
                    color={badge.color}
                  />
                  <Text style={[styles.badgeText, { color: badge.color }]}>
                    {badge.text}
                  </Text>
                </View>
                <Text style={styles.tipoPregunta}>
                  {item.tipo_pregunta === "si_no" ? "Sí/No" : "Múltiple"}
                </Text>
                {item.estado === "en_curso" && (
                  <CountdownTimer preguntaId={item.id} />
                )}
              </View>
            </View>

            {item.estado !== "finalizada" && item.estado !== "cancelada" && (
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() =>
                  setMenuVisible(menuVisible === item.id ? null : item.id)
                }
              >
                <Ionicons name="ellipsis-vertical" size={20} color="#64748B" />
              </TouchableOpacity>
            )}
          </View>

          {item.tipo_pregunta === "multiple" && item.opciones && (
            <View style={styles.opcionesContainer}>
              {item.opciones.map((opcion: any) => (
                <Text key={opcion.id} style={styles.opcionTexto}>
                  • {opcion.opcion}
                </Text>
              ))}
            </View>
          )}

          {/* Menú contextual */}
          {menuVisible === item.id && (
            <View style={styles.menuDropdown}>
              {item.estado === "programada" && (
                <>
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => activarPregunta(item.id)}
                  >
                    <Ionicons
                      name="play-circle-outline"
                      size={22}
                      color="#10B981"
                    />
                    <Text style={styles.menuItemText}>Activar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.menuItem, styles.menuItemLast]}
                    onPress={() => cancelarPregunta(item.id)}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={22}
                      color="#EF4444"
                    />
                    <Text style={[styles.menuItemText, { color: "#EF4444" }]}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                </>
              )}

              {item.estado === "en_curso" && (
                <>
                  {esApoderado && (
                    <TouchableOpacity
                      style={styles.menuItem}
                      onPress={async () => {
                        setMenuVisible(null);
                        try {
                          const response =
                            await votacionesService.obtenerPreguntaActivaAsamblea(
                              Number(asambleaId)
                            );
                          if (response.success && response.pregunta_activa) {
                            setPreguntaParaVotar(response.pregunta_activa);
                            setShowVotarModal(true);
                          } else {
                            showToast(
                              "No se pudo obtener la pregunta",
                              "error"
                            );
                          }
                        } catch {
                          showToast("Error al obtener pregunta", "error");
                        }
                      }}
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={22}
                        color="#3B82F6"
                      />
                      <Text style={styles.menuItemText}>Votar</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => finalizarPregunta(item.id)}
                  >
                    <Ionicons
                      name="stop-circle-outline"
                      size={22}
                      color="#EF4444"
                    />
                    <Text style={styles.menuItemText}>Finalizar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.menuItem, styles.menuItemLast]}
                    onPress={() => cancelarPregunta(item.id)}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={22}
                      color="#EF4444"
                    />
                    <Text style={[styles.menuItemText, { color: "#EF4444" }]}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      );
    },
    [
      menuVisible,
      activarPregunta,
      cancelarPregunta,
      finalizarPregunta,
      CountdownTimer,
      esApoderado,
      asambleaId,
    ]
  );

  const renderVotacion = React.useCallback(
    ({ item }: { item: Votacion }) => (
      <View style={styles.votacionCard}>
        <Text style={styles.votacionTitulo}>{item.titulo}</Text>
        {item.descripcion ? (
          <Text style={styles.votacionDesc}>{item.descripcion}</Text>
        ) : null}
        <FlatList
          data={
            item.preguntas?.map((p) => ({
              ...p,
              votacion_id: item.id,
            })) as PreguntaVotacion[]
          }
          renderItem={renderPregunta}
          keyExtractor={(pregunta) => pregunta.id.toString()}
        />
      </View>
    ),
    [renderPregunta]
  );

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["left", "right", "bottom"]}
      >
        <ScreenHeader title="Control de Preguntas" onBackPress={handleBack} />
        <View style={styles.loadingContainer}>
          <LottieView
            source={require("@/assets/lottie/LoadingVotaciones.json")}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
          <View style={styles.textPlaceholder} />
        </View>
      </SafeAreaView>
    );
  }

  if (votaciones.length === 0) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["left", "right", "bottom"]}
      >
        <ScreenHeader title="Control de Preguntas" onBackPress={handleBack} />
        <View style={styles.emptyContainer}>
          <LottieView
            source={require("@/assets/lottie/LoadingVotaciones.json")}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
          <Text style={styles.emptyText}>No hay votaciones disponibles</Text>
          <Text style={styles.emptySubtext}>
            Las preguntas de votación aparecerán aquí cuando estén disponibles
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScreenHeader title="Control de Preguntas" onBackPress={handleBack} />
      {menuVisible && (
        <TouchableOpacity
          activeOpacity={1}
          style={StyleSheet.absoluteFill}
          onPress={() => setMenuVisible(null)}
        />
      )}
      <FlatList
        data={votaciones}
        renderItem={renderVotacion}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        extraData={menuVisible}
      />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
      <Modal
        visible={showExitModal}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="warning" size={48} color="#F59E0B" />
            <Text style={styles.modalTitle}>Pregunta en curso</Text>
            <Text style={styles.modalMessage}>
              Hay una pregunta activa. Debes finalizarla antes de salir.
            </Text>
            <TouchableOpacity
              style={styles.modalButtonSingle}
              onPress={() => setShowExitModal(false)}
            >
              <Text style={styles.modalButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showActivateModal !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="alert-circle" size={48} color="#F59E0B" />
            <Text style={styles.modalTitle}>¿Cambiar pregunta activa?</Text>
            <Text style={styles.modalMessage}>
              Ya hay una pregunta en curso. ¿Estás seguro de activar esta nueva
              pregunta?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowActivateModal(null)}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() =>
                  showActivateModal && activarPregunta(showActivateModal, true)
                }
              >
                <Ionicons name="checkmark" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showCancelModal !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.modalTitle}>¿Cancelar pregunta?</Text>
            <Text style={styles.modalMessage}>
              Esta acción no se puede deshacer. ¿Estás seguro de cancelar esta
              pregunta?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowCancelModal(null)}
              >
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() =>
                  showCancelModal && cancelarPregunta(showCancelModal, true)
                }
              >
                <Ionicons name="checkmark" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ModalPreguntaActiva
        visible={showVotarModal}
        pregunta={preguntaParaVotar}
        onClose={() => {
          setShowVotarModal(false);
          setPreguntaParaVotar(null);
        }}
        onVotar={() => {
          showToast("Voto registrado exitosamente", "success");
          cargarVotaciones();
        }}
      />
    </SafeAreaView>
  );
}

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
  lottieAnimation: {
    width: 200,
    height: 200,
  },
  textPlaceholder: {
    height: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: THEME.spacing.xl,
  },
  emptyText: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginTop: THEME.spacing.md,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.xs,
    textAlign: "center",
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  votacionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  votacionTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
  },
  votacionDesc: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  preguntaCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  preguntaCardActiva: {
    borderWidth: 2,
    borderColor: "#10B981",
    backgroundColor: "#10B98108",
  },
  preguntaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  preguntaInfo: {
    flex: 1,
    marginRight: 12,
  },
  preguntaTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    marginBottom: 10,
    lineHeight: 22,
  },
  preguntaMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tipoPregunta: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  menuButton: {
    padding: 6,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginTop: -4,
  },
  menuDropdown: {
    position: "absolute",
    top: 40,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 999,
    zIndex: 999,
    minWidth: 200,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemText: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "500",
  },
  opcionesContainer: {
    marginTop: 12,
    paddingLeft: 8,
  },
  opcionTexto: {
    fontSize: 14,
    color: "#64748B",
    marginVertical: 3,
    lineHeight: 20,
  },
  countdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10B98120",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  countdownWarning: {
    backgroundColor: "#EF444420",
  },
  countdownText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#10B981",
  },
  countdownTextWarning: {
    color: "#EF4444",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME.colors.modalOverlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "80%",
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: THEME.colors.text.heading,
    marginTop: 16,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: THEME.colors.text.secondary,
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
  modalButtonSingle: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    width: "100%",
  },
  modalButtonSecondary: {
    backgroundColor: THEME.colors.surfaceLight,
  },
  modalButtonText: {
    color: THEME.colors.text.inverse,
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
