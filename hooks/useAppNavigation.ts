import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";
import * as SplashScreen from "expo-splash-screen";
import { useProject } from "@/contexts/ProjectContext";
import { useUser } from "@/contexts/UserContext";
import { useAuth } from "@/contexts/AuthContext";

// const LOG_TAG = "[Index]";
// const fmt = (ms: number) => `+${ms}ms`;

export type AppDestination =
  | { type: "splash" }
  | { type: "loading" }
  | { type: "redirect"; href: string };

export interface NavigationState {
  appReady: boolean;
  authLoading: boolean;
  onboardingSeen: boolean | null;
  isConnected: boolean | null;
  isAuthenticated: boolean;
  userLoading: boolean;
  isLoadingProjects: boolean;
  userHasError: boolean;
  userHasAccessError: boolean;
  userInitialized: boolean;
  user: { usuario?: string } | null;
  selectedProject: { nombre?: string; rolUsuario: string } | null;
  proyectos: { rolUsuario: string }[];
}

export function resolveDestination(s: NavigationState): AppDestination {
  if (
    !s.appReady ||
    s.authLoading ||
    s.onboardingSeen === null ||
    s.isConnected === null
  ) {
    return { type: "splash" };
  }

  if (!s.isConnected) {
    return { type: "redirect", href: "/(screens)/NoConnection" };
  }

  if (!s.isAuthenticated) {
    return {
      type: "redirect",
      href: s.onboardingSeen ? "/(auth)/login" : "/(onboarding)",
    };
  }

  if (s.userLoading || s.isLoadingProjects) {
    return { type: "loading" };
  }

  if (s.userHasError) {
    return { type: "redirect", href: "/(screens)/ConnectionErrorScreen" };
  }

  if (s.userHasAccessError) {
    return { type: "redirect", href: "/(screens)/AccessDenied" };
  }

  if (s.selectedProject) {
    return {
      type: "redirect",
      href: s.selectedProject.rolUsuario === "admin" ? "/(admin)" : "/(tabs)",
    };
  }

  if (s.user) {
    if (s.proyectos.length === 0 && !s.isLoadingProjects) {
      return { type: "redirect", href: "/(screens)/AccessDenied" };
    }
    if (s.proyectos.length > 1) {
      return { type: "redirect", href: "/project-selector" };
    }
    if (s.proyectos.length === 1) {
      return {
        type: "redirect",
        href: s.proyectos[0].rolUsuario === "admin" ? "/(admin)" : "/(tabs)",
      };
    }
  }

  if (!s.user && !s.userLoading && s.userInitialized) {
    return { type: "redirect", href: "/(screens)/AccessDenied" };
  }

  return { type: "loading" };
}

export function useAppNavigation(): AppDestination {
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
      } catch {
        // console.error(`${LOG_TAG} ERROR en initializeApp:`);
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

  // --- Lógica de decisión ---
  const destination = resolveDestination({
    appReady,
    authLoading,
    onboardingSeen,
    isConnected,
    isAuthenticated,
    userLoading,
    isLoadingProjects,
    userHasError,
    userHasAccessError,
    userInitialized,
    user,
    selectedProject,
    proyectos,
  });

  // if (destination.type === "splash") {
  //   console.log(`${LOG_TAG} -> null (splash visible) ${elapsed()} | appReady=${appReady} authLoading=${authLoading} onboardingSeen=${onboardingSeen} isConnected=${isConnected}`);
  // } else if (destination.type === "loading") {
  //   console.log(`${LOG_TAG} -> LoadingScreen ${elapsed()} | userLoading=${userLoading} isLoadingProjects=${isLoadingProjects}`);
  // } else {
  //   console.log(`${LOG_TAG} -> Redirect ${destination.href} ${elapsed()}`);
  // }

  return destination;
}
