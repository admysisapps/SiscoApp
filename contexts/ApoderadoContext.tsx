import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { ApoderadoSession, ApoderadoLoginData } from "@/types/Apoderado";
import { apoderadoService } from "@/services/apoderadoService";
import { sessionService } from "@/services/cache/sessionService";

interface ApoderadoContextType {
  session: ApoderadoSession | null;
  loading: boolean;
  login: (
    loginData: ApoderadoLoginData
  ) => Promise<{ success: boolean; data?: ApoderadoSession; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  restoreSession: () => Promise<boolean>;
}

const ApoderadoContext = createContext<ApoderadoContextType | undefined>(
  undefined
);

interface ApoderadoProviderProps {
  children: ReactNode;
}

export function ApoderadoProvider({ children }: ApoderadoProviderProps) {
  const [session, setSession] = useState<ApoderadoSession | null>(null);
  const [loading, setLoading] = useState(false);

  // Limpiar sesión cuando el provider se desmonte (usuario sale de rutas de apoderado)
  useEffect(() => {
    return () => {
      sessionService.clearSession();
    };
  }, []);

  const login = async (loginData: ApoderadoLoginData) => {
    setLoading(true);
    try {
      // Llamar a la lambda de login apoderado
      const response = await apoderadoService.loginApoderado(loginData);

      if (response.success && response.data) {
        setSession(response.data);

        return response;
      } else {
        throw new Error(response.error || "Error al iniciar sesión");
      }
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setSession(null);
    await sessionService.clearSession();
  };

  const restoreSession = async (): Promise<boolean> => {
    try {
      const savedSession = await sessionService.getSession();
      if (savedSession) {
        setSession(savedSession as ApoderadoSession);
        return true;
      } else {
        return false;
      }
    } catch {
      return false;
    }
  };

  const isAuthenticated = session !== null;

  const value: ApoderadoContextType = {
    session,
    loading,
    login,
    logout,
    isAuthenticated,
    restoreSession,
  };

  return (
    <ApoderadoContext.Provider value={value}>
      {children}
    </ApoderadoContext.Provider>
  );
}

export function useApoderado() {
  const context = useContext(ApoderadoContext);
  if (context === undefined) {
    throw new Error("useApoderado must be used within an ApoderadoProvider");
  }
  return context;
}
