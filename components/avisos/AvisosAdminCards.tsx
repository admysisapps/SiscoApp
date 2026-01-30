import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRole } from "@/hooks/useRole";

export const AvisosAdminCards: React.FC = () => {
  const { isAdmin } = useRole();

  if (!isAdmin) {
    return (
      <View style={styles.container}>
        <View style={styles.noAccessCard}>
          <Ionicons name="lock-closed" size={32} color="#EF4444" />
          <Text style={styles.noAccessTitle}>Acceso Restringido</Text>
          <Text style={styles.noAccessDescription}>
            Solo los administradores pueden gestionar comunicados
          </Text>
        </View>
      </View>
    );
  }

  const handleViewAvisos = () => {
    router.push("/(screens)/avisos/AvisosScreen");
  };

  const handleCreateAviso = () => {
    router.push("/(screens)/avisos/crear-aviso");
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.card} onPress={handleViewAvisos}>
        <View style={[styles.iconContainer, styles.iconRed]}>
          <MaterialCommunityIcons
            name="comment-alert"
            size={26}
            color="#DC2626"
          />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Comunicados</Text>
          <Text style={styles.cardDescription}>Ver todos los comunicados</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={handleCreateAviso}>
        <View style={[styles.iconContainer, styles.iconRed]}>
          <Ionicons name="add-circle" size={26} color="#DC2626" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Crear Nuevo Comunicado</Text>
          <Text style={styles.cardDescription}>
            Publicar un nuevo comunicado o notificación
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.card}
        onPress={() =>
          router.push("/(screens)/publicaciones/TableroAnunciosScreen")
        }
      >
        <View style={[styles.iconContainer, styles.iconBlue]}>
          <MaterialCommunityIcons
            name="bulletin-board"
            size={26}
            color="#0EA5E9"
          />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Publicaciones</Text>
          <Text style={styles.cardDescription}>
            Ver y gestionar publicaciones de la comunidad
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
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  iconRed: {
    backgroundColor: "#DC262615",
  },
  iconBlue: {
    backgroundColor: "#0EA5E915",
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
