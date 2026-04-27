import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import dayjs from "dayjs";

export type MensajeRol = "admin" | "contador" | "propietario";

export interface Mensaje {
  id: number;
  mensaje: string;
  es_admin: boolean;
  rol?: MensajeRol;
  fecha_creacion: string;
  nombre_usuario?: string;
}

interface PqrChatMessageProps {
  mensaje: Mensaje;
  rolActual: MensajeRol;
}

const ROL_CONFIG: Record<
  MensajeRol,
  {
    color: string;
    icon: React.ComponentProps<typeof Ionicons>["name"];
    label: string;
  }
> = {
  admin: { color: "#10b981", icon: "shield", label: "Admin" },
  contador: { color: "#6366f1", icon: "calculator", label: "Contador" },
  propietario: { color: "#013973", icon: "person", label: "Propietario" },
};

const formatearFecha = (fecha: string) =>
  dayjs(fecha).subtract(5, "hour").format("DD/MM/YYYY HH:mm");

export default function PqrChatMessage({
  mensaje,
  rolActual,
}: PqrChatMessageProps) {
  const rol: MensajeRol =
    mensaje.rol ?? (mensaje.es_admin ? "admin" : "propietario");
  const esMio = rol === rolActual;
  const config = ROL_CONFIG[rol];

  return (
    <View style={[styles.row, esMio ? styles.rowRight : styles.rowLeft]}>
      {!esMio && (
        <View style={[styles.avatar, { backgroundColor: config.color }]}>
          <Ionicons name={config.icon} size={16} color="white" />
        </View>
      )}

      <View style={styles.bubble}>
        {!esMio && (
          <Text style={[styles.rolLabel, { color: config.color }]}>
            {mensaje.nombre_usuario || config.label}
          </Text>
        )}
        <Text style={styles.text}>{mensaje.mensaje}</Text>
        <Text style={styles.time}>
          {formatearFecha(mensaje.fecha_creacion)}
        </Text>
      </View>

      {esMio && (
        <View style={[styles.avatar, { backgroundColor: config.color }]}>
          <Ionicons name={config.icon} size={16} color="white" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
  },
  rowRight: {
    justifyContent: "flex-end",
  },
  rowLeft: {
    justifyContent: "flex-start",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  bubble: {
    maxWidth: "75%",
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 8,
  },
  rolLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
  },
  text: {
    fontSize: 14,
    color: "#1e293b",
    lineHeight: 18,
  },
  time: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 4,
  },
});
