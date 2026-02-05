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
  const textOpacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;

    if (visible) {
      // Resetear valores al mostrar
      scaleValue.setValue(1);
      opacityValue.setValue(0.6);
      textOpacity.setValue(0.8);

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
            Animated.timing(textOpacity, {
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
            Animated.timing(textOpacity, {
              toValue: 0.8,
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
      textOpacity.setValue(0.8);
    }

    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [visible, message, scaleValue, opacityValue, textOpacity]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      statusBarTranslucent
    >
      <LinearGradient
        colors={[
          "rgba(232, 244, 255, 0.95)",
          "rgba(255, 255, 255, 0.98)",
          "rgba(232, 244, 255, 0.95)",
        ]}
        style={styles.overlay}
      >
        <View style={styles.content}>
          <Animated.View
            style={[
              styles.logoContainer,
              {
                transform: [{ scale: scaleValue }, { translateX: 20 }],
                opacity: opacityValue,
              },
            ]}
          >
            <View style={styles.logoShadow}>
              <Image
                source={require("../assets/images/logoAzul.png")}
                style={styles.logo}
                resizeMode="contain"
                onError={(error) => console.log("Error loading image:", error)}
              />
            </View>
          </Animated.View>

          <Animated.Text style={[styles.messageText, { opacity: textOpacity }]}>
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
    marginBottom: 60,
  },
  logoShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  logo: {
    width: 400,
    height: 400,
  },
  messageText: {
    marginTop: 40,
    fontSize: 16,
    color: "#0d6cf7",
    fontWeight: "500",
    letterSpacing: 0.5,
  },
});
