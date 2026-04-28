import React, { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRole } from "@/hooks/useRole";
import { useAuth } from "@/contexts/AuthContext";
import { useProject } from "@/contexts/ProjectContext";
import { ROLES } from "@/types/Roles";
import { THEME } from "@/constants/theme";

export default function TabLayout() {
  const { isAuthenticated } = useAuth();
  const { selectedProject } = useProject();
  const { isAdmin } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace("/(auth)/login");
    } else if (
      !selectedProject ||
      selectedProject.rolUsuario !== ROLES.PROPIETARIO
    ) {
      router.replace("/project-selector");
    }
  }, [isAuthenticated, selectedProject, router]);

  if (
    !isAuthenticated ||
    !selectedProject ||
    selectedProject.rolUsuario !== ROLES.PROPIETARIO
  ) {
    return null;
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: THEME.colors.background }]}
      edges={["top"]}
    >
      {/* Indicador de Rol */}
      {isAdmin && (
        <View style={styles.roleIndicator}>
          <Ionicons name="shield-checkmark" size={16} color="white" />
          <Text style={styles.roleText}>ADMINISTRADOR</Text>
        </View>
      )}

      <Tabs
        tabBar={() => null}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="(asambleas)" />
        <Tabs.Screen name="perfil" />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  roleIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dc2626",
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  roleText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
});
