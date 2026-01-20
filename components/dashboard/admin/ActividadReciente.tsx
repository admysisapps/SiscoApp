import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";

interface Activity {
  id: string;
  type: "payment" | "pqr" | "reservation" | "assembly" | "maintenance";
  title: string;
  description: string;
  timestamp: string;
  user?: string;
  apartment?: string;
}

const mockActivities: Activity[] = [
  {
    id: "1",
    type: "payment",
    title: "Pago Recibido",
    description: "Cuota de administración Enero 2024",
    timestamp: "2024-01-15T10:30:00Z",
    user: "María González",
    apartment: "Apto 101",
  },
  {
    id: "2",
    type: "pqr",
    title: "Nueva PQR",
    description: "Solicitud de reparación en ascensor",
    timestamp: "2024-01-15T09:15:00Z",
    user: "Carlos Rodríguez",
    apartment: "Apto 205",
  },
  {
    id: "3",
    type: "reservation",
    title: "Reserva Confirmada",
    description: "Salón comunal para evento familiar",
    timestamp: "2024-01-14T16:45:00Z",
    user: "Ana Martínez",
    apartment: "Apto 304",
  },
  {
    id: "4",
    type: "assembly",
    title: "Asamblea Programada",
    description: "Asamblea ordinaria Febrero 2024",
    timestamp: "2024-01-14T14:20:00Z",
    user: "Administración",
  },
  {
    id: "5",
    type: "maintenance",
    title: "Mantenimiento Completado",
    description: "Limpieza de tanques de agua",
    timestamp: "2024-01-13T11:00:00Z",
    user: "Equipo Técnico",
  },
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case "payment":
      return "card";
    case "pqr":
      return "document-text";
    case "reservation":
      return "calendar";
    case "assembly":
      return "people";
    case "maintenance":
      return "construct";
    default:
      return "information-circle";
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case "payment":
      return "#10B981";
    case "pqr":
      return "#3B82F6";
    case "reservation":
      return "#8B5CF6";
    case "assembly":
      return "#F59E0B";
    case "maintenance":
      return "#EF4444";
    default:
      return THEME.colors.text.secondary;
  }
};

const formatTimeAgo = (timestamp: string) => {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffInHours = Math.floor(
    (now.getTime() - activityTime.getTime()) / (1000 * 60 * 60)
  );

  if (diffInHours < 1) return "Hace menos de 1 hora";
  if (diffInHours < 24) return `Hace ${diffInHours} horas`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "Hace 1 día";
  if (diffInDays < 7) return `Hace ${diffInDays} días`;

  return activityTime.toLocaleDateString("es-CO");
};

export default function ActividadReciente() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Actividad Reciente</Text>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>Ver todas</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={THEME.colors.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.activitiesList}>
        {mockActivities.map((activity, index) => (
          <View key={activity.id} style={styles.activityItem}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${getActivityColor(activity.type)}20` },
              ]}
            >
              <Ionicons
                name={
                  getActivityIcon(
                    activity.type
                  ) as keyof typeof Ionicons.glyphMap
                }
                size={18}
                color={getActivityColor(activity.type)}
              />
            </View>

            <View style={styles.activityContent}>
              <View style={styles.activityHeader}>
                <Text style={styles.activityTitle}>{activity.title}</Text>
                <Text style={styles.activityTime}>
                  {formatTimeAgo(activity.timestamp)}
                </Text>
              </View>

              <Text style={styles.activityDescription}>
                {activity.description}
              </Text>

              {(activity.user || activity.apartment) && (
                <Text style={styles.activityUser}>
                  {activity.user}
                  {activity.apartment && ` • ${activity.apartment}`}
                </Text>
              )}
            </View>

            {index < mockActivities.length - 1 && (
              <View style={styles.separator} />
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  viewAllText: {
    fontSize: 14,
    color: THEME.colors.primary,
    fontWeight: "500",
  },
  activitiesList: {
    gap: 0,
  },
  activityItem: {
    flexDirection: "row",
    paddingVertical: 12,
    position: "relative",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    flex: 1,
  },
  activityTime: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    marginLeft: 8,
  },
  activityDescription: {
    fontSize: 13,
    color: THEME.colors.text.secondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  activityUser: {
    fontSize: 12,
    color: THEME.colors.primary,
    fontWeight: "500",
  },
  separator: {
    position: "absolute",
    bottom: 0,
    left: 48,
    right: 0,
    height: 1,
    backgroundColor: "#F1F5F9",
  },
});
