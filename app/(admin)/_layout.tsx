import React, { useEffect } from "react";
import { MaterialIcons } from "@expo/vector-icons";
import { Tabs, useRouter } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useProject } from "@/contexts/ProjectContext";
import LoadingOverlay from "@/components/LoadingOverlay";
import CustomTabBar from "@/components/CustomTabBar";

export default function AdminLayout() {
  const { isLoading: userLoading } = useUser();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { selectedProject, isLoadingProjects } = useProject();
  const isLoading = userLoading || authLoading || isLoadingProjects;
  const router = useRouter();

  // Protección: verificar autenticación y rol admin
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/(auth)/login");
      } else if (!selectedProject || selectedProject.rol_usuario !== "admin") {
        router.replace("/project-selector");
      }
    }
  }, [isAuthenticated, selectedProject, isLoading, router]);

  // Mostrar loading
  if (isLoading) {
    return <LoadingOverlay visible={true} />;
  }

  // Si no está autenticado o no es admin, no mostrar nada mientras redirige
  if (
    !isAuthenticated ||
    !selectedProject ||
    selectedProject.rol_usuario !== "admin"
  ) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Indicador de Rol Admin */}
      <LinearGradient
        colors={["#DC2626", "#B91C1C"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.roleIndicator}
      >
        <View style={styles.roleContent}>
          <View style={styles.iconContainer}>
            <MaterialIcons
              name="admin-panel-settings"
              size={14}
              color="white"
            />
          </View>
          <Text style={styles.roleText}>ADMINISTRADOR</Text>
        </View>
      </LinearGradient>

      <Tabs
        tabBar={(props) => {
          const currentRoute = props.state.routes[props.state.index];
          if (currentRoute.name === "(asambleas)") {
            return null;
          }
          return <CustomTabBar {...props} />;
        }}
        screenOptions={{
          headerShown: false,
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="(financiero-admin)" />
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
