import React from "react";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
export const AvisosUserCards: React.FC = () => {
  const handleViewAvisos = () => {
    router.push("/(screens)/avisos/AvisosScreen" as any);
  };

  const handleViewTablero = () => {
    router.push("/(screens)/publicaciones/TableroAnunciosScreen" as any);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.card} onPress={handleViewAvisos}>
        <View style={styles.iconContainer}>
          <MaterialIcons name="announcement" size={32} color="#DC2626" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Ver Comunicados</Text>
          <Text style={styles.cardDescription}>
            Ver comunicados y notificaciones importantes
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity style={styles.card} onPress={handleViewTablero}>
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name="bulletin-board"
            size={32}
            color="#DC2626"
          />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Tablero de Publicaciones</Text>
          <Text style={styles.cardDescription}>
            Ver tablero de publicaciones y anuncios
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
});
