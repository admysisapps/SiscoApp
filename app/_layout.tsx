import { Stack } from "expo-router";
import { Platform } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Amplify } from "aws-amplify";
import * as SplashScreen from "expo-splash-screen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { LoadingProvider } from "@/contexts/LoadingContext";
import { ProjectProvider, useProject } from "@/contexts/ProjectContext";
import { ApartmentProvider } from "@/contexts/ApartmentContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { UserProvider } from "@/contexts/UserContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { fcmService } from "@/services/fcmService";

import { KeyboardProvider } from "react-native-keyboard-controller";

import outputs from "@/amplify_outputs.json";

Amplify.configure(outputs);
fcmService.initialize();

SplashScreen.setOptions({
  duration: 500,
  fade: true,
});

// Configuración de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10, // 10 segundos
      gcTime: 1000 * 60 * 10, // 10 minutos - tiempo en cache
      retry: 2, // Reintentar 2 veces si falla
      refetchOnWindowFocus: true, // Refrescar al volver a la app
    },
  },
});

function RootNavigator() {
  const { selectedProject } = useProject();
  const { isAuthenticated } = useAuth();
  const isAdmin = selectedProject?.rolUsuario === "admin";

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.select({
          default: "default",
        }),
        // Optimización de performance (Native Stack)
        freezeOnBlur: true,
        // Configuración de gestos
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    >
      {/* Pantalla inicial - sin gestos para evitar salidas accidentales */}
      <Stack.Screen
        name="project-selector"
        options={{
          animation: "fade",
          gestureEnabled: false,
        }}
      />

      {/* Rutas protegidas por AUTENTICACIÓN */}
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen
          name="(tabs)"
          options={{
            animation: "slide_from_right",
            gestureDirection: "horizontal",
            animationTypeForReplace: "push",
          }}
        />
      </Stack.Protected>

      {/* Rutas protegidas por rol ADMIN - estilo modal */}
      <Stack.Protected guard={isAdmin}>
        <Stack.Screen
          name="(admin)"
          options={{
            animation: "slide_from_right",
            gestureDirection: "vertical",
          }}
        />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <QueryClientProvider client={queryClient}>
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
        </QueryClientProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
