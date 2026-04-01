/*
import React from "react";
import { Redirect } from "expo-router";


const PANTALLA_DEV = "/(screens)/test-form-styles";

export default function Index() {
  //Ir directo a la pantalla de desarrollo
  return <Redirect href={PANTALLA_DEV} />;
}

  */

import React, { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import NetInfo from "@react-native-community/netinfo";
import * as SplashScreen from "expo-splash-screen";
import { useProject } from "@/contexts/ProjectContext";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";
import LoadingScreen from "@/components/LoadingScreen";

// const LOG_TAG = "[Index]";
// const fmt = (ms: number) => `+${ms}ms`;

export default function Index() {
  // const mountTime = useRef(Date.now());
  // const elapsed = () => fmt(Date.now() - mountTime.current);

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

  // console.log(
  //   `${LOG_TAG} render ${elapsed()} |`,
  //   `authLoading=${authLoading}`,
  //   `isAuthenticated=${isAuthenticated}`,
  //   `userLoading=${userLoading}`,
  //   `userInitialized=${userInitialized}`,
  //   `isLoadingProjects=${isLoadingProjects}`,
  //   `appReady=${appReady}`,
  //   `isConnected=${isConnected}`,
  //   `onboardingSeen=${onboardingSeen}`,
  //   `user=${user?.usuario ?? "null"}`,
  //   `selectedProject=${selectedProject?.nombre ?? "null"}`,
  //   `proyectos=${proyectos.length}`
  // );

  useEffect(() => {
    // console.log(`${LOG_TAG} mount ${elapsed()} | iniciando initializeApp + NetInfo`);

    const initializeApp = async () => {
      // const t0 = Date.now();
      try {
        await SplashScreen.preventAutoHideAsync();
        // console.log(`${LOG_TAG} SplashScreen.preventAutoHideAsync ${elapsed()}`);

        const seen = await AsyncStorage.getItem("onboardingSeen");
        // console.log(`${LOG_TAG} AsyncStorage onboardingSeen=${seen} ${elapsed()} | AsyncStorage tardó ${Date.now() - t0}ms`);
        setOnboardingSeen(seen === "true");

        setAppReady(true);
        // console.log(`${LOG_TAG} appReady=true ${elapsed()}`);
      } catch (error) {
        // console.error(`${LOG_TAG} ERROR en initializeApp:`, error);
        setOnboardingSeen(true);
        setAppReady(true);
        SplashScreen.hideAsync();
      }
    };

    const checkConnection = () => {
      const unsubscribe = NetInfo.addEventListener((state) => {
        // console.log(`${LOG_TAG} NetInfo isConnected=${state.isConnected} type=${state.type} ${elapsed()}`);
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
      // console.log(`${LOG_TAG} SplashScreen.hideAsync ${elapsed()} | motivo: sin conexion`);
      SplashScreen.hideAsync();
      return;
    }

    const canNavigate =
      onboardingSeen !== null &&
      isConnected !== null &&
      !authLoading &&
      (!isAuthenticated || (!userLoading && !isLoadingProjects));

    // console.log(
    //   `${LOG_TAG} canNavigate check ${elapsed()} |`,
    //   `canNavigate=${canNavigate}`,
    //   `onboardingSeen=${onboardingSeen}`,
    //   `isConnected=${isConnected}`,
    //   `authLoading=${authLoading}`,
    //   `isAuthenticated=${isAuthenticated}`,
    //   `userLoading=${userLoading}`,
    //   `isLoadingProjects=${isLoadingProjects}`
    // );

    if (canNavigate) {
      // console.log(`${LOG_TAG} SplashScreen.hideAsync ${elapsed()} | motivo: canNavigate=true`);
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
    // console.log(`${LOG_TAG} -> null (splash visible) ${elapsed()} | appReady=${appReady} authLoading=${authLoading} onboardingSeen=${onboardingSeen} isConnected=${isConnected}`);
    return null;
  }

  if (!isConnected) {
    // console.log(`${LOG_TAG} -> Redirect /(screens)/NoConnection ${elapsed()}`);
    return <Redirect href="/(screens)/NoConnection" />;
  }

  if (!isAuthenticated) {
    if (!onboardingSeen) {
      // console.log(`${LOG_TAG} -> Redirect /(onboarding) ${elapsed()} | onboardingSeen=false`);
      return <Redirect href="/(onboarding)" />;
    }
    // console.log(`${LOG_TAG} -> Redirect /(auth)/login ${elapsed()} | no autenticado`);
    return <Redirect href="/(auth)/login" />;
  }

  // Para usuarios autenticados: navegación directa con datos mínimos
  if (isAuthenticated) {
    // Esperar a que termine de cargar antes de navegar
    if (userLoading || isLoadingProjects) {
      // console.log(`${LOG_TAG} -> LoadingScreen ${elapsed()} | userLoading=${userLoading} isLoadingProjects=${isLoadingProjects}`);
      return <LoadingScreen />;
    }

    // Verificar errores de carga
    if (userHasError) {
      // console.log(`${LOG_TAG} -> Redirect /(screens)/ConnectionErrorScreen ${elapsed()} | userHasError=true`);
      return <Redirect href="/(screens)/ConnectionErrorScreen" />;
    }

    if (userHasAccessError) {
      // console.log(`${LOG_TAG} -> Redirect /(screens)/AccessDenied ${elapsed()} | userHasAccessError=true`);
      return <Redirect href="/(screens)/AccessDenied" />;
    }

    // Si tenemos proyecto seleccionado, ir directo
    if (selectedProject) {
      if (selectedProject.rolUsuario === "admin") {
        // console.log(`${LOG_TAG} -> Redirect /(admin) ${elapsed()} | selectedProject=${selectedProject.nombre} rol=admin`);
        return <Redirect href="/(admin)" />;
      } else {
        // console.log(`${LOG_TAG} -> Redirect /(tabs) ${elapsed()} | selectedProject=${selectedProject.nombre} rol=${selectedProject.rolUsuario}`);
        return <Redirect href="/(tabs)" />;
      }
    }

    // Si tenemos usuario pero no proyecto, verificar proyectos disponibles
    if (user) {
      // Si no tiene proyectos Y ya terminó de cargar
      if (proyectos.length === 0 && !isLoadingProjects) {
        // console.log(`${LOG_TAG} -> Redirect /(screens)/AccessDenied ${elapsed()} | user sin proyectos`);
        return <Redirect href="/(screens)/AccessDenied" />;
      }

      // Si tiene múltiples proyectos
      if (proyectos.length > 1) {
        // console.log(`${LOG_TAG} -> Redirect /project-selector ${elapsed()} | proyectos=${proyectos.length}`);
        return <Redirect href="/project-selector" />;
      }

      // Si tiene exactamente 1 proyecto
      if (proyectos.length === 1) {
        const proyecto = proyectos[0];
        if (proyecto.rolUsuario === "admin") {
          // console.log(`${LOG_TAG} -> Redirect /(admin) ${elapsed()} | 1 proyecto rol=admin`);
          return <Redirect href="/(admin)" />;
        } else {
          // console.log(`${LOG_TAG} -> Redirect /(tabs) ${elapsed()} | 1 proyecto rol=${proyecto.rolUsuario}`);
          return <Redirect href="/(tabs)" />;
        }
      }
    }

    // Fallback: usuario autenticado pero sin datos de usuario
    if (!user && !userLoading && userInitialized) {
      // console.log(`${LOG_TAG} -> Redirect /(screens)/AccessDenied ${elapsed()} | isAuthenticated pero user=null`);
      return <Redirect href="/(screens)/AccessDenied" />;
    }
  }

  // Fallback final: mostrar loading si llegamos aquí
  // console.log(`${LOG_TAG} -> LoadingScreen (fallback final) ${elapsed()}`);
  return <LoadingScreen />;
}
