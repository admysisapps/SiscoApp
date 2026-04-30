import { apiService } from "@/services/apiService";
import { User } from "@/types/User";
import { AppError } from "@/types/AppError";
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
import { useAuth } from "./AuthContext";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  hasInitialized: boolean;
  userError: AppError | null;
  retryUser: () => void;
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
  const [userError, setUserError] = useState<AppError | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
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
        setUserError(null);

        const response = await apiService.getUserInfo(username, useContext);

        if (response.success) {
          setUser(response.data);
        } else {
          const statusCode = response.statusCode || response.status;
          setUser(null);
          if (ACCESS_ERROR_CODES.includes(statusCode)) {
            setUserError({ type: "user_not_found" });
          } else {
            setUserError({ type: "server_error", retryable: true });
          }
        }
      } catch {
        setUser(null);
        setUserError({ type: "server_error", retryable: true });
      } finally {
        setIsLoading(false);
        loadingRef.current = false;
        setHasInitialized(true);
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
      setUserError(null);
      setHasInitialized(false);
      hasLoadedRef.current = false;
      loadingRef.current = false;
    }
  }, [isAuthenticated, currentUsername, loadUserInfo]);

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
  const retryUser = useCallback(() => {
    if (!currentUsername) return;
    setUserError(null);
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
      hasInitialized,
      userError,
      retryUser,
      loadUserInfo,
      updateUserInfo,
      updateUserRole,
    }),
    [
      user,
      isLoading,
      hasInitialized,
      userError,
      retryUser,
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
