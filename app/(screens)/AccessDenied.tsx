import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { THEME, COLORS } from "@/constants/theme";
import LottieView from "lottie-react-native";
import { getCrashlytics, log } from "@react-native-firebase/crashlytics";

const { height } = Dimensions.get("window");

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
        return "El proyecto asociado a tu cuenta no se encuentra activo actualmente.";
      default:
        return "Tu acceso a la app presenta una restricción\nPor favor, contacta al soporte.";
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
      {/* Background decorativo */}
      <View style={styles.backgroundDecoration}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

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
    width: 180,
    height: 180,
    backgroundColor: COLORS.primaryLight,
    top: -90,
    left: -90,
  },
  circle2: {
    width: 250,
    height: 250,
    backgroundColor: COLORS.primary,
    bottom: -125,
    right: -125,
  },
  circle3: {
    width: 120,
    height: 120,
    backgroundColor: COLORS.primary,
    top: height * 0.3,
    left: -60,
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
