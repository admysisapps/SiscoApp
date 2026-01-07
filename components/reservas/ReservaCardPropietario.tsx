import React, { memo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EstadoReserva } from "@/types/Reserva";
import dayjs from "dayjs";

interface ReservaItem {
  id: number;
  fecha_reserva: string;
  hora_inicio: string;
  hora_fin: string;
  estado: EstadoReserva;
  precio_total: number;
  motivo?: string;
  espacio_nombre: string;
}

interface Props {
  reserva: ReservaItem;
  onPress: (reserva: ReservaItem) => void;
  onCancel: (reserva: ReservaItem, event: any) => void;
  styles: any;
}

const ESTADO_COLORS = {
  Confirmada: "#10B981",
  Pendiente: "#F59E0B",
  Cancelada: "#EF4444",
  Rechazada: "#dc2626",
} as const;

const ESTADO_ICONS = {
  Confirmada: "checkmark-circle",
  Pendiente: "time",
  Cancelada: "close-circle",
  Rechazada: "ban",
} as const;

const ReservaCardPropietario = memo(
  ({ reserva, onPress, onCancel, styles }: Props) => {
    const estadoColor = ESTADO_COLORS[reserva.estado] || "#64748B";
    const estadoIcon = ESTADO_ICONS[reserva.estado] || "help-circle";
    const fechaFormateada = dayjs(reserva.fecha_reserva).format(
      "dddd, DD [de] MMMM [de] YYYY"
    );
    const horaInicio =
      reserva.hora_inicio?.split(":").slice(0, 2).join(":") || "";
    const horaFin = reserva.hora_fin?.split(":").slice(0, 2).join(":") || "";
    const precio = `$${reserva.precio_total.toLocaleString()}`;

    return (
      <TouchableOpacity
        style={styles.reservaCard}
        onPress={() => onPress(reserva)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.espacioInfo}>
            <View style={styles.espacioTitleRow}>
              <Text style={styles.espacioNombre}>
                {reserva.espacio_nombre || "Espacio"}
              </Text>
            </View>
            <View style={styles.fechaRow}>
              <Text style={styles.fechaReserva}>{fechaFormateada}</Text>
            </View>
          </View>
          <View style={[styles.estadoBadge, { backgroundColor: estadoColor }]}>
            <Ionicons name={estadoIcon as any} size={14} color="white" />
            <Text style={styles.estadoText}>{reserva.estado}</Text>
          </View>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.detailsGrid}>
            <View style={styles.detailCard}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="time" size={18} color="#10B981" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Horario</Text>
                <Text style={styles.detailValue}>
                  {horaInicio} - {horaFin}
                </Text>
              </View>
            </View>

            <View style={styles.detailCard}>
              <View style={styles.detailIconContainer}>
                <Ionicons name="cash" size={18} color="#10B981" />
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Costo Total</Text>
                <Text style={styles.detailValue}>{precio}</Text>
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

ReservaCardPropietario.displayName = "ReservaCardPropietario";

export default ReservaCardPropietario;
