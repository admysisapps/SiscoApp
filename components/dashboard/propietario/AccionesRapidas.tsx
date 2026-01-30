import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { THEME } from "@/constants/theme";

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

const AccionesRapidas = React.memo(function AccionesRapidas() {
  const router = useRouter();

  const quickActions: QuickAction[] = [
    {
      id: "1",
      title: "Crear PQR",
      subtitle: "Nueva solicitud",
      icon: "add-circle",
      color: "#3B82F6",
      onPress: () => router.push("/(screens)/pqr/CrearPqrScreen"),
    },
    {
      id: "2",
      title: "Zonas Comunes",
      subtitle: "Disfruta de tu copropiedad",
      icon: "calendar",
      color: "#8B5CF6",
      onPress: () => router.push("/(screens)/reservas/zona-disponibles"),
    },
    {
      id: "3",
      title: "Mis Reservas",
      subtitle: "Ver reservas activas",
      icon: "time",
      color: "#F59E0B",
      onPress: () => router.push("/(screens)/reservas/mis-reservas"),
    },
    {
      id: "4",
      title: "Mis PQRs",
      subtitle: "Ver solicitudes",
      icon: "list",
      color: "#10B981",
      onPress: () => router.push("/(screens)/pqr/PqrListaScreen"),
    },
  ];

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Text style={styles.title}>Acciones Rápidas</Text>

        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={styles.actionCard}
              onPress={action.onPress}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${action.color}20` },
                ]}
              >
                <Ionicons name={action.icon} size={24} color={action.color} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{action.title}</Text>
                <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
});

export default AccionesRapidas;

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 1,
    marginBottom: 16,
  },
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: 16,
  },
  actionsGrid: {
    gap: 12,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
    padding: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
  },
});
