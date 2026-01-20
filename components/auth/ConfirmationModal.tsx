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
import { THEME, COLORS } from "@/constants/theme";
import LottieView from "lottie-react-native";

const { width } = Dimensions.get("window");

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

export default function ConfirmationModal({
  visible,
  title,
  message,
  confirmText = "OK",
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));

  useEffect(() => {
    if (visible) {
      // Animación de entrada
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
          {/* Animación Lottie */}
          <View style={styles.iconContainer}>
            <LottieView
              source={require("@/assets/lottie/confirmEmail.json")}
              autoPlay={visible}
              loop={false}
              style={styles.lottieAnimation}
              speed={0.5}
            />
          </View>

          {/* Contenido */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Botones */}
          <View style={styles.buttonContainer}>
            {onCancel && (
              <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.confirmButton,
                !onCancel && styles.confirmButtonFull,
              ]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.modalOverlay,
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
    shadowColor: COLORS.text.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  lottieAnimation: {
    width: 150,
    height: 150,
  },
  title: {
    fontSize: THEME.fontSize.xl,
    fontWeight: "700",
    color: COLORS.text.heading,
    textAlign: "center",
    marginBottom: THEME.spacing.sm,
  },
  message: {
    fontSize: THEME.fontSize.md,
    color: COLORS.text.secondary,
    textAlign: "center",
    lineHeight: 22,
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
  confirmButtonFull: {
    flex: 1,
  },
  confirmButtonText: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: COLORS.text.inverse,
  },
});
