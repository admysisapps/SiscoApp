// contexts/ApartmentContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import type { ReactNode } from "react";
import { Apartamento } from "@/types/Apartamento";
import { Proyecto } from "@/types/Proyecto";
import { useUser } from "./UserContext";
import { useAuth } from "./AuthContext";
import { apiService } from "@/services/apiService";
import { apartmentCacheService } from "@/services/cache/apartmentCacheService";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Helper para sanitizar datos de usuario
const sanitizeUserData = (
  data: string | number | null | undefined
): string | number | null | undefined => {
  if (typeof data === "string") {
    return data.replace(/[<>"'&]/g, "").substring(0, 255);
  }
  return data;
};

// Helper para auto-seleccionar apartamento
const autoSelectApartment = async (
  apartments: Apartamento[],
  setSelectedApartment: (apt: Apartamento) => void,
  saveContext: (apartment: Apartamento) => Promise<void>
) => {
  if (apartments.length >= 1) {
    const apartment = apartments[0];
    setSelectedApartment(apartment);
    await saveContext(apartment);
  }
};

// Interfaz del Context
interface ApartmentContextType {
  selectedApartment: Apartamento | null;
  apartamentos: Apartamento[];
  isLoadingApartments: boolean;
  setSelectedApartment: (apartment: Apartamento | null) => void;
  loadApartments: (selectedProject: Proyecto) => Promise<void>;
  clearApartments: () => void;
}

// Crear el Context
const ApartmentContext = createContext<ApartmentContextType | undefined>(
  undefined
);

// Provider
export function ApartmentProvider({ children }: { children: ReactNode }) {
  const [selectedApartment, setSelectedApartment] =
    useState<Apartamento | null>(null);
  const [apartamentos, setApartamentos] = useState<Apartamento[]>([]);
  const [isLoadingApartments, setIsLoadingApartments] = useState(false);

  const { user } = useUser();
  const { isAuthenticated } = useAuth();

  // Helper para guardar contexto de apartamento
  const saveApartmentContext = useCallback(async (apartment: Apartamento) => {
    try {
      // Obtener contexto existente
      const existingContext = await AsyncStorage.getItem("user_context");
      if (existingContext) {
        const context = JSON.parse(existingContext);
        context.apartamento_codigo = sanitizeUserData(apartment.codigo_apt);
        await AsyncStorage.setItem("user_context", JSON.stringify(context));
      }
    } catch (error) {
      console.error("Error guardando contexto de apartamento:", error);
    }
  }, []);

  // Función para cargar apartamentos del usuario
  const loadApartments = useCallback(
    async (selectedProject: Proyecto) => {
      if (!selectedProject || !user) {
        return;
      }

      // Si el rol en el proyecto es admin, no cargar apartamentos
      if (selectedProject.rolUsuario === "admin") {
        return;
      }

      // Prevenir múltiples cargas simultáneas
      if (isLoadingApartments) {
        return;
      }

      const userDoc = user.documento || user.usuario;
      const proyectoNIT = selectedProject.nit;

      if (!userDoc) {
        return;
      }

      try {
        setIsLoadingApartments(true);

        // Intentar obtener desde cache primero
        const cachedApartments =
          await apartmentCacheService.getCachedApartments(userDoc, proyectoNIT);

        if (cachedApartments) {
          setApartamentos(cachedApartments);

          // Auto-seleccionar apartamento usando helper
          await autoSelectApartment(
            cachedApartments,
            setSelectedApartment,
            saveApartmentContext
          );

          setIsLoadingApartments(false);
          return;
        }

        // Si no hay cache, hacer petición a la API
        const response = await apiService.getApartamentosUsuario();

        if (response.success && Array.isArray(response.data)) {
          // Guardar en cache
          await apartmentCacheService.setCachedApartments(
            userDoc,
            proyectoNIT,
            response.data
          );

          setApartamentos(response.data);

          // Auto-seleccionar apartamento usando helper
          await autoSelectApartment(
            response.data,
            setSelectedApartment,
            saveApartmentContext
          );
        }
      } catch (error) {
        console.error("Error cargando apartamentos:", error);
      } finally {
        setIsLoadingApartments(false);
      }
    },
    [user, saveApartmentContext, isLoadingApartments]
  );

  // Función para seleccionar apartamento con contexto
  const setSelectedApartmentWithContext = useCallback(
    async (apartment: Apartamento | null) => {
      setSelectedApartment(apartment);

      // Actualizar contexto con nuevo apartamento
      if (apartment) {
        await saveApartmentContext(apartment);
      }
    },
    [saveApartmentContext]
  );

  // Función para limpiar apartamentos
  const clearApartments = useCallback(() => {
    setSelectedApartment(null);
    setApartamentos([]);
    setIsLoadingApartments(false);
  }, []);

  // Efecto para limpiar en logout
  useEffect(() => {
    if (!isAuthenticated) {
      clearApartments();
      // Limpiar cache de apartamentos
      try {
        apartmentCacheService.clearAllCache().catch((error) => {
          console.error(
            "Error limpiando cache de apartamentos en logout:",
            error
          );
        });
      } catch (error) {
        console.error(
          "Error limpiando cache de apartamentos en logout:",
          error
        );
      }
    }
  }, [isAuthenticated, clearApartments]);

  const contextValue = useMemo(
    () => ({
      selectedApartment,
      apartamentos,
      isLoadingApartments,
      setSelectedApartment: setSelectedApartmentWithContext,
      loadApartments,
      clearApartments,
    }),
    [
      selectedApartment,
      apartamentos,
      isLoadingApartments,
      setSelectedApartmentWithContext,
      loadApartments,
      clearApartments,
    ]
  );

  return (
    <ApartmentContext.Provider value={contextValue}>
      {children}
    </ApartmentContext.Provider>
  );
}

// Hook personalizado
export function useApartment() {
  const context = useContext(ApartmentContext);
  if (context === undefined) {
    throw new Error("useApartment debe usarse dentro de ApartmentProvider");
  }
  return context;
}
