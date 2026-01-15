/*
import React from "react";
import { Redirect } from "expo-router";


const PANTALLA_DEV = "/(screens)/NoConnection";

export default function Index() {
  //Ir directo a la pantalla de desarrollo
  return <Redirect href={PANTALLA_DEV} />;
  }
  
  */

import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import * as SplashScreen from "expo-splash-screen";
import { useProject } from "@/contexts/ProjectContext";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";

export default function Index() {
  const { selectedProject, proyectos, isLoadingProjects } = useProject();
  const {
    user,
    isLoading: userLoading,
    hasError: userHasError,
    hasAccessError: userHasAccessError,
  } = useUser();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [onboardingSeen, setOnboardingSeen] = useState<boolean | null>(null);
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await SplashScreen.preventAutoHideAsync();

        const seen = await AsyncStorage.getItem("onboardingSeen");
        setOnboardingSeen(seen === "true");

        setAppReady(true);
        // NO ocultar splash aquí - se ocultará cuando atengamos destino
      } catch (error) {
        console.error("Error initializing app:", error);
        setOnboardingSeen(true);
        setAppReady(true);
        SplashScreen.hideAsync();
      }
    };

    const checkConnection = () => {
      const unsubscribe = NetInfo.addEventListener((state) => {
        setIsConnected(state.isConnected);
      });
      return unsubscribe;
    };

    initializeApp();
    const unsubscribe = checkConnection();

    return () => unsubscribe();
  }, []);

  // Ocultar splash cuando tengamos destino de navegación
  useEffect(() => {
    if (!appReady) return;

    // Ocultar splash si no hay conexión (para mostrar NoConnection screen)
    if (isConnected === false) {
      SplashScreen.hideAsync();
      return;
    }

    const canNavigate =
      onboardingSeen !== null &&
      isConnected !== null &&
      !authLoading &&
      (!isAuthenticated || (!userLoading && !isLoadingProjects));

    if (canNavigate) {
      SplashScreen.hideAsync();
    }
  }, [
    appReady,
    onboardingSeen,
    isConnected,
    authLoading,
    isAuthenticated,
    userLoading,
    isLoadingProjects,
  ]);

  if (
    !appReady ||
    authLoading ||
    onboardingSeen === null ||
    isConnected === null
  ) {
    // Mantener splash visible durante inicialización
    return null;
  }

  if (!isConnected) {
    return <Redirect href="/(screens)/NoConnection" />;
  }

  if (!isAuthenticated) {
    if (!onboardingSeen) {
      return <Redirect href="/(onboarding)" />;
    }
    return <Redirect href="/(auth)/login" />;
  }

  // Para usuarios autenticados: navegación directa con datos mínimos
  if (isAuthenticated) {
    // Esperar a que termine de cargar antes de navegar
    if (userLoading || isLoadingProjects) {
      return <LoadingScreen />;
    }

    // Verificar errores de carga
    if (userHasError) {
      return <Redirect href="/(screens)/ConnectionErrorScreen" />;
    }

    if (userHasAccessError) {
      return <Redirect href="/(screens)/AccessDenied" />;
    }

    // Si tenemos proyecto seleccionado, ir directo
    if (selectedProject) {
      if (selectedProject.rol_usuario === "admin") {
        return <Redirect href="/(admin)" />;
      } else {
        return <Redirect href="/(tabs)" />;
      }
    }

    // Si tenemos usuario pero no proyecto, verificar proyectos disponibles
    if (user) {
      // Si no tiene proyectos Y ya terminó de cargar
      if (proyectos.length === 0 && !isLoadingProjects) {
        // Podría ser por proyectos inactivos, verificar en ProjectContext
        return <Redirect href="/(screens)/AccessDenied" />;
      }

      // Si tiene múltiples proyectos
      if (proyectos.length > 1) {
        return <Redirect href="/project-selector" />;
      }

      // Si tiene exactamente 1 proyecto
      if (proyectos.length === 1) {
        const proyecto = proyectos[0];

        if (proyecto.rol_usuario === "admin") {
          return <Redirect href="/(admin)" />;
        } else {
          return <Redirect href="/(tabs)" />;
        }
      }
    }

    // Fallback: usuario autenticado pero sin datos de usuario
    if (!user && !userLoading) {
      return <Redirect href="/(screens)/AccessDenied" />;
    }
  }

  // Fallback final: mostrar loading si llegamos aquí
  return <LoadingScreen />;
}
