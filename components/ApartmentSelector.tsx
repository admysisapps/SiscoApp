import { THEME } from "@/constants/theme";
import { useApartment } from "@/contexts/ApartmentContext";
import { useProject } from "@/contexts/ProjectContext";
import { Apartamento } from "@/types/Apartamento";
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

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
    }
  }, [modalVisible, translateY, backdropOpacity]);

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
          <View style={styles.apartmentOptionIcon}>
            <FontAwesome5
              name="home"
              size={18}
              color={
                isSelected ? THEME.colors.primary : THEME.colors.text.muted
              }
            />
          </View>
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
  }, [apartamentos, selectedApartment, handleApartmentSelect]);

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
          <LinearGradient
            colors={[THEME.colors.primary, THEME.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <FontAwesome5 name="home" size={16} color="white" />
          </LinearGradient>
          <View style={styles.contentContainer}>
            <Text style={styles.apartmentNumber}>Sin unidad asignada</Text>
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
        activeOpacity={isSelectable ? 0.7 : 1}
      >
        <LinearGradient
          colors={[THEME.colors.primary, THEME.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconContainer}
        >
          <FontAwesome5 name="home" size={16} color="white" />
        </LinearGradient>

        <View style={styles.contentContainer}>
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

        {isSelectable && (
          <Ionicons
            name="chevron-down"
            size={16}
            color={THEME.colors.text.muted}
          />
        )}
      </TouchableOpacity>

      {/* Modal de selección */}
      {modalVisible && (
        <Modal
          animationType="none"
          transparent={true}
          visible={true}
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
      )}
    </View>
  );
});

// Skeleton Component
const ApartmentSkeleton = () => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loopAnimation = Animated.loop(
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
    );
    loopAnimation.start();

    return () => {
      loopAnimation.stop();
    };
  }, [pulseAnim]);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <Animated.View style={[styles.iconContainer, { opacity }]} />
        <View style={styles.contentContainer}>
          <Animated.View
            style={[
              styles.skeletonBox,
              { width: 100, height: 14, opacity, marginBottom: 4 },
            ]}
          />
          <Animated.View
            style={[styles.skeletonBox, { width: 60, height: 12, opacity }]}
          />
        </View>
      </View>
    </View>
  );
};

export default ApartmentSelector;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    marginBottom: THEME.spacing.md,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: THEME.colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 50,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  contentContainer: {
    justifyContent: "center",
  },
  apartmentNumber: {
    fontSize: THEME.fontSize.md,
    fontWeight: "700",
    color: THEME.colors.text.primary,
  },
  apartmentBlock: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.text.secondary,
    fontWeight: "400",
    marginTop: 1,
  },
  skeletonBox: {
    backgroundColor: THEME.colors.border,
    borderRadius: 4,
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
