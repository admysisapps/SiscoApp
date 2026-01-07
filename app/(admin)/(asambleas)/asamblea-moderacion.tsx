import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { THEME } from "@/constants/theme";
import { asistenciaService } from "@/services/asistenciaService";
import { asambleaService } from "@/services/asambleaService";
import { votacionesService } from "@/services/votacionesService";

import RepresentacionCardAdmin from "@/components/votaciones/base/admin/RepresentacionCardAdmin";
import ConexionStatus from "@/components/votaciones/base/ConexionStatus";
import Toast from "@/components/Toast";
import { QuorumChart } from "@/components/votaciones/base/admin/QuorumChart";
import { quorumService } from "@/services/quorumService";
import FontAwesome from "@expo/vector-icons/FontAwesome";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { ResultadosVotacion } from "@/components/votaciones/base/ResultadosVotacion";

const AsambleaModeracioScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const hasLoadedRef = useRef(false);

  const [registroData, setRegistroData] = useState<any>(null);
  const [asambleaId, setAsambleaId] = useState<number | null>(null);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error" | "warning",
  });
  const [showQuorum, setShowQuorum] = useState(false);
  const [showResultados, setShowResultados] = useState(false);
  const [resultadosData, setResultadosData] = useState<any[]>([]);
  const [loadingResultados, setLoadingResultados] = useState(false);
  const [showFinalizarModal, setShowFinalizarModal] = useState(false);
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
    if (hasLoadedRef.current) return;

    const loadData = async () => {
      // Caso 1: Viene desde el modal con datos completos (optimizado)
      if (params.registroData && params.asambleaId) {
        try {
          const data = JSON.parse(params.registroData as string);
          setRegistroData(data);
          setAsambleaId(parseInt(params.asambleaId as string));
          hasLoadedRef.current = true;
        } catch (error) {
          console.error("Error parsing params:", error);
          setToast({
            visible: true,
            message: "Datos de asamblea inválidos",
            type: "error",
          });
          setTimeout(() => router.back(), 2000);
        }
      }
      // Caso 2: Viene desde redirección directa (optimizado)
      else if (params.asambleaId && params.fromRedirect) {
        try {
          const id = parseInt(params.asambleaId as string);
          const response = await asistenciaService.validarAsistencia(id);
          setRegistroData(response);
          setAsambleaId(id);
          hasLoadedRef.current = true;
        } catch (error) {
          console.error("Error loading assembly data:", error);
          setToast({
            visible: true,
            message: "No se pudo cargar la información de la asamblea",
            type: "error",
          });
          setTimeout(() => router.back(), 2000);
        }
      }
      // Caso 3: Acceso directo con solo ID (legacy)
      else if (params.id) {
        try {
          const id = parseInt(params.id as string);
          const response = await asistenciaService.validarAsistencia(id);
          setRegistroData(response);
          setAsambleaId(id);
          hasLoadedRef.current = true;
        } catch (error) {
          console.error("Error loading assembly data:", error);
          setToast({
            visible: true,
            message: "No se pudo cargar la información de la asamblea",
            type: "error",
          });
          setTimeout(() => router.back(), 2000);
        }
      } else {
        setToast({
          visible: true,
          message: "No se proporcionó información de la asamblea",
          type: "error",
        });
        setTimeout(() => router.back(), 2000);
      }
    };

    loadData();
  }, [params, router]);

  const handleConnectionChange = (isConnected: boolean) => {
    setToast({
      visible: true,
      message: isConnected ? "Conexión restaurada" : "Sin conexión a internet",
      type: isConnected ? "success" : "error",
    });
  };

  const handleFinalizarAsamblea = async () => {
    setShowFinalizarModal(false);

    try {
      const response = await asambleaService.cambiarEstadoAsamblea(
        asambleaId!,
        "finalizada"
      );

      if (response.success) {
        await quorumService.clearParticipantesCache(asambleaId ?? undefined);

        setToast({
          visible: true,
          message: response.message || "Asamblea finalizada exitosamente",
          type: "success",
        });

        setTimeout(() => {
          router.back();
        }, 2000);
      } else {
        setToast({
          visible: true,
          message: response.error || "Error al finalizar asamblea",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error finalizando asamblea:", error);
      setToast({
        visible: true,
        message: "Error de conexión al finalizar asamblea",
        type: "error",
      });
    }
  };

  // Mostrar skeleton si no hay datos
  if (!registroData) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["left", "right", "bottom"]}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons
              name="arrow-back"
              size={24}
              color={THEME.colors.header.title}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Panel de Moderación</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.content}>
          {/* Skeleton Card 1 */}
          <View style={styles.skeletonCard}>
            <View style={[styles.skeletonLine, { width: "60%", height: 20 }]} />
            <View
              style={[styles.skeletonLine, { width: "80%", marginTop: 12 }]}
            />
            <View
              style={[styles.skeletonLine, { width: "70%", marginTop: 8 }]}
            />
          </View>
          {/* Skeleton Card 2 */}
          <View style={styles.skeletonCard}>
            <View style={[styles.skeletonLine, { width: "50%", height: 20 }]} />
            <View
              style={[styles.skeletonLine, { width: "90%", marginTop: 12 }]}
            />
            <View
              style={[styles.skeletonLine, { width: "85%", marginTop: 8 }]}
            />
            <View
              style={[styles.skeletonLine, { width: "75%", marginTop: 8 }]}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={THEME.colors.header.title}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Panel de Moderación</Text>
        <ConexionStatus onConnectionChange={handleConnectionChange} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Resumen del moderador */}
        <RepresentacionCardAdmin
          coeficienteTotal={registroData.coeficiente_total}
          apartamentosCount={registroData.apartamentos_count}
          apartamentosNumeros={registroData.apartamentos_numeros}
          asambleaId={asambleaId ?? undefined}
        />

        {/* Herramientas de moderación o Quorum */}
        {showQuorum ? (
          <View style={styles.actionsCard}>
            <View style={styles.quorumHeader}>
              <TouchableOpacity
                onPress={() => setShowQuorum(false)}
                style={styles.backToMenuButton}
              >
                <Ionicons
                  name="arrow-back"
                  size={20}
                  color={THEME.colors.primary}
                />
                <Text style={styles.backToMenuText}>Volver al menú</Text>
              </TouchableOpacity>
            </View>
            <QuorumChart asambleaId={asambleaId ?? undefined} />
          </View>
        ) : (
          <View style={styles.actionsCard}>
            <Text style={styles.cardTitle}>Herramientas de moderación</Text>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                router.push(`/votacion-crear?asambleaId=${asambleaId}`)
              }
            >
              <Ionicons
                name="add-circle"
                size={22}
                color={THEME.colors.primary}
              />
              <Text style={styles.actionButtonText}>Crear votación</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() =>
                router.push({
                  pathname: "/(admin)/(asambleas)/ControlPreguntas",
                  params: {
                    asambleaId: asambleaId?.toString() || "",
                    registroData: JSON.stringify(registroData),
                  },
                })
              }
            >
              <MaterialCommunityIcons
                name="vote-outline"
                size={24}
                color={THEME.colors.primary}
              />
              <Text style={styles.actionButtonText}>Control de preguntas</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowQuorum(true)}
            >
              <FontAwesome
                name="pie-chart"
                size={20}
                color={THEME.colors.primary}
              />
              <Text style={styles.actionButtonText}>Estado del quórum</Text>
            </TouchableOpacity>

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
                      setResultadosData(response.preguntas);
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
              <MaterialCommunityIcons
                name="chart-box-outline"
                size={24}
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
          </View>
        )}

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

        {/* Acciones de control */}
        <View style={styles.controlCard}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.touchable}
            onPress={() => setShowFinalizarModal(true)}
          >
            <LinearGradient
              colors={["#F87171", "#EF4444", "#DC2626"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.finishButton}
            >
              <Ionicons name="stop-circle" size={20} color="white" />
              <Text style={styles.controlButtonText}>Finalizar asamblea</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <Modal
        visible={showFinalizarModal}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons
              name="checkmark-done-circle"
              size={48}
              color={THEME.colors.warning}
            />
            <Text style={styles.modalTitle}>Finalizar asamblea</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro que deseas finalizar la asamblea?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowFinalizarModal(false)}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={THEME.colors.text.secondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={handleFinalizarAsamblea}
              >
                <Ionicons
                  name="checkmark"
                  size={24}
                  color={THEME.colors.text.inverse}
                />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.text.heading,
  },
  headerSpacer: {
    width: 40,
  },
  finalizarButton: {
    padding: THEME.spacing.sm,
  },
  content: {
    flex: 1,
    padding: THEME.spacing.lg,
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
  summaryCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
  },
  cardTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: THEME.spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME.spacing.sm,
  },
  summaryLabel: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
  },
  summaryValue: {
    fontSize: THEME.fontSize.sm,
    fontWeight: "600",
    color: THEME.colors.primary,
  },
  apartamentosContainer: {
    marginTop: THEME.spacing.sm,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  apartamentosLabel: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
  },
  apartamentosText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.primary,
    fontWeight: "500",
  },
  actionsCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
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
  controlCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
  },
  touchable: {
    borderRadius: THEME.borderRadius.md,
    overflow: "hidden",
  },
  finishButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.md,
    gap: THEME.spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  controlButtonText: {
    color: THEME.colors.text.inverse,
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },
  quorumHeader: {
    marginBottom: THEME.spacing.md,
  },
  backToMenuButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: THEME.spacing.sm,
  },
  backToMenuText: {
    marginLeft: THEME.spacing.sm,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.primary,
    fontWeight: "500",
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
  modalButtonSecondary: {
    backgroundColor: THEME.colors.border,
  },
  skeletonCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
  },
  skeletonLine: {
    height: 16,
    backgroundColor: THEME.colors.surfaceLight,
    borderRadius: 4,
  },
});

export default AsambleaModeracioScreen;
