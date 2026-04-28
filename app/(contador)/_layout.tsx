import React, { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useProject } from "@/contexts/ProjectContext";
import { ROLES } from "@/types/Roles";
import { THEME } from "@/constants/theme";

export default function ContadorLayout() {
  const { isAuthenticated } = useAuth();
  const { selectedProject } = useProject();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/(auth)/login");
    } else if (
      !selectedProject ||
      selectedProject.rolUsuario !== ROLES.CONTADOR
    ) {
      router.replace("/project-selector");
    }
  }, [isAuthenticated, selectedProject, router]);

  if (
    !isAuthenticated ||
    !selectedProject ||
    selectedProject.rolUsuario !== ROLES.CONTADOR
  ) {
    return null;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: THEME.colors.background }]}
      edges={["top"]}
    >
      <View style={styles.roleIndicator}>
        <View style={styles.roleContent}>
          <View style={styles.iconContainer}>
            <Ionicons name="calculator" size={14} color="white" />
          </View>
          <Text style={styles.roleText}>CONTADOR</Text>
        </View>
      </View>

      <Tabs tabBar={() => null} screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="index" />
        <Tabs.Screen name="perfil" />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  roleIndicator: {
    backgroundColor: "#059669",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  roleContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
  },
  roleText: {
    color: "white",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
