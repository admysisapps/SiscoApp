import React, { useEffect } from "react";
import { Stack, useRouter } from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/contexts/AuthContext";

export default function OnboardingLayout() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const checkOnboardingSeen = async () => {
      if (isAuthenticated) {
        router.replace("/");
        return;
      }
      const seen = await AsyncStorage.getItem("onboardingSeen");
      if (seen === "true") {
        router.replace("/(auth)/login");
      }
    };
    checkOnboardingSeen();
  }, [router, isAuthenticated]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
