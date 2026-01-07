import React, { useEffect, useRef } from "react";
import { Modal, View, Animated, StyleSheet, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export default function LoadingOverlay({
  visible,
  message = "Cargando...",
}: LoadingOverlayProps) {
  const scaleValue = useRef(new Animated.Value(1)).current;
  const opacityValue = useRef(new Animated.Value(0.6)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    if (visible) {
      // Resetear valores al mostrar
      scaleValue.setValue(1);
      opacityValue.setValue(0.6);
      fadeValue.setValue(0);

      // Animación de entrada suave
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      animation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(scaleValue, {
              toValue: 1.1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(opacityValue, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(scaleValue, {
              toValue: 1,
              duration: 1500,
              useNativeDriver: true,
            }),
            Animated.timing(opacityValue, {
              toValue: 0.7,
              duration: 1500,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      animation.start();
    } else {
      // Resetear inmediatamente al ocultar
      scaleValue.setValue(1);
      opacityValue.setValue(0.6);
      fadeValue.setValue(0);
    }

    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [visible, message, scaleValue, opacityValue, fadeValue]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <LinearGradient
        colors={["#0F0F0F", "#1A1A2E", "#0F0F0F"]}
        style={styles.overlay}
      >
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: scaleValue }],
                opacity: opacityValue,
              },
            ]}
          >
            <View style={styles.logoShadow}>
              <Image
                source={require("../assets/images/sw.png")}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
          </Animated.View>

          <Animated.Text style={[styles.messageText, { opacity: fadeValue }]}>
            {message}
          </Animated.Text>
        </View>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    alignItems: "center",
  },
  logoContainer: {
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
  },
  logoShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    width: 160,
    height: 160,
  },
  messageText: {
    marginTop: 20,
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
    letterSpacing: 0.5,
  },
});
