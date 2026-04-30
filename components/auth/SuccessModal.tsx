import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from "react-native";
import LottieView from "lottie-react-native";
import { THEME, COLORS } from "@/constants/theme";

const { width } = Dimensions.get("window");

interface SuccessModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  onConfirm: () => void;
}

export default function SuccessModal({
  visible,
  title,
  message,
  confirmText = "Continuar",
  onConfirm,
}: SuccessModalProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

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
      onRequestClose={onConfirm}
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <Animated.View
          style={[styles.modal, { transform: [{ scale: scaleAnim }] }]}
        >
          <View style={styles.lottieContainer}>
            <LottieView
              source={require("@/assets/lottie/SuccessCheck.json")}
              autoPlay={visible}
              loop={false}
              style={styles.lottie}
            />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <TouchableOpacity style={styles.button} onPress={onConfirm}>
            <Text style={styles.buttonText}>{confirmText}</Text>
          </TouchableOpacity>
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
  modal: {
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
  lottieContainer: {
    width: 120,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: THEME.spacing.md,
  },
  lottie: {
    width: 120,
    height: 120,
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
  button: {
    width: "100%",
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: COLORS.primary,
    alignItems: "center",
  },
  buttonText: {
    fontSize: THEME.fontSize.md,
    fontWeight: "700",
    color: COLORS.text.inverse,
  },
});
