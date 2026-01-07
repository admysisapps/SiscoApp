import React, { memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EstadoReserva } from "@/types/Reserva";

interface ReservaItem {
  id: number;
  fecha_reserva: string;
  hora_inicio: string;
  hora_fin: string;
  estado: EstadoReserva;
  precio_total: number;
  motivo?: string;
  espacio_nombre: string;
  usuario_nombre?: string;
  apartamento_codigo?: string;
}

interface ReservaCardProps {
  reserva: ReservaItem;
  isAdmin: boolean;
  onPress: (reserva: ReservaItem) => void;
  onCancel: (reserva: ReservaItem, event: any) => void;
  getEstadoColor: (estado: string) => string;
  getEstadoIcon: (estado: string) => string;
  formatDate: (dateString: string) => string;
  formatTime: (timeString: string) => string;
  formatPrice: (price: number) => string;
  styles: any;
}

const ReservaCard = memo(
  ({
    reserva,
    isAdmin,
    onPress,
    onCancel,
    getEstadoColor,
    getEstadoIcon,
    formatDate,
    formatTime,
    formatPrice,
    styles,
  }: ReservaCardProps) => {
    return (
      <TouchableOpacity
        style={styles.reservaCard}
        onPress={() => onPress(reserva)}
        activeOpacity={0.7}
      >
        {/* Header de la tarjeta */}
        <View style={styles.cardHeader}>
          <View style={styles.espacioInfo}>
            <View style={styles.espacioTitleRow}>
              <Text style={styles.espacioNombre}>
                {reserva.espacio_nombre || "Espacio"}
              </Text>
            </View>
            <View style={styles.fechaRow}>
              <Text style={styles.fechaReserva}>
                {formatDate(reserva.fecha_reserva)}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.estadoBadge,
              { backgroundColor: getEstadoColor(reserva.estado) },
            ]}
          >
            <Ionicons
              name={getEstadoIcon(reserva.estado) as any}
              size={14}
              color="white"
            />
            <Text style={styles.estadoText}>{reserva.estado}</Text>
          </View>
        </View>

        {/* Información del usuario y apartamento (solo admin) */}
        {isAdmin && (reserva.usuario_nombre || reserva.apartamento_codigo) && (
          <View style={styles.adminSection}>
            <View style={styles.adminHeader}>
              <Text style={styles.adminLabel}>Información del Propietario</Text>
            </View>
            <View style={styles.adminContent}>
              {reserva.usuario_nombre && (
                <View style={styles.adminDetailRow}>
                  <Ionicons name="person" size={16} color="#10B981" />
                  <Text style={styles.adminText}>{reserva.usuario_nombre}</Text>
                </View>
              )}
              {reserva.apartamento_codigo && (
                <View style={styles.adminDetailRow}>
                  <Ionicons name="home" size={16} color="#10B981" />
                  <Text style={styles.adminText}>
                    Apt. {reserva.apartamento_codigo}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Detalles principales */}
        <View style={styles.cardDetails}>
          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="time" size={18} color="#10B981" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Horario</Text>
                <Text style={styles.detailValue}>
                  {formatTime(reserva.hora_inicio)} -{" "}
                  {formatTime(reserva.hora_fin)}
                </Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="cash" size={18} color="#10B981" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Costo Total</Text>
                <Text style={styles.detailValue}>
                  {formatPrice(reserva.precio_total)}
                </Text>
              </View>
            </View>
          </View>

          {reserva.motivo && (
            <View style={styles.motivoSection}>
              <View style={styles.motivoHeader}>
                <Ionicons name="chatbubble-outline" size={16} color="#64748B" />
                <Text style={styles.motivoLabel}>Motivo de la reserva</Text>
              </View>
              <Text style={styles.motivoText} numberOfLines={3}>
                {reserva.motivo}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }
);

ReservaCard.displayName = "ReservaCard";

export default ReservaCard;
