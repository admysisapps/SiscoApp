import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";

type ModalType = "confirm" | "error" | "warning" | "info";
type ErrorType = "validation" | "connection" | "general";

interface ConfirmModalProps {
  visible: boolean;
  type?: ModalType;
  errorType?: ErrorType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel: () => void;
  showCancel?: boolean;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  type = "confirm",
  errorType = "general",
  title,
  message,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  showCancel = true,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
    }
  }, [visible, scaleAnim, fadeAnim]);

  const getIconConfig = () => {
    if (type === "confirm") {
      return {
        name: "help-circle" as const,
        color: THEME.colors.warning,
        size: 64,
      };
    }

    if (type === "error") {
      if (errorType === "validation") {
        return {
          name: "warning" as const,
          color: THEME.colors.warning,
          size: 64,
        };
      }
      if (errorType === "connection") {
        return {
          name: "cloud-offline" as const,
          color: THEME.colors.error,
          size: 64,
        };
      }
      return {
        name: "alert-circle" as const,
        color: THEME.colors.error,
        size: 64,
      };
    }

    if (type === "warning") {
      return {
        name: "warning" as const,
        color: THEME.colors.warning,
        size: 64,
      };
    }

    return {
      name: "information-circle" as const,
      color: THEME.colors.info,
      size: 64,
    };
  };

  const getButtonColor = () => {
    if (type === "confirm") return THEME.colors.error;
    if (type === "error") return THEME.colors.primary;
    if (type === "warning") return THEME.colors.warning;
    return THEME.colors.primary;
  };

  const iconConfig = getIconConfig();
  const buttonColor = getButtonColor();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name={iconConfig.name}
              size={iconConfig.size}
              color={iconConfig.color}
            />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonsContainer}>
            {showCancel && (
              <TouchableOpacity
                style={[styles.button, styles.buttonSecondary]}
                onPress={onCancel}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color={THEME.colors.text.secondary}
                />
                <Text style={styles.buttonTextSecondary} numberOfLines={1}>
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.button,
                styles.buttonPrimary,
                { backgroundColor: buttonColor },
                !showCancel && styles.buttonFull,
              ]}
              onPress={() => {
                if (onConfirm) {
                  onConfirm();
                } else {
                  onCancel();
                }
              }}
            >
              <Ionicons name="checkmark" size={24} color="white" />
              <Text style={styles.buttonTextPrimary} numberOfLines={1}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: THEME.colors.modalOverlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  container: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    width: "90%",
    maxWidth: 400,
  },
  iconContainer: {
    marginBottom: THEME.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: THEME.colors.text.heading,
    marginBottom: THEME.spacing.sm,
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    color: THEME.colors.text.secondary,
    textAlign: "center",
    marginBottom: THEME.spacing.xl,
    lineHeight: 22,
  },
  buttonsContainer: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: THEME.borderRadius.lg,
    gap: 6,
    minHeight: 50,
  },
  buttonFull: {
    flex: 1,
  },
  buttonPrimary: {
    backgroundColor: THEME.colors.primary,
  },
  buttonSecondary: {
    backgroundColor: THEME.colors.border,
  },
  buttonTextPrimary: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "center",
  },
  buttonTextSecondary: {
    color: THEME.colors.text.secondary,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
    textAlign: "center",
  },
});

export default ConfirmModal;
