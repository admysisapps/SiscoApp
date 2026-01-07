import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME, COLORS } from "@/constants/theme";

const { width } = Dimensions.get("window");

interface ConfirmarCreacionModalProps {
  visible: boolean;
  cedula: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmarCreacionModal: React.FC<ConfirmarCreacionModalProps> = ({
  visible,
  cedula,
  onConfirm,
  onCancel,
}) => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, scaleAnim]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: fadeAnim,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.overlayTouch}
          activeOpacity={1}
          onPress={onCancel}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <Ionicons name="person-add" size={32} color={COLORS.primary} />
          </View>

          <Text style={styles.title}>Crear Nuevo Usuario</Text>
          <Text style={styles.message}>
            Se creará un nuevo usuario con la cédula:
          </Text>
          <Text style={styles.cedula}>{cedula}</Text>
          <Text style={styles.subtitle}>
            ¿Desea continuar con el formulario de registro?
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmButtonText}>Continuar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  overlayTouch: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.xl,
    marginHorizontal: THEME.spacing.lg,
    width: width - THEME.spacing.lg * 2,
    maxWidth: 400,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primaryLight + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: THEME.spacing.lg,
  },
  title: {
    fontSize: THEME.fontSize.xl,
    fontWeight: "700",
    color: COLORS.text.primary,
    textAlign: "center",
    marginBottom: THEME.spacing.sm,
  },
  message: {
    fontSize: THEME.fontSize.md,
    color: COLORS.text.secondary,
    textAlign: "center",
    marginBottom: THEME.spacing.xs,
  },
  cedula: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: COLORS.primary,
    textAlign: "center",
    marginBottom: THEME.spacing.sm,
  },
  subtitle: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.text.secondary,
    textAlign: "center",
    marginBottom: THEME.spacing.xl,
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
    gap: THEME.spacing.sm,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: COLORS.text.secondary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  confirmButtonText: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: "white",
  },
});
