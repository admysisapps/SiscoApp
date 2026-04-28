import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { THEME } from "@/constants/theme";
import IndicadoresCopropiedad from "@/components/dashboard/admin/IndicadoresCopropiedad";

interface AccionItem {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

const DashboardContador = React.memo(function DashboardContador() {
  const router = useRouter();

  const acciones: AccionItem[] = [
    {
      id: "pqr",
      title: "Gestión de PQRs",
      subtitle: "Administra todas las solicitudes",
      icon: "document-text-outline",
      color: "#4F46E5",
      onPress: () => router.push("/(screens)/pqr/PqrListaScreen"),
    },
    {
      id: "perfil",
      title: "Mi Perfil",
      subtitle: "Cuenta y configuración",
      icon: "person-circle-outline",
      color: "#059669",
      onPress: () => router.push("/(contador)/perfil"),
    },
  ];

  return (
    <View style={styles.container}>
      <IndicadoresCopropiedad />

      <View style={styles.card}>
        {/* <Text style={styles.cardTitle}>Acciones</Text> */}
        <View style={styles.actionsGrid}>
          {acciones.map((accion) => (
            <TouchableOpacity
              key={accion.id}
              style={styles.actionCard}
              onPress={accion.onPress}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: `${accion.color}20` },
                ]}
              >
                <Ionicons name={accion.icon} size={24} color={accion.color} />
              </View>
              <View style={styles.actionContent}>
                <Text style={styles.actionTitle}>{accion.title}</Text>
                <Text style={styles.actionSubtitle}>{accion.subtitle}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={THEME.colors.text.muted}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
});

export default DashboardContador;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.colors.text.primary,
    marginBottom: 12,
  },
  actionsGrid: {
    gap: 10,
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
