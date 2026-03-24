/*
import React from "react";
import { Redirect } from "expo-router";


const PANTALLA_DEV = "/(screens)/test-form-styles";

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
    hasInitialized: userInitialized,
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

  // Ocultar splash cuando appReady y mostrar LoadingScreen con Lottie
  useEffect(() => {
    if (!appReady) return;

    // Ocultar splash apenas la app esté lista — el Lottie toma el relevo
    if (isConnected === false) {
      SplashScreen.hideAsync();
      return;
    }

    if (isConnected !== null) {
      SplashScreen.hideAsync();
    }
  }, [appReady, isConnected]);

  if (!appReady || onboardingSeen === null || isConnected === null) {
    return null;
  }

  if (authLoading || (isAuthenticated && !userInitialized)) {
    return <LoadingScreen />;
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

  if (isAuthenticated) {
    if (userLoading || isLoadingProjects) {
      return <LoadingScreen />;
    }

    if (userHasError) {
      return <Redirect href="/(screens)/ConnectionErrorScreen" />;
    }

    if (userHasAccessError) {
      return <Redirect href="/(screens)/AccessDenied" />;
    }

    if (selectedProject) {
      if (selectedProject.rolUsuario === "admin") {
        return <Redirect href="/(admin)" />;
      } else {
        return <Redirect href="/(tabs)" />;
      }
    }

    if (user) {
      if (proyectos.length === 0 && !isLoadingProjects) {
        return <Redirect href="/(screens)/AccessDenied" />;
      }

      if (proyectos.length > 1) {
        return <Redirect href="/project-selector" />;
      }

      if (proyectos.length === 1) {
        const proyecto = proyectos[0];
        if (proyecto.rolUsuario === "admin") {
          return <Redirect href="/(admin)" />;
        } else {
          return <Redirect href="/(tabs)" />;
        }
      }
    }

    if (!user && !userLoading) {
      return <Redirect href="/(screens)/AccessDenied" />;
    }
  }

  return <LoadingScreen />;
}
