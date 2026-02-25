import Toast from "@/components/Toast";
import { THEME } from "@/constants/theme";
import { useProject } from "@/contexts/ProjectContext";
import { useRole } from "@/hooks/useRole";
import { fcmService } from "@/services/fcmService";
import { pqrService } from "@/services/pqrService";
import PqrDetailSkeleton from "@/components/pqr/PqrDetailSkeleton";
import { s3Service } from "@/services/s3Service";
import { EstadoPQR, PQR } from "@/types/Pqr";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { eventBus, EVENTS } from "@/utils/eventBus";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as WebBrowser from "expo-web-browser";
import ConfirmModal from "@/components/asambleas/ConfirmModal";

interface Mensaje {
  id: number;
  mensaje: string;
  es_admin: boolean;
  fecha_creacion: string;
  nombre_usuario?: string;
}

export default function PQRDetailScreen() {
  const { id } = useLocalSearchParams();
  const pqrId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { selectedProject } = useProject();
  const { isAdmin } = useRole();
  const [pqr, setPqr] = useState<PQR | null>(null);
  const [loading, setLoading] = useState(true);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error" | "warning",
  });

  const [showResolverModal, setShowResolverModal] = useState(false);
  const [showAnularModal, setShowAnularModal] = useState(false);

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" = "success"
  ) => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, visible: false }));
  };

  const cargarDetallePQR = useCallback(async () => {
    if (!pqrId) return;

    try {
      setLoading(true);
      const response = await pqrService.obtenerPQRPorId(Number(pqrId));

      if (response.success) {
        setPqr(response.data);
      } else {
        showToast(response.error || "Error al cargar PQR", "error");
      }
    } catch {
      showToast("Error al cargar PQR", "error");
    } finally {
      setLoading(false);
    }
  }, [pqrId]);

  const cargarMensajes = useCallback(async () => {
    if (!pqrId) return;

    try {
      const response = await pqrService.obtenerMensajes(Number(pqrId));

      if (response.success) {
        setMensajes(response.data);
        // Auto-scroll al final cuando se cargan mensajes (suave)
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 300);
      } else {
        console.error("Error cargando mensajes:", response.error);
      }
    } catch (error) {
      console.error("Error cargando mensajes:", error);
    }
  }, [pqrId]);

  // FCM Listener para actualizaciones en tiempo real
  useEffect(() => {
    if (!pqrId) return;

    // Escuchar notificaciones FCM cuando la app está activa
    const unsubscribe = fcmService.onMessage((notification) => {
      // Verificar si es una notificación de PQR mensaje
      if (notification.data?.type === "pqr_mensaje") {
        const notificationPqrId = notification.data.pqr_id;

        // Solo actualizar si es para esta PQR específica
        if (notificationPqrId === pqrId) {
          cargarMensajes(); // Actualizar mensajes inmediatamente

          // Auto-scroll al final cuando llega un mensaje por FCM (suave)
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 500);
        }
      }
    });

    // Cleanup: remover listener cuando el componente se desmonte
    return () => {
      unsubscribe();
    };
  }, [pqrId, cargarMensajes]);

  // Polling dinámico según estado de notificaciones
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const setupPolling = async () => {
      // Solo hacer polling si la PQR está en estado activo
      const estadosActivos = ["Pendiente", "En Proceso"];
      const esEstadoActivo = pqr && estadosActivos.includes(pqr.estado_pqr);

      if (pqrId && pqr && esEstadoActivo) {
        // Verificar si las notificaciones están habilitadas
        const notificationsEnabled =
          await fcmService.checkNotificationsEnabled();

        // Solo hacer polling si NO hay notificaciones
        if (!notificationsEnabled) {
          interval = setInterval(() => {
            cargarMensajes();
          }, 10 * 1000);
        }
      }
    };

    setupPolling();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [pqrId, pqr, cargarMensajes]);

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !pqrId) return;

    try {
      setEnviandoMensaje(true);
      const estadoAnterior = pqr?.estado_pqr;

      const response = await pqrService.enviarMensaje(
        Number(pqrId),
        nuevoMensaje
      );

      if (response.success) {
        // Agregar el mensaje nuevo a la lista localmente
        setMensajes((prev) => [...prev, response.data]);
        setNuevoMensaje("");

        // Auto-scroll al final cuando se envía un mensaje (suave)
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 400);

        // Solo recargar detalle si es admin y la PQR estaba pendiente
        // (porque cambiará automáticamente a "En Proceso")
        if (isAdmin && estadoAnterior === "Pendiente") {
          setPqr((prev) =>
            prev ? { ...prev, estado_pqr: "En Proceso" } : null
          );
          eventBus.emit(EVENTS.PQR_UPDATED, {
            id: Number(pqrId),
            estado: "En Proceso",
          });
          showToast("PQR cambiada a 'En Proceso'", "success");
        }
      } else {
        // Si el error es por estado resuelto, actualizar el estado local
        if (response.error?.includes("estado: Resuelto")) {
          setPqr((prev) => (prev ? { ...prev, estado_pqr: "Resuelto" } : null));
        }
        showToast(response.error || "Error al enviar mensaje", "error");
      }
    } catch {
      showToast("Error al enviar mensaje", "error");
    } finally {
      setEnviandoMensaje(false);
    }
  };

  useEffect(() => {
    if (pqrId) {
      cargarDetallePQR();
      cargarMensajes();
    }
  }, [pqrId, cargarDetallePQR, cargarMensajes]);

  const handleBackPress = () => {
    router.back();
  };

  const getEstadoColor = (estado: EstadoPQR) => {
    switch (estado) {
      case "Pendiente":
        return THEME.colors.warning;
      case "En Proceso":
        return THEME.colors.info;
      case "Resuelto":
        return THEME.colors.success;
      case "Anulado":
        return THEME.colors.text.muted;
      default:
        return THEME.colors.text.muted;
    }
  };

  // Convertir UTC a hora de Colombia
  const formatearFecha = (fecha: string) => {
    if (!fecha) return "";
    // Restar 5 horas para Colombia usando dayjs
    return dayjs(fecha).subtract(5, "hour").format("DD/MM/YYYY HH:mm");
  };

  const puedeResponder = () => {
    if (!pqr) return false;
    const estadosPermitidos = ["Pendiente", "En Proceso"];
    return estadosPermitidos.includes(pqr.estado_pqr);
  };

  const puedeGestionarEstado = () => {
    if (!pqr || !isAdmin) return false;
    // Admin solo puede resolver PQRs que estén "En Proceso" (ya respondidas)
    return pqr.estado_pqr === "En Proceso";
  };

  const handleCambiarEstado = async (nuevoEstado: EstadoPQR) => {
    if (!pqr) return;

    try {
      const response = await pqrService.actualizarEstadoPQR(
        pqr.id_pqr,
        nuevoEstado
      );

      if (response.success) {
        setPqr((prev) => (prev ? { ...prev, estado_pqr: nuevoEstado } : null));
        eventBus.emit(EVENTS.PQR_UPDATED, {
          id: pqr.id_pqr,
          estado: nuevoEstado,
        });
        showToast(`Estado cambiado a ${nuevoEstado}`, "success");
      } else {
        showToast(response.error || "Error al cambiar estado", "error");
      }
    } catch {
      showToast("Error al cambiar estado", "error");
    }
  };

  const resolverPQR = () => {
    if (!pqr) return;
    setShowResolverModal(true);
  };

  const puedeAnular = () => {
    if (!pqr || isAdmin) {
      return false;
    }
    return pqr.estado_pqr === "Pendiente";
  };

  const handleAnularPQR = async () => {
    if (!pqr) return;
    setShowAnularModal(true);
  };

  const confirmarAnularPQR = async () => {
    if (!pqr) return;

    try {
      const response = await pqrService.anularPQR(pqr.id_pqr);

      if (response.success) {
        setPqr((prev) => (prev ? { ...prev, estado_pqr: "Anulado" } : null));
        eventBus.emit(EVENTS.PQR_UPDATED, {
          id: pqr.id_pqr,
          estado: "Anulado",
        });
        showToast(response.message || "PQR anulada exitosamente", "success");
      } else {
        showToast(response.error || "Error al anular PQR", "error");
      }
    } catch (error) {
      console.error("Error anulando PQR:", error);
      showToast("Error al anular PQR", "error");
    } finally {
      setShowAnularModal(false);
    }
  };

  const handleDescargarArchivo = async () => {
    if (!pqr?.archivo_nombre || !selectedProject?.nit) {
      showToast("No se puede abrir el archivo", "error");
      return;
    }

    try {
      const result = await s3Service.downloadPQRFile(
        selectedProject.nit!,
        pqr.archivo_nombre
      );

      if (result.success && result.url) {
        await WebBrowser.openBrowserAsync(result.url, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          controlsColor: THEME.colors.primary,
          toolbarColor: THEME.colors.primary,
        });
      } else {
        showToast(result.error || "Error al abrir archivo", "error");
      }
    } catch {
      showToast("Error al abrir archivo", "error");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Detalle PQR</Text>
          </View>
        </View>
        <PqrDetailSkeleton />
      </SafeAreaView>
    );
  }

  if (!pqr) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>PQR no encontrada</Text>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={64}
            color={THEME.colors.error}
          />
          <Text style={styles.errorText}>
            No se pudo cargar la información de la PQR
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={cargarDetallePQR}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Header Mejorado */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>PQR #{pqr.id_pqr}</Text>
            <Text style={styles.headerSubtitle}>{pqr.tipo_peticion}</Text>
          </View>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          onContentSizeChange={() => {
            // Auto-scroll cuando el contenido cambia de tamaño (muy suave)
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 600);
          }}
        >
          {/* Hero Card con Estado */}
          <View style={styles.heroCard}>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getEstadoColor(pqr.estado_pqr) },
                ]}
              >
                <Text style={styles.statusText}>{pqr.estado_pqr}</Text>
              </View>
              <Text style={styles.dateText}>
                {formatearFecha(pqr.fecha_creacion)}
              </Text>
            </View>

            <Text style={styles.heroTitle}>{pqr.asunto}</Text>
            <Text style={styles.heroDescription}>{pqr.descripcion}</Text>

            {/* Botón Anular PQR - Solo usuarios */}
            {puedeAnular() && (
              <TouchableOpacity
                style={styles.anularButton}
                onPress={handleAnularPQR}
              >
                <Ionicons name="close-circle" size={16} color="#dc2626" />
                <Text style={styles.anularButtonText}>Anular PQR</Text>
              </TouchableOpacity>
            )}

            {/* Botón Resolver PQR - Solo admin */}
            {puedeGestionarEstado() && (
              <TouchableOpacity
                style={styles.adminButton}
                onPress={resolverPQR}
              >
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.adminButtonText}>Resolver PQR</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Info Cards Grid */}
          <View style={styles.infoGrid}>
            {/* Apartamento Card */}
            {pqr.apartamento && (
              <View style={styles.infoCard}>
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="home"
                    size={20}
                    color={THEME.colors.primary}
                  />
                  <Text style={styles.cardTitle}>Inmueble</Text>
                </View>
                <Text style={styles.cardValue}>
                  {pqr.apartamento.bloque
                    ? `${pqr.apartamento.numero}-${pqr.apartamento.bloque}`
                    : pqr.apartamento.numero}
                </Text>
              </View>
            )}

            {/* Creador Card */}
            {pqr.creador && (
              <View style={styles.infoCard}>
                <View style={styles.cardHeader}>
                  <Ionicons
                    name="person"
                    size={20}
                    color={THEME.colors.primary}
                  />
                  <Text style={styles.cardTitle}>Propietario</Text>
                </View>
                <Text style={styles.cardValue}>
                  {pqr.creador.nombre} {pqr.creador.apellido}
                </Text>
              </View>
            )}
          </View>

          {/* Archivo Adjunto Mejorado */}
          {pqr.archivo_nombre && (
            <TouchableOpacity
              style={styles.attachmentCard}
              onPress={handleDescargarArchivo}
            >
              <View style={styles.attachmentIcon}>
                <Ionicons
                  name={
                    pqr.archivo_nombre.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                      ? "image"
                      : "document"
                  }
                  size={24}
                  color="white"
                />
              </View>
              <View style={styles.attachmentInfo}>
                <Text style={styles.attachmentTitle}>
                  {pqr.archivo_nombre.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                    ? "Imagen adjunta"
                    : "Archivo adjunto"}
                </Text>
                <Text style={styles.attachmentSubtitle}>Toca para ver</Text>
              </View>
            </TouchableOpacity>
          )}

          {/* Chat de Seguimiento */}
          <View style={styles.chatCard}>
            <View style={styles.chatHeader}>
              <Ionicons
                name="chatbubbles"
                size={20}
                color={THEME.colors.primary}
              />
              <Text style={styles.chatTitle}>Seguimiento</Text>
            </View>

            {/* Mensajes */}
            <View style={styles.messagesContainer}>
              {mensajes.length === 0 && (
                <Text style={styles.emptyMessagesText}>No hay mensajes</Text>
              )}

              {/* Mensajes del seguimiento */}
              {mensajes.map((mensaje) =>
                mensaje.es_admin ? (
                  <View key={mensaje.id} style={styles.messageAdmin}>
                    <View style={styles.avatarAdmin}>
                      <Ionicons name="shield" size={16} color="white" />
                    </View>
                    <View style={styles.messageContent}>
                      <Text style={styles.messageText}>{mensaje.mensaje}</Text>
                      <Text style={styles.messageTime}>
                        {formatearFecha(mensaje.fecha_creacion)}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View key={mensaje.id} style={styles.messageUser}>
                    <View style={styles.messageContent}>
                      <Text style={styles.messageText}>{mensaje.mensaje}</Text>
                      <Text style={styles.messageTime}>
                        {formatearFecha(mensaje.fecha_creacion)}
                      </Text>
                    </View>
                    <View style={styles.avatarUser}>
                      <Ionicons name="person" size={16} color="white" />
                    </View>
                  </View>
                )
              )}
            </View>

            {/* Input para nuevo mensaje */}
            <View style={styles.chatInput}>
              <TextInput
                key={`input-${pqr.estado_pqr}`}
                style={[
                  styles.textInput,
                  !puedeResponder() && styles.textInputDisabled,
                ]}
                placeholder={
                  puedeResponder()
                    ? "Escribe tu mensaje..."
                    : "Conversación cerrada"
                }
                placeholderTextColor="#94a3b8"
                multiline
                value={nuevoMensaje}
                onChangeText={setNuevoMensaje}
                editable={!enviandoMensaje && puedeResponder()}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (enviandoMensaje ||
                    !puedeResponder() ||
                    !nuevoMensaje.trim()) &&
                    styles.sendButtonDisabled,
                ]}
                onPress={enviarMensaje}
                disabled={
                  enviandoMensaje || !nuevoMensaje.trim() || !puedeResponder()
                }
              >
                {enviandoMensaje ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Ionicons name="send" size={20} color="white" />
                )}
              </TouchableOpacity>
            </View>
          </View>
          {isAdmin && pqr.estado_pqr === "Pendiente" && (
            <View style={styles.adminInfoCard}>
              <View style={styles.adminInfoIcon}>
                <Ionicons
                  name="information-circle"
                  size={16}
                  color={THEME.colors.info}
                />
              </View>
              <Text style={styles.adminInfoText}>
                Al responder, la PQR cambiará automáticamente a estado{" "}
                <Text style={styles.adminInfoBold}>En Proceso</Text>
              </Text>
            </View>
          )}
        </ScrollView>

        <Toast
          visible={toast.visible}
          message={toast.message}
          type={toast.type}
          onHide={hideToast}
        />

        <ConfirmModal
          visible={showResolverModal}
          type="confirm"
          title="Resolver PQR"
          message="¿Estás seguro de que deseas marcar esta PQR como resuelta?"
          confirmText="Marcar como Resuelto"
          cancelText="Cancelar"
          onConfirm={() => {
            setShowResolverModal(false);
            handleCambiarEstado("Resuelto");
          }}
          onCancel={() => setShowResolverModal(false)}
        />

        <ConfirmModal
          visible={showAnularModal}
          type="warning"
          title="Anular PQR"
          message="¿Estás seguro de que deseas anular esta PQR? Esta acción no se puede deshacer."
          confirmText="Anular"
          cancelText="Cancelar"
          onConfirm={confirmarAnularPQR}
          onCancel={() => setShowAnularModal(false)}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: THEME.colors.primary,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerContent: {
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  heroCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  dateText: {
    fontSize: 12,
    color: "#64748b",
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 14,
    color: "#475569",
    lineHeight: 20,
  },
  infoGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
    marginLeft: 6,
    textTransform: "uppercase",
  },
  cardValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#94a3b8",
  },
  attachmentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 20,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  attachmentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  attachmentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  attachmentTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  attachmentSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorText: {
    textAlign: "center",
    color: "#64748b",
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  chatCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 20,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 8,
  },
  messagesContainer: {
    marginBottom: 16,
  },
  messageUser: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 12,
  },
  messageAdmin: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 12,
  },
  messageContent: {
    maxWidth: "80%",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
  },
  messageText: {
    fontSize: 14,
    color: "#1e293b",
    lineHeight: 18,
  },
  messageTime: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 4,
  },
  avatarUser: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarAdmin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#10b981",
    justifyContent: "center",
    alignItems: "center",
  },
  chatInput: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingTop: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: "#e2e8f0",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    maxHeight: 80,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  textInputDisabled: {
    backgroundColor: "#f1f5f9",
    borderColor: "#cbd5e1",
    paddingHorizontal: 16,
  },
  anularButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  anularButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#dc2626",
    marginLeft: 4,
  },
  adminButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 12,
  },
  adminButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#059669",
    marginLeft: 4,
  },
  adminInfoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  adminInfoIcon: {
    marginRight: 8,
    marginTop: 1,
  },
  adminInfoText: {
    flex: 1,
    fontSize: 13,
    color: "#1e40af",
    lineHeight: 18,
  },
  adminInfoBold: {
    fontWeight: "600",
  },
  emptyMessagesText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 13,
    fontStyle: "italic",
    paddingVertical: 12,
  },
});
