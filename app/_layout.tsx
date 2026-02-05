import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Amplify } from "aws-amplify";
import * as SplashScreen from "expo-splash-screen";

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

SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

function RootNavigator() {
  const { selectedProject } = useProject();
  const { isAuthenticated } = useAuth();
  const isAdmin = selectedProject?.rolUsuario === "admin";

  // "default" - Nativa del sistema (iOS: slide_from_right, Android: slide_from_bottom)
  // "fade" - Fade in/out suave
  // "slide_from_right" - Slide desde derecha (estilo iOS)
  // "slide_from_left" - Slide desde izquierda
  // "slide_from_bottom" - Slide desde abajo (estilo modal)
  // "fade_from_bottom" - Fade + slide desde abajo (moderno)
  // "flip" - Volteo 3D (experimental)
  // "simple_push" - Push simple sin fade
  // "none" - Sin animación

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "default",
      }}
    >
      {/* Ruta de anclaje para usuarios autenticados */}
      <Stack.Screen
        name="project-selector"
        options={{ animation: "default" }}
      />

      {/* Rutas protegidas por AUTENTICACIÓN */}
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen
          name="(tabs)"
          options={{ animation: "slide_from_right" }}
        />
      </Stack.Protected>

      {/* Rutas protegidas por rol ADMIN */}
      <Stack.Protected guard={isAdmin}>
        <Stack.Screen
          name="(admin)"
          options={{ animation: "slide_from_right" }}
        />
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
