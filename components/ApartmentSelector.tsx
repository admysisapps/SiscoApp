import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
  Animated,
  Dimensions,
  PanResponder,
  Easing,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { THEME } from "@/constants/theme";
import { useProject } from "@/contexts/ProjectContext";
import { useApartment } from "@/contexts/ApartmentContext";
import { Apartamento } from "@/types/Apartamento";

const { height } = Dimensions.get("window");

const ApartmentSelector = React.memo(function ApartmentSelector() {
  const { selectedProject } = useProject();
  const {
    selectedApartment,
    apartamentos,
    setSelectedApartment,
    isLoadingApartments,
  } = useApartment();
  const [modalVisible, setModalVisible] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(height)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (modalVisible) {
      translateY.setValue(height);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [modalVisible, pulseAnim, translateY, backdropOpacity]);

  const handleCloseModal = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setModalVisible(false);
    });
  }, [translateY, backdropOpacity]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50 || gestureState.vy > 0.5) {
          handleCloseModal();
        } else {
          Animated.timing(translateY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handleSelectApartment = useCallback(() => {
    if (apartamentos.length === 1) return;
    setModalVisible(true);
  }, [apartamentos.length]);

  const handleApartmentSelect = useCallback(
    (apartment: Apartamento) => {
      setSelectedApartment(apartment);
      handleCloseModal();
    },
    [setSelectedApartment, handleCloseModal]
  );

  const apartmentItems = useMemo(() => {
    return apartamentos.map((apt) => {
      const isSelected = selectedApartment?.id === apt.id;
      return (
        <TouchableOpacity
          key={apt.id}
          style={[
            styles.apartmentOption,
            isSelected && styles.apartmentOptionSelected,
          ]}
          onPress={() => handleApartmentSelect(apt)}
        >
          <Animated.View
            style={[
              styles.apartmentOptionIcon,
              { opacity: isSelected ? 1 : pulseAnim },
            ]}
          >
            <FontAwesome5
              name="door-closed"
              size={22}
              color={
                isSelected ? THEME.colors.primary : THEME.colors.text.muted
              }
            />
          </Animated.View>
          <View style={styles.apartmentOptionContent}>
            <Text
              style={[
                styles.apartmentOptionTitle,
                isSelected && styles.apartmentOptionTitleSelected,
              ]}
            >
              Unidad {apt.numero}
            </Text>
            {apt.bloque && (
              <Text
                style={[
                  styles.apartmentOptionSubtitle,
                  isSelected && styles.apartmentOptionSubtitleSelected,
                ]}
              >
                Bloque {apt.bloque}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      );
    });
  }, [apartamentos, selectedApartment, handleApartmentSelect, pulseAnim]);

  // Si es admin en el proyecto seleccionado, no mostrar selector
  if (selectedProject?.rolUsuario === "admin") {
    return null;
  }

  // Si está cargando, mostrar skeleton
  if (isLoadingApartments) {
    return <ApartmentSkeleton />;
  }

  // Si no hay apartamentos, mostrar con icono fijo
  if (apartamentos.length === 0) {
    return (
      <View style={styles.wrapper}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <FontAwesome5
              name="door-open"
              size={30}
              color={THEME.colors.primary}
            />
          </View>
          <View style={styles.contentContainer}>
            <Text style={styles.label}>Mi Unidad</Text>
            <Text style={styles.noApartmentsText}>
              No se encontraron unidades
            </Text>
          </View>
        </View>
      </View>
    );
  }

  const isSelectable = apartamentos.length > 1;

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={styles.card}
        onPress={handleSelectApartment}
        disabled={!isSelectable}
        activeOpacity={isSelectable ? 0.8 : 1}
      >
        <View style={styles.iconContainer}>
          <FontAwesome5
            name="door-open"
            size={30}
            color={THEME.colors.primary}
          />
        </View>

        <View style={styles.contentContainer}>
          <Text style={styles.label}>Mi Unidad</Text>
          <View style={styles.apartmentInfo}>
            <Text style={styles.apartmentNumber}>
              {selectedApartment
                ? `Unidad ${selectedApartment.numero}`
                : "Sin asignar"}
            </Text>
            {selectedApartment?.bloque && (
              <Text style={styles.apartmentBlock}>
                Bloque {selectedApartment.bloque}
              </Text>
            )}
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
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleCloseModal}
        statusBarTranslucent
      >
        <GestureHandlerRootView style={{ flex: 1 }}>
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[styles.backdrop, { opacity: backdropOpacity }]}
            >
              <TouchableOpacity
                style={styles.backdropTouch}
                activeOpacity={1}
                onPress={handleCloseModal}
              />
            </Animated.View>
            <Animated.View
              style={[styles.modalContent, { transform: [{ translateY }] }]}
            >
              <View {...panResponder.panHandlers}>
                <View style={styles.modalHandle} />
              </View>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Seleccionar Unidad</Text>
              </View>

              <ScrollView contentContainerStyle={styles.apartmentsList}>
                {apartmentItems}
              </ScrollView>
            </Animated.View>
          </View>
        </GestureHandlerRootView>
      </Modal>
    </View>
  );
});

// Skeleton Component
const ApartmentSkeleton = () => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.iconContainer}>
          <FontAwesome5
            name="door-open"
            size={30}
            color={THEME.colors.primary}
          />
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.apartmentInfo}>
            <Animated.View
              style={[
                styles.skeletonBox,
                {
                  width: 60,
                  height: THEME.fontSize.xs,
                  opacity,
                  marginBottom: 4,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.skeletonBox,
                {
                  width: 100,
                  height: THEME.fontSize.lg,
                  opacity,
                  marginBottom: 2,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.skeletonBox,
                { width: 75, height: THEME.fontSize.sm, opacity },
              ]}
            />
          </View>
        </View>
        <View style={styles.rightContainer} />
      </View>
    </View>
  );
};

export default ApartmentSelector;

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 1,
    marginBottom: THEME.spacing.lg,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  iconContainer: {
    width: 52,
    height: 52,
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
    width: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  skeletonBox: {
    backgroundColor: THEME.colors.border,
    borderRadius: 4,
  },
  noApartmentsText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.error,
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.colors.modalOverlay,
  },
  backdropTouch: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: THEME.colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: THEME.colors.border,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  modalTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  apartmentsList: {
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.xxl,
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
    width: 40,
    height: 40,
    borderRadius: 20,
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
