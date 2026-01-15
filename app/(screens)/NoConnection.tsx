import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import NetInfo from "@react-native-community/netinfo";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { COLORS } from "@/constants/theme";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";

const { width, height } = Dimensions.get("window");

export default function NoConnection() {
  const [isChecking, setIsChecking] = useState(false);
  const router = useRouter();
  const { retry } = useUser();
  const { isAuthenticated } = useAuth();

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        router.replace("/");
      }
    } catch (error) {
      console.error("Error checking connection:", error);
    } finally {
      setIsChecking(false);
    }
  };

  // Listener automático para cuando vuelve la conexión
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.isConnected) {
        if (isAuthenticated) {
          retry();
        }
        router.replace("/");
      }
    });

    return () => unsubscribe();
  }, [router, isAuthenticated, retry]);

  return (
    <View style={styles.container}>
      {/* Background decorativo */}
      <View style={styles.backgroundDecoration}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
        <View style={[styles.circle, styles.circle4]} />
      </View>

      <LottieView
        source={require("@/assets/lottie/NotFound.json")}
        autoPlay
        loop
        style={styles.lottieAnimation}
      />
      <Text style={styles.title} accessibilityRole="header">
        Sin conexión a internet
      </Text>
      <Text style={styles.message}>Verifica tu conexión de red</Text>

      <TouchableOpacity
        style={[styles.button, isChecking && styles.buttonDisabled]}
        onPress={checkConnection}
        disabled={isChecking}
        accessibilityRole="button"
        accessibilityLabel={
          isChecking ? "Verificando conexión" : "Intentar conectar de nuevo"
        }
        accessibilityHint="Reintenta la conexión a internet"
      >
        {isChecking ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="refresh-outline" size={20} color="#fff" />
        )}
        <Text style={styles.buttonText}>
          {isChecking ? "Verificando..." : "Intentar de nuevo"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f9fa",
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
    opacity: 0.12,
  },
  circle1: {
    width: 280,
    height: 280,
    backgroundColor: COLORS.primary,
    top: -140,
    right: -140,
  },
  circle2: {
    width: 200,
    height: 200,
    backgroundColor: COLORS.primaryLight,
    bottom: -100,
    left: -100,
  },
  circle3: {
    width: 140,
    height: 140,
    backgroundColor: COLORS.primary,
    top: height * 0.5,
    left: -70,
  },
  circle4: {
    width: 160,
    height: 160,
    backgroundColor: COLORS.primaryLight,
    top: height * 0.25,
    right: -80,
  },
  lottieAnimation: {
    width: width * 0.8,
    height: width * 0.8,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
    color: "#495057",
  },
  message: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 30,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#495057",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: "#adb5bd",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
