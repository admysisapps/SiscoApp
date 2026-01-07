import React, { useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { THEME, COLORS } from "@/constants/theme";
import LottieView from "lottie-react-native";
import { getCrashlytics, log } from "@react-native-firebase/crashlytics";

interface AccessDeniedProps {
  reason?: "no_projects" | "projects_inactive";
}

export default function AccessDenied({
  reason = "no_projects",
}: AccessDeniedProps = {}) {
  const { logout } = useAuth();
  const router = useRouter();
  const animationRef = useRef<LottieView>(null);

  const getMessage = () => {
    switch (reason) {
      case "projects_inactive":
        return "El proyecto al que tenías acceso ha sido desactivado.\nContacta al administrador para más información.";
      default:
        return "Tu acceso a la aplicación está restringido.\nPor favor, contacta al administrador para solicitar acceso.";
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      animationRef.current?.pause();
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const handleLogout = async () => {
    try {
      // Registrar evento en Crashlytics
      const crashlytics = getCrashlytics();
      log(crashlytics, "Usuario cerró sesión desde AccessDenied screen");

      await logout();
      // Navegar explícitamente a login
      router.replace("/(auth)/login");
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <LottieView
            ref={animationRef}
            source={require("@/assets/lottie/AccessDenied.json")}
            autoPlay
            loop={false}
            speed={0.5}
            style={styles.lottieAnimation}
          />
        </View>

        <Text style={styles.title}>Acceso Denegado</Text>

        <Text style={styles.message}>{getMessage()}</Text>

        <TouchableOpacity style={styles.button} onPress={handleLogout}>
          <Ionicons
            name="log-out-outline"
            size={20}
            color={COLORS.text.inverse}
            style={styles.buttonIcon}
          />
          <Text style={styles.buttonText}>Salir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: THEME.spacing.xl,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: THEME.spacing.xxl,
  },
  lottieAnimation: {
    width: 150,
    height: 150,
  },
  title: {
    fontSize: THEME.fontSize.xxl,
    fontWeight: "bold",
    color: COLORS.error,
    marginBottom: THEME.spacing.md,
    textAlign: "center",
  },
  message: {
    fontSize: THEME.fontSize.md,
    textAlign: "center",
    color: COLORS.text.secondary,
    marginBottom: THEME.spacing.xxl,
    lineHeight: 24,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.error,
    paddingHorizontal: THEME.spacing.xxl,
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonIcon: {
    marginRight: THEME.spacing.sm,
  },
  buttonText: {
    color: COLORS.text.inverse,
    fontSize: THEME.fontSize.md,
    fontWeight: "bold",
  },
});
