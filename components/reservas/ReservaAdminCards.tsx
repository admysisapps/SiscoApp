import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRole } from "@/hooks/useRole";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

export const ReservaAdminCards: React.FC = () => {
  const { isAdmin } = useRole();

  // SEGURIDAD: Solo admins pueden ver las tarjetas
  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.noAccessCard}>
          <Ionicons name="lock-closed" size={32} color="#EF4444" />
          <Text style={styles.noAccessTitle}>Acceso Restringido</Text>
          <Text style={styles.noAccessDescription}>
            Solo los administradores pueden gestionar zonas comunes
          </Text>
        </View>
      </View>
    );
  }

  const handleManageSpaces = () => {
    router.push("/(screens)/reservas/admin/gestionar-espacios");
  };

  const handleViewReservations = () => {
    router.push("/(screens)/reservas/mis-reservas");
  };

  return (
    <View style={styles.container}>
      {/* Card zonas comunees */}
      <TouchableOpacity style={styles.card} onPress={handleManageSpaces}>
        <View style={styles.iconContainer}>
          <FontAwesome6 name="gear" size={34} color="#10B981" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Gestionar zonas comunes </Text>
          <Text style={styles.cardDescription}>
            Crear, editar zonas comunes
          </Text>
        </View>
      </TouchableOpacity>

      {/* Card Gestionar Reservas */}
      <TouchableOpacity style={styles.card} onPress={handleViewReservations}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="calendar-search"
            size={34}
            color="#10B981"
          />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Gestionar Reservas</Text>
          <Text style={styles.cardDescription}>
            Ver y administrar todas las reservas
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
  },
  noAccessCard: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  noAccessTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#EF4444",
    marginTop: 8,
    marginBottom: 4,
  },
  noAccessDescription: {
    fontSize: 14,
    color: "#7F1D1D",
    textAlign: "center",
    lineHeight: 20,
  },
});
