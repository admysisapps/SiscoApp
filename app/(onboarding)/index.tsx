import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LottieView from "lottie-react-native";
import { THEME, COLORS } from "@/constants/theme";

const { width, height } = Dimensions.get("window");

export default function OnboardingWelcome() {
  const router = useRouter();
  const animationRef = useRef<LottieView>(null);

  useFocusEffect(
    React.useCallback(() => {
      // Reanudar animación cuando la pantalla está enfocada
      animationRef.current?.play();

      return () => {
        // Pausar animación cuando la pantalla pierde el foco
        animationRef.current?.pause();
      };
    }, [])
  );

  const completeOnboarding = async (path: string) => {
    try {
      await AsyncStorage.setItem("onboardingSeen", "true");
      router.push(path as any);
    } catch (error) {
      console.error("Error setting onboarding seen:", error);
      router.push(path as any);
    }
  };

  const handleSignUp = () => {
    completeOnboarding("/(auth)/signup");
  };

  const handleLogin = () => {
    completeOnboarding("/(auth)/login");
  };

  return (
    <View style={styles.container}>
      {/* Background decorativo */}
      <View style={styles.backgroundDecoration}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <LottieView
              ref={animationRef}
              source={require("@/assets/lottie/splash.json")}
              autoPlay
              loop
              style={styles.lottieAnimation}
              speed={0.5}
              renderMode="HARDWARE"
              cacheComposition={true}
              hardwareAccelerationAndroid={true}
              resizeMode="contain"
            />
            <Text style={styles.title}>Bienvenido a Sisco</Text>
            <Text style={styles.subtitle}>
              Gestiona tu Copropiedad de manera fácil y eficiente
            </Text>
          </View>

          {/* Botones */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.signupButton}
              onPress={handleSignUp}
            >
              <Text style={styles.signupButtonText}>Crear Cuenta</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>Ya tengo cuenta</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  backgroundDecoration: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: "absolute",
    borderRadius: 1000,
    opacity: 0.08,
  },
  circle1: {
    width: width * 0.6,
    height: width * 0.6,
    backgroundColor: COLORS.primary,
    top: -width * 0.3,
    right: -width * 0.3,
  },
  circle2: {
    width: width * 0.45,
    height: width * 0.45,
    backgroundColor: COLORS.primaryLight,
    bottom: -width * 0.225,
    left: -width * 0.225,
  },
  circle3: {
    width: width * 0.3,
    height: width * 0.3,
    backgroundColor: COLORS.primary,
    top: height * 0.4,
    right: -width * 0.15,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: THEME.spacing.xl * 2,
  },
  lottieAnimation: {
    width: Math.min(width * 0.9, 400),
    height: Math.min(height * 0.35, 350),
    marginBottom: THEME.spacing.lg,
  },
  title: {
    fontSize: Math.min(28, width * 0.07),
    fontWeight: "700",
    color: COLORS.text.primary,
    textAlign: "center",
    marginBottom: THEME.spacing.md,
  },
  subtitle: {
    fontSize: THEME.fontSize.md,
    color: COLORS.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: THEME.spacing.sm,
  },
  buttonsContainer: {
    width: "100%",
  },
  signupButton: {
    backgroundColor: COLORS.primary,
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.md,
    alignItems: "center",
    marginBottom: THEME.spacing.md,
  },
  signupButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: THEME.fontSize.md,
  },
  loginButton: {
    borderRadius: THEME.borderRadius.md,
    paddingVertical: THEME.spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  loginButtonText: {
    color: COLORS.primary,
    fontWeight: "bold",
    fontSize: THEME.fontSize.md,
  },
});
