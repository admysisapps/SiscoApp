import React, { useEffect, useRef, useCallback, useState } from "react";
import { View, Text, StyleSheet, Animated, PanResponder } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { THEME } from "@/constants/theme";

interface ToastProps {
  visible: boolean;
  message: string;
  type: "success" | "error" | "warning";
  onHide: () => void;
  duration?: number;
}

export default function Toast({
  visible,
  message,
  type,
  onHide,
  duration = 4000,
}: ToastProps) {
  const insets = useSafeAreaInsets();
  const [isVisible, setIsVisible] = useState(false);
  const [currentMessage, setCurrentMessage] = useState(message);
  const [currentType, setCurrentType] = useState(type);
  const slideAnimRef = useRef(new Animated.Value(-200));
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const onHideRef = useRef(onHide);

  useEffect(() => {
    onHideRef.current = onHide;
  }, [onHide]);

  const hideToast = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    Animated.timing(slideAnimRef.current, {
      toValue: -200,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setIsVisible(false);
      onHideRef.current();
    });
  }, []);

  // Gesture handler para swipe up
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        // Solo permitir movimiento hacia arriba
        if (gestureState.dy < 0) {
          slideAnimRef.current.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dy, vy } = gestureState;

        // Si deslizó suficiente hacia arriba O tiene velocidad hacia arriba
        if (dy < -50 || vy < -0.5) {
          hideToast();
        } else {
          // Volver a posición con spring suave
          Animated.spring(slideAnimRef.current, {
            toValue: 0,
            useNativeDriver: true,
            tension: 100,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      // Limpiar timeout anterior
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Actualizar contenido
      setCurrentMessage(message);
      setCurrentType(type);
      setIsVisible(true);

      // Haptic feedback solo para errores
      if (type === "error") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }

      // Animación de entrada
      Animated.spring(slideAnimRef.current, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }).start();

      // Timer de auto-hide
      timeoutRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [visible, message, type, duration, hideToast]);

  if (!isVisible) return null;

  const getToastStyle = () => {
    switch (currentType) {
      case "success":
        return {
          backgroundColor: "#4CAF50",
          iconName: "checkmark-circle" as const,
        };
      case "error":
        return {
          backgroundColor: "#F44336",
          iconName: "close-circle" as const,
        };
      case "warning":
        return {
          backgroundColor: "#FF9800",
          iconName: "warning" as const,
        };
      default:
        return {
          backgroundColor: THEME.colors.primary,
          iconName: "information-circle" as const,
        };
    }
  };

  const toastStyle = getToastStyle();

  // Interpolación de opacidad para desvanecimiento suave
  const opacity = slideAnimRef.current.interpolate({
    inputRange: [-200, -100, 0],
    outputRange: [0, 0.5, 1],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        { backgroundColor: toastStyle.backgroundColor },
        {
          transform: [{ translateY: slideAnimRef.current }],
          opacity: opacity,
        },
        { top: insets.top + 10 },
      ]}
    >
      <View style={styles.content}>
        <Ionicons
          name={toastStyle.iconName}
          size={24}
          color="white"
          style={styles.icon}
        />
        <Text style={styles.message}>{currentMessage}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 999999,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    color: "white",
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
});
