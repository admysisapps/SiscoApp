import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import PaymentMethodsModal from "@/components/pagos/PaymentMethodsModal";

export const ReservaMainCards: React.FC = () => {
  const {
    showModal,
    openPaymentMethods,
    closePaymentMethods,
    cuentas,
    loading,
    error,
    refreshCuentas,
  } = usePaymentMethods();

  const handleCreateReservation = () => {
    router.push("/(screens)/reservas/crear-reserva");
  };

  const handleViewReservations = () => {
    router.push("/(screens)/reservas/mis-reservas");
  };

  const handleViewSpaces = () => {
    router.push("/(screens)/reservas/zona-disponibles");
  };

  return (
    <View style={styles.container}>
      <>
        <TouchableOpacity style={styles.card} onPress={handleViewSpaces}>
          <View style={styles.iconContainer}>
            <Ionicons name="map-outline" size={32} color="#10B981" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Zonas Comunes Disponibles</Text>
            <Text style={styles.cardDescription}>
              Ver zonas comunes disponibles
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} onPress={handleCreateReservation}>
          <View style={styles.iconContainer}>
            <Ionicons name="add-circle" size={32} color="#10B981" />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardTitle}>Nueva Reserva</Text>
            <Text style={styles.cardDescription}>Reservar una zona común</Text>
          </View>
        </TouchableOpacity>
      </>

      {/* Card Ver Reservas - Para ambos roles */}
      <TouchableOpacity style={styles.card} onPress={handleViewReservations}>
        <View style={styles.iconContainer}>
          <Ionicons name="calendar-number-outline" size={32} color="#10B981" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Mis Reservas</Text>
          <Text style={styles.cardDescription}>
            Ver y gestionar mis reservas
          </Text>
        </View>
      </TouchableOpacity>

      {/* Card Métodos de Pago */}
      <TouchableOpacity style={styles.card} onPress={openPaymentMethods}>
        <View style={styles.iconContainer}>
          <Ionicons name="card" size={32} color="#10B981" />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>Informacion de Pago</Text>
          <Text style={styles.cardDescription}>
            Metodos de pago disponibles
          </Text>
        </View>
      </TouchableOpacity>

      <PaymentMethodsModal
        visible={showModal}
        onClose={closePaymentMethods}
        cuentas={cuentas}
        loading={loading}
        error={error}
        onRefresh={refreshCuentas}
      />
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
