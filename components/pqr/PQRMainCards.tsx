import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useRole } from "@/hooks/useRole";

export const PqrMainCards: React.FC = () => {
  const { isAdmin } = useRole();

  const handleCreatePQR = () => {
    router.push("/(screens)/pqr/CrearPqrScreen");
  };

  const handleViewPQRs = () => {
    router.push("/(screens)/pqr/PqrListaScreen");
  };

  const handleViewDocuments = () => {
    router.push("/(screens)/documentos/documentos");
  };

  return (
    <View style={styles.container}>
      {/* Card Crear PQR - Solo para usuarios */}
      {!isAdmin && (
        <TouchableOpacity
          testID="button-crear-pqr"
          style={styles.card}
          onPress={handleCreatePQR}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="add-circle" size={26} color="#4F46E5" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Crear nueva PQR</Text>
            <Text style={styles.cardDescription}>
              Envía una petición, queja o reclamo
            </Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Card Ver PQRs */}
      <TouchableOpacity style={styles.card} onPress={handleViewPQRs}>
        <View style={styles.iconContainer}>
          <Ionicons name="list-circle" size={26} color="#4F46E5" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>
            {isAdmin ? "Gestionar PQRs" : "Mis PQRs"}
          </Text>
          <Text style={styles.cardDescription}>
            {isAdmin
              ? "Ver y administrar todas las PQRs"
              : "Ver y gestionar mis solicitudes"}
          </Text>
        </View>
      </TouchableOpacity>

      {/* Card Documentos - Solo para usuarios */}
      {!isAdmin && (
        <TouchableOpacity style={styles.card} onPress={handleViewDocuments}>
          <View style={styles.iconContainer}>
            <Ionicons name="document-text" size={26} color="#4F46E5" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Documentos</Text>
            <Text style={styles.cardDescription}>
              Ver documentos de la copropiedad
            </Text>
          </View>
        </TouchableOpacity>
      )}
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
    backgroundColor: "#4F46E515",
    alignItems: "center",
    justifyContent: "center",
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
