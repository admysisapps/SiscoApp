import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Amplify } from "aws-amplify";

import { LoadingProvider } from "../contexts/LoadingContext";
import { ProjectProvider, useProject } from "../contexts/ProjectContext";
import { ApartmentProvider } from "../contexts/ApartmentContext";
import { AuthProvider, useAuth } from "../contexts/AuthContext";
import { UserProvider } from "../contexts/UserContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { fcmService } from "../services/fcmService";

import outputs from "../amplify_outputs.json";

Amplify.configure(outputs);
fcmService.initialize();

function RootNavigator() {
  const { selectedProject } = useProject();
  const { isAuthenticated } = useAuth();
  const isAdmin = selectedProject?.rol_usuario === "admin";

  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Ruta de anclaje para usuarios autenticados */}
      <Stack.Screen name="project-selector" />

      {/* Rutas protegidas por AUTENTICACIÓN */}
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>

      {/* Rutas protegidas por rol ADMIN */}
      <Stack.Protected guard={isAdmin}>
        <Stack.Screen name="(admin)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <LoadingProvider>
        <AuthProvider>
          <UserProvider>
            <ProjectProvider>
              <ApartmentProvider>
                <NotificationProvider>
                  <RootNavigator />
                </NotificationProvider>
              </ApartmentProvider>
            </ProjectProvider>
          </UserProvider>
        </AuthProvider>
      </LoadingProvider>
    </SafeAreaProvider>
  );
}
