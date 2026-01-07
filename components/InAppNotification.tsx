import React, { useEffect, useRef, useCallback, useMemo, memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, THEME } from "@/constants/theme";
import { InAppNotificationProps } from "@/types/Notification";

const NOTIFICATION_CONFIG = {
  icons: {
    aviso: "megaphone",
    pqr: "document-text",
    pago: "card",
    asamblea: "people",
    emergencia: "warning",
    default: "notifications",
  },
  colors: {
    emergencia: "#FF4444",
    pago: "#FF8C00",
    asamblea: "#4A90E2",
  },
  animation: {
    tension: 80,
    friction: 10,
    duration: 400,
  },
} as const;

const useNotificationAnimation = (
  visible: boolean,
  duration: number,
  onDismiss?: () => void
) => {
  const slideAnim = useRef(new Animated.Value(-400)).current;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const dismiss = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: NOTIFICATION_CONFIG.animation.duration,
      useNativeDriver: true,
    }).start(() => onDismissRef.current?.());
  }, [slideAnim]);

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: NOTIFICATION_CONFIG.animation.tension,
        friction: NOTIFICATION_CONFIG.animation.friction,
      }).start();

      timeoutRef.current = setTimeout(dismiss, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, duration, dismiss, slideAnim]);

  return { slideAnim, dismiss };
};

const InAppNotificationComponent: React.FC<InAppNotificationProps> = ({
  visible,
  title,
  body,
  type = "default",
  onPress,
  onDismiss,
  duration = 4000,
}) => {
  const { slideAnim, dismiss } = useNotificationAnimation(
    visible,
    duration,
    onDismiss
  );

  const { icon, color } = useMemo(
    () => ({
      icon:
        NOTIFICATION_CONFIG.icons[
          type as keyof typeof NOTIFICATION_CONFIG.icons
        ] || NOTIFICATION_CONFIG.icons.default,
      color:
        NOTIFICATION_CONFIG.colors[
          type as keyof typeof NOTIFICATION_CONFIG.colors
        ] || COLORS.primary,
    }),
    [type]
  );

  // Validar que haya contenido antes de renderizar
  if (!visible || !title?.trim() || !body?.trim()) return null;

  return (
    <Animated.View
      style={[styles.container, { transform: [{ translateX: slideAnim }] }]}
    >
      <TouchableOpacity
        style={styles.notification}
        onPress={onPress}
        activeOpacity={0.9}
      >
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={20} color="white" />
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.body} numberOfLines={2}>
            {body}
          </Text>
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={dismiss}>
          <Ionicons name="close" size={18} color={COLORS.text.secondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

InAppNotificationComponent.displayName = "InAppNotification";

export const InAppNotification = memo(InAppNotificationComponent);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 60,
    left: THEME.spacing.lg,
    right: THEME.spacing.lg,
    zIndex: 9999,
  },
  notification: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: THEME.spacing.lg,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: THEME.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    flex: 1,
    marginRight: THEME.spacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text.primary,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 14,
    color: COLORS.text.secondary,
    lineHeight: 18,
    fontWeight: "400",
    letterSpacing: -0.1,
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
});
