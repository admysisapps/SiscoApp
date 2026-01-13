// contexts/AsambleaContext.tsx
import React, { createContext, useContext, useState, useCallback } from "react";
import { Asamblea } from "@/types/Asamblea";
import { useProject } from "@/contexts/ProjectContext";
import { asambleaService } from "@/services/asambleaService";

interface AsambleaContextType {
  asambleas: Asamblea[];
  cargando: boolean;
  error: string | null;
  cargarAsambleas: () => Promise<void>;
}

const AsambleaContext = createContext<AsambleaContextType | undefined>(
  undefined
);

export const AsambleaProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [asambleas, setAsambleas] = useState<Asamblea[]>([]);
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { selectedProject } = useProject();

  // Usar useCallback para memorizar la función
  const cargarAsambleas = useCallback(async () => {
    if (!selectedProject) {
      // amazonq-ignore-next-line
      return;
    }

    setCargando(true);
    setError(null);

    try {
      const response = await asambleaService.getAsambleas(selectedProject.NIT);

      if (response.success && response.asambleas) {
        setAsambleas(response.asambleas);
      } else {
        setError("No se pudieron cargar las asambleas");
      }
    } catch (err) {
      console.error("Error cargando asambleas:", err);
      setError("No se pudieron cargar las asambleas");
    } finally {
      setCargando(false);
    }
  }, [selectedProject]); // Solo depende de selectedProject

  const value = {
    asambleas,
    cargando,
    error,
    cargarAsambleas,
  };

  return (
    <AsambleaContext.Provider value={value}>
      {children}
    </AsambleaContext.Provider>
  );
};

export const useAsambleas = () => {
  const context = useContext(AsambleaContext);
  if (context === undefined) {
    throw new Error("useAsambleas debe usarse dentro de un AsambleaProvider");
  }
  return context;
};
