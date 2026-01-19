import React, { useState, useMemo, useCallback } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { THEME } from "@/constants/theme";
import { useProject } from "@/contexts/ProjectContext";
import { useApartment } from "@/contexts/ApartmentContext";
import { Apartamento } from "@/types/Apartamento";

const ApartmentSelector = React.memo(function ApartmentSelector() {
  const { selectedProject } = useProject();
  const {
    selectedApartment,
    apartamentos,
    setSelectedApartment,
    isLoadingApartments,
  } = useApartment();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelectApartment = useCallback(() => {
    if (apartamentos.length === 1) return;
    setModalVisible(true);
  }, [apartamentos.length]);

  const handleApartmentSelect = useCallback(
    (apartment: Apartamento) => {
      setSelectedApartment(apartment);
      setModalVisible(false);
    },
    [setSelectedApartment]
  );

  const apartmentItems = useMemo(() => {
    return apartamentos.map((apt) => (
      <TouchableOpacity
        key={apt.id}
        style={[
          styles.apartmentOption,
          selectedApartment?.id === apt.id && styles.apartmentOptionSelected,
        ]}
        onPress={() => handleApartmentSelect(apt)}
      >
        <View style={styles.apartmentOptionIcon}>
          <Ionicons
            name="key-sharp"
            size={20}
            color={
              selectedApartment?.id === apt.id
                ? THEME.colors.primary
                : THEME.colors.text.muted
            }
          />
        </View>
        <View style={styles.apartmentOptionContent}>
          <Text
            style={[
              styles.apartmentOptionTitle,
              selectedApartment?.id === apt.id &&
                styles.apartmentOptionTitleSelected,
            ]}
          >
            Unidad {apt.numero}
          </Text>
          <Text
            style={[
              styles.apartmentOptionSubtitle,
              selectedApartment?.id === apt.id &&
                styles.apartmentOptionSubtitleSelected,
            ]}
          >
            Bloque {apt.bloque}
          </Text>
        </View>
        {selectedApartment?.id === apt.id && (
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={THEME.colors.primary}
          />
        )}
      </TouchableOpacity>
    ));
  }, [apartamentos, selectedApartment, handleApartmentSelect]);

  // Si es admin en el proyecto seleccionado, no mostrar selector
  if (selectedProject?.rol_usuario === "admin") {
    return null;
  }

  // Si está cargando, mostrar loading
  if (isLoadingApartments) {
    return (
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <ActivityIndicator size="small" color={THEME.colors.primary} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.label}>Mi Unidad</Text>
          <Text style={styles.loadingText}>Cargando unidades...</Text>
        </View>
      </View>
    );
  }

  // Si no hay , no mostrar
  if (apartamentos.length === 0) {
    return (
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <Ionicons name="key-sharp" size={24} color={THEME.colors.primary} />
        </View>
        <View style={styles.contentContainer}>
          <Text style={styles.label}>Mi Unidad</Text>
          <Text style={styles.noApartmentsText}>
            No se encontraron unidades
          </Text>
        </View>
      </View>
    );
  }

  const isSelectable = apartamentos.length > 1;

  return (
    <>
      <TouchableOpacity
        style={[styles.card, !isSelectable && styles.cardDisabled]}
        onPress={handleSelectApartment}
        disabled={!isSelectable}
        activeOpacity={isSelectable ? 0.8 : 1}
      >
        <View style={styles.iconContainer}>
          {isSelectable ? (
            <MaterialCommunityIcons
              name="key-chain-variant"
              size={24}
              color={THEME.colors.primary}
            />
          ) : (
            <Ionicons name="key-sharp" size={24} color={THEME.colors.primary} />
          )}
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.label}>Mi Unidad</Text>
          <View style={styles.apartmentInfo}>
            <Text style={styles.apartmentNumber}>
              {selectedApartment
                ? `Unidad ${selectedApartment.numero}`
                : "Sin asignar"}
            </Text>
            <Text style={styles.apartmentBlock}>
              {selectedApartment
                ? `Bloque ${selectedApartment.bloque}`
                : "No disponible"}
            </Text>
          </View>
        </View>

        <View style={styles.rightContainer}>
          {isSelectable && (
            <Ionicons
              name="chevron-down"
              size={20}
              color={THEME.colors.text.muted}
            />
          )}
        </View>
      </TouchableOpacity>

      {/* Modal de selección */}
      {modalVisible && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <SafeAreaView style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleccionar Unidad</Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Ionicons
                    name="close"
                    size={24}
                    color={THEME.colors.text.muted}
                  />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.apartmentsList}>
                {apartmentItems}
              </ScrollView>
            </View>
          </SafeAreaView>
        </Modal>
      )}
    </>
  );
});

export default ApartmentSelector;

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardDisabled: {
    opacity: 0.9,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: THEME.spacing.md,
  },
  contentContainer: {
    flex: 1,
  },
  label: {
    fontSize: THEME.fontSize.xs,
    fontWeight: "500",
    color: THEME.colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  apartmentInfo: {
    flex: 1,
  },
  apartmentNumber: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: 2,
  },
  apartmentBlock: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    fontWeight: "400",
  },
  rightContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.muted,
    fontStyle: "italic",
  },
  noApartmentsText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.error,
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalContent: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHandle: {
    width: 36,
    height: 5,
    backgroundColor: THEME.colors.border,
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  modalTitle: {
    fontSize: THEME.fontSize.xl,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  apartmentsList: {
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.xl,
  },
  apartmentOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.sm,
    backgroundColor: THEME.colors.surfaceLight,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  apartmentOptionSelected: {
    backgroundColor: THEME.colors.primaryLight + "20",
    borderColor: THEME.colors.primary,
  },
  apartmentOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.surface,
    justifyContent: "center",
    alignItems: "center",
    marginRight: THEME.spacing.md,
  },
  apartmentOptionContent: {
    flex: 1,
  },
  apartmentOptionTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: 2,
  },
  apartmentOptionTitleSelected: {
    color: THEME.colors.primary,
  },
  apartmentOptionSubtitle: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
  },
  apartmentOptionSubtitleSelected: {
    color: THEME.colors.primary,
  },
});
