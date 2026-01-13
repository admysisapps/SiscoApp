import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import LottieView from "lottie-react-native";

const { width, height } = Dimensions.get("window");

export default function LoadingScreen() {
  const [showSlowMessage, setShowSlowMessage] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSlowMessage(true);
    }, 6000); // 6 segundos

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.lottieContainer}>
        <LottieView
          source={require("@/assets/lottie/Loading.json")}
          autoPlay
          loop
          style={styles.lottie}
          renderMode="HARDWARE"
          cacheComposition={true}
          hardwareAccelerationAndroid={true}
          resizeMode="contain"
        />
      </View>
      <View style={styles.messageContainer}>
        <Text
          style={[styles.slowMessage, { opacity: showSlowMessage ? 0.8 : 0 }]}
        >
          Esto está tardando más de lo normal...
        </Text>
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
  },
  lottieContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  lottie: {
    width: Math.min(width * 1.8, 600),
    height: Math.min(height * 0.7, 550),
  },
  messageContainer: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
  },
  slowMessage: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
