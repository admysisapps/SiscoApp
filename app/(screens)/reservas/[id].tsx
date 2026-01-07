import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { eventBus, EVENTS } from "@/utils/eventBus";
import { THEME } from "@/constants/theme";
import { reservaService } from "@/services/reservaService";
import { EstadoReserva, EstadoReservaIcon } from "@/types/Reserva";
import Toast from "@/components/Toast";
import CancelReservationModal from "@/components/reservas/CancelReservationModal";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

interface ReservaDetalle {
  id: number;
  fecha_reserva: string;
  hora_inicio: string;
  hora_fin: string;
  estado: EstadoReserva;
  precio_total: number;
  motivo?: string;
  espacio_nombre: string;
  fecha_creacion: string;
  observaciones?: string;
  fecha_cancelacion?: string;
  motivo_cancelacion?: string;
  admin_nombre?: string;
  admin_email?: string;
  admin_telefono?: string;
  duracion_minutos: number;
}

export default function DetalleReservaScreen() {
  const { id } = useLocalSearchParams();
  const [reserva, setReserva] = useState<ReservaDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelando, setCancelando] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error" | "warning",
  });

  const cargarReserva = useCallback(async () => {
    try {
      setLoading(true);
      const response = await reservaService.obtenerReservaDetalle(Number(id));

      if (response?.success) {
        setReserva(response.reserva);
      } else {
        showToast("Error al cargar la reserva", "error");
        router.back();
      }
    } catch (error) {
      console.error("Error loading reservation:", error);
      showToast("Error de conexión", "error");
      router.back();
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    cargarReserva();
  }, [cargarReserva]);

  const handleCancelar = () => {
    if (
      !reserva ||
      (reserva.estado !== "Pendiente" && reserva.estado !== "Confirmada")
    ) {
      return;
    }
    setShowCancelModal(true);
  };

  const handleConfirmarCancelacion = async (motivoCancelacion: string) => {
    if (!reserva) return;

    try {
      setCancelando(true);
      const response = await reservaService.cancelarReserva(
        reserva.id,
        motivoCancelacion
      );

      if (response?.success) {
        setReserva((prev) =>
          prev
            ? {
                ...prev,
                estado: "Cancelada",
                fecha_cancelacion: new Date().toISOString(),
                motivo_cancelacion: motivoCancelacion,
              }
            : null
        );
        eventBus.emit(EVENTS.RESERVA_UPDATED, {
          id: reserva.id,
          estado: "Cancelada",
        });

        showToast("Reserva cancelada exitosamente", "success");
        setShowCancelModal(false);
      } else {
        showToast("Error al cancelar la reserva", "error");
      }
    } catch (error) {
      console.error("Error canceling reservation:", error);
      showToast("Error de conexión", "error");
    } finally {
      setCancelando(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "Confirmada":
        return THEME.colors.success;
      case "Pendiente":
        return THEME.colors.warning;
      case "Cancelada":
        return THEME.colors.error;
      case "Rechazada":
        return THEME.colors.error;
      default:
        return THEME.colors.text.muted;
    }
  };

  const getEstadoIcon = (estado: string): EstadoReservaIcon => {
    switch (estado) {
      case "Confirmada":
        return "checkmark-circle";
      case "Pendiente":
        return "time";
      case "Cancelada":
        return "close-circle";
      case "Rechazada":
        return "ban";
      default:
        return "help-circle";
    }
  };

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" = "success"
  ) => {
    setToast({ visible: true, message, type });
  };

  const hideToast = useCallback(() => {
    setToast({ visible: false, message: "", type: "success" });
  }, []);

  const handleBackPress = useCallback(() => {
    router.back();
  }, []);

  // Memoizar cálculos de fechas para evitar re-renders innecesarios
  const fechasFormateadas = useMemo(() => {
    if (!reserva) return null;

    return {
      fechaReserva: dayjs(reserva.fecha_reserva).format("DD MMM YYYY"),
      diaReserva: dayjs(reserva.fecha_reserva).format("dddd"),
      horaInicio: reserva.hora_inicio?.split(":").slice(0, 2).join(":") || "",
      horaFin: reserva.hora_fin?.split(":").slice(0, 2).join(":") || "",
      fechaCreacion: dayjs(reserva.fecha_creacion).format("DD MMM YYYY"),
      fechaCancelacion: reserva.fecha_cancelacion
        ? dayjs(reserva.fecha_cancelacion).format("DD/MM/YYYY [a las] HH:mm")
        : null,
    };
  }, [reserva]);

  // Memoizar información de duración
  const duracionInfo = useMemo(() => {
    if (!reserva) return null;

    const horas = Math.floor(reserva.duracion_minutos / 60);
    const minutos = reserva.duracion_minutos % 60;

    return {
      horas,
      minutos,
      texto: `${horas} hora${horas !== 1 ? "s" : ""}${minutos > 0 ? ` ${minutos} min` : ""}`,
    };
  }, [reserva]);

  // Memoizar precio formateado
  const precioFormateado = useMemo(() => {
    if (!reserva) return "";
    return reserva.precio_total.toLocaleString("es-CO", {
      minimumFractionDigits: 0,
    });
  }, [reserva]);

  const handleLlamar = async (telefono: string) => {
    const phoneNumber = telefono.replace(/\D/g, "");
    if (!phoneNumber || phoneNumber.length < 7) {
      showToast("Número de teléfono inválido", "error");
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(`tel:${phoneNumber}`);
      if (canOpen) {
        await Linking.openURL(`tel:${phoneNumber}`);
      } else {
        showToast("No se pudo abrir la aplicación de teléfono", "error");
      }
    } catch (error) {
      console.error("Error opening phone:", error);
      showToast("No se pudo realizar la llamada", "error");
    }
  };

  const handleWhatsApp = async (telefono: string) => {
    const phoneNumber = telefono.replace(/\D/g, "");
    if (!phoneNumber || phoneNumber.length < 7) {
      showToast("Número de teléfono inválido", "error");
      return;
    }
    const whatsappNumber = phoneNumber.startsWith("57")
      ? phoneNumber
      : `57${phoneNumber}`;
    try {
      const canOpen = await Linking.canOpenURL(
        `whatsapp://send?phone=${whatsappNumber}`
      );
      if (canOpen) {
        await Linking.openURL(`whatsapp://send?phone=${whatsappNumber}`);
      } else {
        showToast("WhatsApp no está instalado", "error");
      }
    } catch (error) {
      console.error("Error opening WhatsApp:", error);
      showToast("No se pudo abrir WhatsApp", "error");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={THEME.colors.success} />
          <Text style={styles.loadingText}>Cargando reserva...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!reserva) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={THEME.colors.error} />
          <Text style={styles.errorText}>No se pudo cargar la reserva</Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={handleBackPress}
          >
            <Text style={styles.errorButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={THEME.colors.header.title}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Detalle de Reserva</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Estado Badge */}
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getEstadoColor(reserva.estado) },
            ]}
          >
            <Ionicons
              name={getEstadoIcon(reserva.estado)}
              size={16}
              color="white"
            />
            <Text style={styles.statusText}>{reserva.estado}</Text>
          </View>
        </View>

        {/* Información Principal */}
        <View style={styles.mainCard}>
          <Text style={styles.espacioNombre}>{reserva.espacio_nombre}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name="calendar"
                  size={20}
                  color={THEME.colors.success}
                />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Fecha</Text>
                <Text style={styles.infoValue}>
                  {fechasFormateadas?.fechaReserva}
                </Text>
                <Text style={styles.infoSubtext}>
                  {fechasFormateadas?.diaReserva}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.iconContainer}>
                <Ionicons name="time" size={20} color={THEME.colors.success} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Horario</Text>
                <Text style={styles.infoValue}>
                  {fechasFormateadas?.horaInicio} - {fechasFormateadas?.horaFin}
                </Text>
                <Text style={styles.infoSubtext}>{duracionInfo?.texto}</Text>
              </View>
            </View>
          </View>

          <View style={styles.precioContainer}>
            <View style={styles.precioContent}>
              <Text style={styles.precioLabel}>Total pagado</Text>
              <Text style={styles.precioValue}>${precioFormateado}</Text>
            </View>
          </View>
        </View>

        {/* Detalles adicionales */}
        <View style={styles.detailsCard}>
          {reserva.motivo && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Motivo de la reserva</Text>
                <Text style={styles.detailValue}>{reserva.motivo}</Text>
              </View>
              <View style={styles.dividerLine} />
            </>
          )}

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Observaciones</Text>
            {reserva.observaciones ? (
              <Text style={styles.detailValue}>{reserva.observaciones}</Text>
            ) : (
              <Text style={styles.detailEmptyValue}>Sin observaciones</Text>
            )}
          </View>

          <View style={styles.dividerLine} />

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Fecha de creación</Text>
            <Text style={styles.detailValue}>
              {fechasFormateadas?.fechaCreacion}
            </Text>
          </View>
        </View>

        {/* Información de Cancelación/Rechazo */}
        {(reserva.estado === "Cancelada" || reserva.estado === "Rechazada") &&
          (reserva.fecha_cancelacion || reserva.motivo_cancelacion) && (
            <View style={styles.cancelationSection}>
              <View style={styles.cancelationCard}>
                <View style={styles.cancelationHeader}>
                  <Ionicons
                    name={
                      reserva.estado === "Rechazada" ? "ban" : "close-circle"
                    }
                    size={24}
                    color={THEME.colors.error}
                  />
                  <Text style={styles.cancelationTitle}>
                    Reserva{" "}
                    {reserva.estado === "Rechazada" ? "rechazada" : "cancelada"}
                  </Text>
                </View>
                {reserva.fecha_cancelacion && (
                  <Text style={styles.cancelationDate}>
                    {reserva.estado === "Rechazada" ? "Rechazada" : "Cancelada"}{" "}
                    el {fechasFormateadas?.fechaCancelacion}
                  </Text>
                )}
                {reserva.motivo_cancelacion && (
                  <Text style={styles.cancelationReason}>
                    {reserva.motivo_cancelacion}
                  </Text>
                )}
              </View>
            </View>
          )}

        {/* Contacto del Administrador */}
        {(reserva.admin_nombre ||
          reserva.admin_email ||
          reserva.admin_telefono) && (
          <View style={[styles.contactSection]}>
            <Text style={styles.contactTitle}>Contacto del administrador</Text>
            <View style={styles.contactCard}>
              <View style={styles.contactInfo}>
                <View style={styles.contactAvatar}>
                  <Ionicons name="person" size={24} color="#fff" />
                </View>
                <View style={styles.contactDetails}>
                  {reserva.admin_nombre && (
                    <Text style={styles.contactName}>
                      {reserva.admin_nombre}
                    </Text>
                  )}
                  {reserva.admin_email && (
                    <Text style={styles.contactEmail}>
                      {reserva.admin_email}
                    </Text>
                  )}
                  {reserva.admin_telefono && (
                    <Text style={styles.contactPhone}>
                      {reserva.admin_telefono}
                    </Text>
                  )}
                </View>
              </View>
              {reserva.admin_telefono && (
                <View style={styles.contactActions}>
                  <TouchableOpacity
                    style={styles.contactButton}
                    onPress={() => handleLlamar(reserva.admin_telefono!)}
                  >
                    <Ionicons
                      name="call"
                      size={20}
                      color={THEME.colors.phone}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.contactButton}
                    onPress={() => handleWhatsApp(reserva.admin_telefono!)}
                  >
                    <Ionicons
                      name="logo-whatsapp"
                      size={20}
                      color={THEME.colors.whatsapp}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Botón de cancelar */}
      {(reserva.estado === "Pendiente" || reserva.estado === "Confirmada") && (
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.cancelButton, cancelando && styles.buttonDisabled]}
            onPress={handleCancelar}
            disabled={cancelando}
          >
            {cancelando ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.cancelButtonText}>Cancelar reserva</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <CancelReservationModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onConfirm={handleConfirmarCancelacion}
        reservationId={reserva?.id || 0}
        loading={cancelando}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.colors.surfaceLight,
    borderRadius: THEME.borderRadius.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.header.title,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: { width: 40 },
  stepsIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    backgroundColor: THEME.colors.surface,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 25,
    gap: 6,
  },
  statusText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  mainCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  espacioNombre: {
    fontSize: 24,
    fontWeight: "700",
    color: THEME.colors.text.heading,
    marginBottom: 24,
    textAlign: "center",
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  infoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.successLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: THEME.colors.text.heading,
    fontWeight: "700",
    marginBottom: 2,
  },
  infoSubtext: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
  },
  precioContainer: {
    backgroundColor: THEME.colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  precioContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  precioLabel: {
    fontSize: 16,
    color: THEME.colors.text.primary,
    fontWeight: "600",
  },
  precioValue: {
    fontSize: 24,
    color: THEME.colors.success,
    fontWeight: "700",
  },
  dividerLine: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: 12,
  },
  detailsCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  detailRow: {
    paddingVertical: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: THEME.colors.text.heading,
    fontWeight: "600",
    lineHeight: 22,
  },
  detailEmptyValue: {
    fontSize: 14,
    color: THEME.colors.text.muted,
    fontStyle: "italic",
  },
  cancelationSection: {
    marginBottom: 16,
  },
  cancelationCard: {
    backgroundColor: THEME.colors.warningLight,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.colors.error,
  },
  cancelationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  cancelationTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.colors.error,
  },
  cancelationDate: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    marginBottom: 8,
  },
  cancelationReason: {
    fontSize: 14,
    color: THEME.colors.error,
    lineHeight: 20,
  },
  contactSection: {
    marginBottom: 16,
    paddingBottom: 20,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.colors.text.heading,
    marginBottom: 12,
  },
  contactCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  contactAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: THEME.colors.success,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.colors.text.heading,
    marginBottom: 2,
  },
  contactEmail: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
  },
  contactPhone: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  contactActions: {
    flexDirection: "row",
    gap: 12,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.background,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  bottomContainer: {
    padding: 16,
    backgroundColor: THEME.colors.surface,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  cancelButton: {
    backgroundColor: THEME.colors.error,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    backgroundColor: THEME.colors.text.muted,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: THEME.colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: THEME.colors.text.secondary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    backgroundColor: THEME.colors.background,
  },
  errorText: {
    fontSize: 18,
    color: THEME.colors.error,
    textAlign: "center",
    marginTop: 16,
    marginBottom: 32,
  },
  errorButton: {
    backgroundColor: THEME.colors.success,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
