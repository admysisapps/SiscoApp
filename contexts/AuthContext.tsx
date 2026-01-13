import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactNode,
} from "react";
import {
  authService,
  AuthError,
  LoginResult,
  RegisterResult,
  ConfirmRegistrationResult,
  ForgotPasswordResult,
  ResetPasswordResult,
  ChangePasswordResult,
  ConfirmSignInResult,
  ResendCodeResult,
} from "@/services/auth/authService";
import { userCacheService } from "@/services/cache/userCacheService";
import {
  getCrashlytics,
  log,
  setUserId,
  recordError,
} from "@react-native-firebase/crashlytics";

// Función para sanitizar mensajes de error
const sanitizeErrorMessage = (message: string): string => {
  if (!message || typeof message !== "string") return "Error desconocido";
  // Remover caracteres potencialmente peligrosos y limitar longitud
  return message
    .replace(/[<>"'&]/g, "") // Remover caracteres HTML/JS básicos
    .substring(0, 200) // Limitar longitud
    .trim();
};

// Función centralizada para crear errores de auth
const createAuthError = (error: any, defaultMessage: string): AuthError => {
  return {
    message: sanitizeErrorMessage(error?.message || defaultMessage),
    name: error?.name || "UnknownError",
    code: error?.code || "UNKNOWN",
  };
};

interface AuthContextType {
  // Estado de autenticación
  isAuthenticated: boolean;
  authError: AuthError | null;
  isLoading: boolean;
  currentUsername: string | null;

  // Funciones de autenticación
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  register: (
    username: string,
    password: string,
    email: string
  ) => Promise<RegisterResult>;
  confirmRegistration: (
    username: string,
    code: string
  ) => Promise<ConfirmRegistrationResult>;
  forgotPasswordSubmit: (username: string) => Promise<ForgotPasswordResult>;
  resetPasswordSubmit: (
    username: string,
    code: string,
    newPassword: string
  ) => Promise<ResetPasswordResult>;
  changePasswordSubmit: (
    oldPassword: string,
    newPassword: string
  ) => Promise<ChangePasswordResult>;
  confirmSignInChallenge: (
    challengeResponse: string
  ) => Promise<ConfirmSignInResult>;
  resendConfirmationCode: (username: string) => Promise<ResendCodeResult>;
  clearAuthError: () => void;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authError, setAuthError] = useState<AuthError | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  // Limpiar errores de autenticación
  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  // Verificar estado de autenticación
  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const { isAuthenticated, username } = await authService.checkAuthStatus();
      setIsAuthenticated(isAuthenticated);
      setCurrentUsername(username || null);
    } catch {
      setIsAuthenticated(false);
      setCurrentUsername(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Login
  const login = useCallback(
    async (username: string, password: string) => {
      try {
        setIsLoading(true);
        clearAuthError();

        const result = await authService.login(username, password);

        if (result.isSignedIn) {
          // Obtener el username real
          let actualUsername = username;
          if (username.includes("@")) {
            try {
              const currentUser = await authService.getCurrentUser();
              actualUsername = currentUser.username;
            } catch {
              // Usar el username original si falla
            }
          }

          setIsAuthenticated(true);
          setCurrentUsername(actualUsername);

          // Crashlytics: registrar login exitoso
          const crashlyticsInstance = getCrashlytics();
          log(crashlyticsInstance, "Usuario inició sesión");
          await setUserId(crashlyticsInstance, actualUsername);
        }

        return result;
      } catch (error: any) {
        console.error(
          "Auth login error:",
          error.name || error.message || error
        );

        const authError = createAuthError(error, "Error al iniciar sesión");
        setAuthError(authError);

        // Crashlytics: registrar error de login
        const crashlyticsInstance = getCrashlytics();
        recordError(crashlyticsInstance, error);

        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [clearAuthError]
  );

  // Logout
  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      clearAuthError();

      await authService.logout();

      // Limpiar cache de usuario
      await userCacheService.clearAllCache();

      setIsAuthenticated(false);
      setCurrentUsername(null);

      // Crashlytics: registrar logout
      const crashlyticsInstance = getCrashlytics();
      log(crashlyticsInstance, "Usuario cerró sesión");
    } catch (error: any) {
      const authError = createAuthError(error, "Error al cerrar sesión");
      setAuthError(authError);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [clearAuthError]);

  // Register
  const register = useCallback(
    async (username: string, password: string, email: string) => {
      try {
        setIsLoading(true);
        clearAuthError();

        const result = await authService.register(username, password, email);
        return result;
      } catch (error: any) {
        const authError = createAuthError(error, "Error al registrar usuario");
        setAuthError(authError);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [clearAuthError]
  );

  // Confirm Registration
  const confirmRegistration = useCallback(
    async (username: string, code: string) => {
      try {
        setIsLoading(true);
        clearAuthError();

        const result = await authService.confirmRegistration(username, code);
        return result;
      } catch (error: any) {
        const authError = createAuthError(error, "Error al confirmar registro");
        setAuthError(authError);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [clearAuthError]
  );

  // Forgot Password
  const forgotPasswordSubmit = useCallback(
    async (username: string) => {
      try {
        setIsLoading(true);
        clearAuthError();

        const result = await authService.forgotPassword(username);
        return result;
      } catch (error: any) {
        const authError = createAuthError(
          error,
          "Error al solicitar recuperación"
        );
        setAuthError(authError);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [clearAuthError]
  );

  // Reset Password
  const resetPasswordSubmit = useCallback(
    async (username: string, code: string, newPassword: string) => {
      try {
        setIsLoading(true);
        clearAuthError();

        const result = await authService.resetPassword(
          username,
          code,
          newPassword
        );
        return result;
      } catch (error: any) {
        const authError = createAuthError(
          error,
          "Error al restablecer contraseña"
        );
        setAuthError(authError);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [clearAuthError]
  );

  // Change Password
  const changePasswordSubmit = useCallback(
    async (oldPassword: string, newPassword: string) => {
      try {
        setIsLoading(true);
        clearAuthError();

        const result = await authService.changePassword(
          oldPassword,
          newPassword
        );
        return result;
      } catch (error: any) {
        const authError = createAuthError(error, "Error al cambiar contraseña");
        setAuthError(authError);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [clearAuthError]
  );

  // Confirm Sign In Challenge
  const confirmSignInChallenge = useCallback(
    async (challengeResponse: string) => {
      try {
        setIsLoading(true);
        clearAuthError();

        const result = await authService.confirmSignIn(challengeResponse);

        if (result.isSignedIn) {
          try {
            const currentUser = await authService.getCurrentUser();
            setIsAuthenticated(true);
            setCurrentUsername(currentUser.username);
          } catch {
            setIsAuthenticated(true);
            setCurrentUsername("unknown");
          }
        }

        return result;
      } catch (error: any) {
        const authError = createAuthError(
          error,
          "Error al confirmar challenge"
        );
        setAuthError(authError);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [clearAuthError]
  );

  // Resend Confirmation Code
  const resendConfirmationCode = useCallback(
    async (username: string) => {
      try {
        setIsLoading(true);
        clearAuthError();

        const result = await authService.resendConfirmationCode(username);
        return result;
      } catch (error: any) {
        const authError = createAuthError(error, "Error al reenviar código");
        setAuthError(authError);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [clearAuthError]
  );

  // Verificación rápida de autenticación para auto-login
  useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        // Verificación rápida desde cache/token local primero
        const { isAuthenticated, username } =
          await authService.checkAuthStatus();

        if (mounted) {
          setIsAuthenticated(isAuthenticated);
          setCurrentUsername(username || null);
          setIsLoading(false);

          // Si está autenticado, no necesitamos más validaciones aquí
          // Los otros contextos se encargarán de cargar sus datos
        }
      } catch {
        if (mounted) {
          setIsAuthenticated(false);
          setCurrentUsername(null);
          setIsLoading(false);

          // Limpiar cache cuando la sesión expira
          await userCacheService.clearAllCache();
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    authError,
    isLoading,
    currentUsername,
    login,
    logout,
    register,
    confirmRegistration,
    forgotPasswordSubmit,
    resetPasswordSubmit,
    changePasswordSubmit,
    confirmSignInChallenge,
    resendConfirmationCode,
    clearAuthError,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
