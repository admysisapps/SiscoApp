import React, { useEffect } from "react";
import { Tabs, useRouter } from "expo-router";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/hooks/useRole";
import LoadingOverlay from "@/components/LoadingOverlay";
import CustomTabBar from "@/components/CustomTabBar";

export default function TabLayout() {
  const { isLoading: userLoading } = useUser();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const isLoading = userLoading || authLoading;
  const { isAdmin } = useRole();
  const router = useRouter();

  // Protección: verificar autenticación
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/(auth)/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Mostrar loading
  if (isLoading) {
    return <LoadingOverlay visible={true} />;
  }

  // Si no está autenticado, no mostrar nada mientras redirige
  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Indicador de Rol */}
      {isAdmin && (
        <View style={styles.roleIndicator}>
          <Ionicons name="shield-checkmark" size={16} color="white" />
          <Text style={styles.roleText}>ADMINISTRADOR</Text>
        </View>
      )}

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
        <Tabs.Screen name="(financiero)" />
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
