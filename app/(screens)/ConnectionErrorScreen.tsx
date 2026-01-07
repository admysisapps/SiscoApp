import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import LottieView from "lottie-react-native";
import { THEME } from "@/constants/theme";
import { useUser } from "@/contexts/UserContext";
import { useRouter } from "expo-router";

const { width, height } = Dimensions.get("window");

export default function ConnectionErrorScreen() {
  const { retry } = useUser();
  const router = useRouter();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      retry();
      router.replace("/");
    } finally {
      setIsRetrying(false);
    }
  };
  return (
    <View style={styles.container}>
      <LottieView
        source={require("@/assets/lottie/lottieError500.json")}
        autoPlay
        loop
        style={styles.lottie}
        renderMode="HARDWARE"
        cacheComposition={true}
        hardwareAccelerationAndroid={true}
        resizeMode="contain"
      />

      <View style={styles.content}>
        <Text style={styles.title}>¡Vaya! Tenemos un pequeño problema</Text>
        <Text style={styles.subtitle}>
          Estamos presentando un inconveniente temporal. Por favor intenta
          nuevamente en unos momentos.
        </Text>

        <TouchableOpacity
          style={[styles.retryButton, isRetrying && styles.retryButtonDisabled]}
          onPress={handleRetry}
          disabled={isRetrying}
        >
          {isRetrying ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : null}
          <Text style={styles.retryButtonText}>
            {isRetrying ? "Reintentando..." : "Reintentar"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  lottie: {
    width: width * 2.9,
    height: Math.min(height * 0.5, 400),
    marginBottom: 40,
  },
  content: {
    alignItems: "center",
    maxWidth: 430,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 28,
    opacity: 0.9,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 36,
    paddingVertical: 18,
    borderRadius: 16,
    minWidth: 160,
    shadowColor: THEME.colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  retryButtonDisabled: {
    opacity: 0.7,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.5,
    marginLeft: 8,
  },
});
