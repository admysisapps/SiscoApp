import { apiService } from "@/services/apiService";
import { User } from "@/types/User";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import NetInfo from "@react-native-community/netinfo";
import { useAuth } from "./AuthContext";

interface UserContextType {
  // Estado del usuario
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;

  // Estados de error
  error: string | null;
  hasError: boolean;
  retry: () => void;

  // Funciones de usuario
  loadUserInfo: (username: string, useContext?: boolean) => Promise<void>;
  updateUserInfo: (data: Partial<User>) => Promise<boolean>;
  updateUserRole: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Códigos HTTP de errores de acceso
const ACCESS_ERROR_CODES = [400, 401, 403, 404, 422];

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasError, setHasError] = useState(false);
  const [hasAccessError, setHasAccessError] = useState(false);
  const updatingRoleRef = useRef(false);
  const hasLoadedRef = useRef(false);
  const loadingRef = useRef(false);
  const { isAuthenticated, currentUsername } = useAuth();

  // Función para cargar información del usuario
  const loadUserInfo = useCallback(
    async (username: string, useContext: boolean = true) => {
      if (loadingRef.current) return;

      loadingRef.current = true;
      try {
        setIsLoading(true);
        setError(null);
        setHasError(false);
        setHasAccessError(false);

        const response = await apiService.getUserInfo(username, useContext);

        if (response.success) {
          setUser(response.data);
        } else {
          const statusCode = response.statusCode || response.status;
          const errorMsg =
            response.message || "Error cargando información del usuario";

          // Errores de acceso (400, 401, 403, 404, 422) → AccessDenied
          if (ACCESS_ERROR_CODES.includes(statusCode)) {
            setHasAccessError(true);
            setUser(null);
            // NO setear hasError - dejar que vaya a AccessDenied
          } else {
            // Errores de servidor (500, timeout, etc.) → ConnectionError
            setError(errorMsg);
            setHasError(true);
            setUser(null);
          }
        }
      } catch {
        setError("Error de conexión");
        setHasError(true);
        setUser(null);
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
      }
    },
    []
  );

  // Cargar datos del usuario cuando hay sesión activa
  useEffect(() => {
    if (
      isAuthenticated &&
      currentUsername &&
      !hasLoadedRef.current &&
      !loadingRef.current
    ) {
      hasLoadedRef.current = true;
      loadUserInfo(currentUsername);
    } else if (!isAuthenticated) {
      setUser(null);
      setError(null);
      setHasError(false);
      hasLoadedRef.current = false;
      loadingRef.current = false;
    }
  }, [isAuthenticated, currentUsername, loadUserInfo]);

  // Reintentar cargar cuando se recupera la conexión
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (
        state.isConnected &&
        isAuthenticated &&
        currentUsername &&
        !user &&
        !isLoading &&
        !loadingRef.current &&
        !hasAccessError // NO reintentar si hay error de acceso (403, 404, etc.)
      ) {
        // Limpiar error de red anterior y reintentar
        setHasError(false);
        setError(null);
        hasLoadedRef.current = false;
        loadUserInfo(currentUsername);
      }
    });

    return () => unsubscribe();
  }, [
    isAuthenticated,
    currentUsername,
    user,
    isLoading,
    hasAccessError,
    loadUserInfo,
  ]);

  // Función para actualizar información del usuario
  const updateUserInfo = useCallback(
    async (data: Partial<User>): Promise<boolean> => {
      if (!user) return false;

      const userIdentifier = user.documento || user.usuario || "";
      if (!userIdentifier) return false;

      try {
        const response = await apiService.updateUserInfo(userIdentifier, data);

        if (response.success) {
          setUser({ ...user, ...data });
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error updating user info:", error);
        return false;
      }
    },
    [user]
  );

  // Función para reintentar cargar datos del usuario
  const retry = useCallback(() => {
    if (!currentUsername) return;

    setError(null);
    setHasError(false);
    setHasAccessError(false);
    hasLoadedRef.current = false;
    loadUserInfo(currentUsername);
  }, [currentUsername, loadUserInfo]);

  // Función para recargar datos del usuario desde la BD
  const updateUserRole = useCallback(async () => {
    if (!user || !currentUsername || updatingRoleRef.current) return;

    updatingRoleRef.current = true;

    try {
      // BUENA PRÁCTICA: Recargar desde la fuente de verdad (BD)
      await loadUserInfo(currentUsername);
    } catch (error) {
      console.warn("Error actualizando datos del usuario:", error);
    } finally {
      updatingRoleRef.current = false;
    }
  }, [user, currentUsername, loadUserInfo]);

  const value = useMemo(
    () => ({
      user,
      setUser,
      isLoading,
      error,
      hasError,
      retry,
      loadUserInfo,
      updateUserInfo,
      updateUserRole,
    }),
    [
      user,
      isLoading,
      error,
      hasError,
      retry,
      loadUserInfo,
      updateUserInfo,
      updateUserRole,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
