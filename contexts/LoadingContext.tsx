import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import LoadingOverlay from "../components/LoadingOverlay";

interface LoadingContextType {
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// Helper para sanitizar mensajes
const sanitizeMessage = (msg: string | undefined): string => {
  if (!msg) return "Cargando...";
  return msg.replace(/[<>"'&]/g, "").substring(0, 100);
};

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Cargando...");

  const showLoading = useCallback((msg = "Cargando...") => {
    const sanitizedMsg = sanitizeMessage(msg);
    setMessage(sanitizedMsg);
    setLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading) {
    }
  }, [loading, message]);

  return (
    <LoadingContext.Provider
      value={{ showLoading, hideLoading, isLoading: loading }}
    >
      {children}
      <LoadingOverlay visible={loading} message={message} />
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}
