import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { THEME } from "@/constants/theme";

interface UserActivity {
  id: string;
  type: "pqr" | "reservation" | "payment" | "document";
  title: string;
  description: string;
  status: "pending" | "approved" | "completed" | "cancelled";
  timestamp: string;
}

const mockActivities: UserActivity[] = [
  {
    id: "1",
    type: "pqr",
    title: "PQR #001234",
    description: "Solicitud de reparación en ascensor",
    status: "pending",
    timestamp: "2024-01-14T16:30:00Z",
  },
  {
    id: "2",
    type: "reservation",
    title: "Reserva Salón Comunal",
    description: "Evento familiar - 20 de Enero",
    status: "approved",
    timestamp: "2024-01-13T10:15:00Z",
  },
  {
    id: "3",
    type: "payment",
    title: "Pago Procesado",
    description: "Cuota de administración Enero 2024",
    status: "completed",
    timestamp: "2024-01-12T14:20:00Z",
  },
  {
    id: "4",
    type: "document",
    title: "Documento Descargado",
    description: "Acta de asamblea Diciembre 2023",
    status: "completed",
    timestamp: "2024-01-11T09:45:00Z",
  },
];

const getActivityIcon = (type: string) => {
  switch (type) {
    case "pqr":
      return "document-text";
    case "reservation":
      return "calendar";
    case "payment":
      return "card";
    case "document":
      return "folder-open";
    default:
      return "information-circle";
  }
};

const getActivityColor = (type: string) => {
  switch (type) {
    case "pqr":
      return "#3B82F6";
    case "reservation":
      return "#8B5CF6";
    case "payment":
      return "#10B981";
    case "document":
      return "#F59E0B";
    default:
      return THEME.colors.text.secondary;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "completed":
      return "#10B981";
    case "approved":
      return "#3B82F6";
    case "pending":
      return "#F59E0B";
    case "cancelled":
      return "#EF4444";
    default:
      return THEME.colors.text.secondary;
  }
};

const getStatusText = (status: string) => {
  switch (status) {
    case "completed":
      return "Completado";
    case "approved":
      return "Aprobado";
    case "pending":
      return "Pendiente";
    case "cancelled":
      return "Cancelado";
    default:
      return status;
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

export default function UserActivity() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Actividad Reciente</Text>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() =>
            console.log("Ver toda la actividad - Pendiente implementar")
          }
        >
          <Text style={styles.viewAllText}>Ver todo</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={THEME.colors.primary}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.activitiesList}>
        {mockActivities.map((activity, index) => (
          <TouchableOpacity
            key={activity.id}
            style={styles.activityItem}
            activeOpacity={0.7}
          >
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
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: `${getStatusColor(activity.status)}20` },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(activity.status) },
                    ]}
                  >
                    {getStatusText(activity.status)}
                  </Text>
                </View>
              </View>

              <Text style={styles.activityDescription}>
                {activity.description}
              </Text>

              <Text style={styles.activityTime}>
                {formatTimeAgo(activity.timestamp)}
              </Text>
            </View>

            {index < mockActivities.length - 1 && (
              <View style={styles.separator} />
            )}
          </TouchableOpacity>
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
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  activityDescription: {
    fontSize: 13,
    color: THEME.colors.text.secondary,
    marginBottom: 4,
    lineHeight: 18,
  },
  activityTime: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
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
