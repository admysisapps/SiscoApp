// contexts/ProjectContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import type { ReactNode } from "react";
import { Proyecto } from "@/types/Proyecto";
import { useUser } from "./UserContext";
import { useAuth } from "./AuthContext";
import { apiService } from "@/services/apiService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import NetInfo from "@react-native-community/netinfo";

// Interfaz del Context
interface ProjectContextType {
  selectedProject: Proyecto | null;
  proyectos: Proyecto[];
  isLoadingProjects: boolean;
  setSelectedProject: (project: Proyecto | null) => void;
  switchProject: () => void;
  clearProject: () => void;
  isChangingProject: boolean;
  setIsChangingProject: (isChanging: boolean) => void;
  reloadProjects: () => Promise<void>;
}

// Crear el Context
const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

// Provider
export function ProjectProvider({ children }: { children: ReactNode }) {
  // Estados de proyectos
  const [selectedProject, setSelectedProject] = useState<Proyecto | null>(null);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [isChangingProject, setIsChangingProject] = useState<boolean>(false);
  const [hasTriedLoading, setHasTriedLoading] = useState(false);

  const { user } = useUser();
  const { isAuthenticated, currentUsername } = useAuth();
  const loadingRef = useRef(false);

  // Helper para sanitizar datos de usuario
  const sanitizeUserData = (
    data: string | number | null | undefined
  ): string | number | null | undefined => {
    if (typeof data === "string") {
      return data.replace(/[<>"'&]/g, "").substring(0, 255);
    }
    return data;
  };

  // Helper para guardar contexto SIN navegación (para updates internos)
  const saveProjectContextSilent = useCallback(
    async (
      project: Proyecto,
      user: {
        documento?: string;
        nombre?: string;
        rol?: string;
        email?: string;
      },
      apartment?: { codigo_apt?: string } | null
    ) => {
      try {
        const context = {
          documento: sanitizeUserData(user.documento),
          nombre: sanitizeUserData(user.nombre),
          email: sanitizeUserData(user.email),
          rol: sanitizeUserData(project.rol_usuario),
          proyecto_nit: sanitizeUserData(project.NIT),
          proyecto_nombre: sanitizeUserData(project.Nombre),
          copropiedad: sanitizeUserData(project.copropiedad),
          poderes_habilitados: project.poderes_habilitados,
          max_apoderados_propietario: project.max_apoderados_propietario,
          max_apoderados_admin: project.max_apoderados_admin,
          permiso_admin_apoderados: project.permiso_admin_apoderados,
          apartamento_codigo: sanitizeUserData(apartment?.codigo_apt) || null,
        };

        await AsyncStorage.setItem("user_context", JSON.stringify(context));

        //  BUENA PRÁCTICA: No sobrescribir el rol que ya es correcto
      } catch (error) {
        console.error("Error guardando contexto:", error);
      }
    },
    []
  );

  // Helper para guardar contexto CON navegación (para selección de proyecto)
  const saveProjectContextWithNavigation = useCallback(
    async (
      project: Proyecto,
      user: {
        documento?: string;
        nombre?: string;
        rol?: string;
        email?: string;
      },
      apartment?: { codigo_apt?: string } | null
    ) => {
      try {
        // IMPORTANTE: Actualizar selectedProject
        setSelectedProject(project);

        // Guardar contexto silenciosamente
        await saveProjectContextSilent(project, user, apartment);

        // NO navegar automáticamente - dejar que index.tsx maneje la navegación
      } catch (error) {
        console.error("Error guardando contexto con navegación:", error);
      }
    },
    [saveProjectContextSilent]
  );

  // Efecto para limpiar en logout
  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedProject(null);
      setProyectos([]);
      setIsLoadingProjects(false);
      setHasTriedLoading(false);
      loadingRef.current = false;
      // Limpiar caches
      try {
        AsyncStorage.removeItem("user_context");
      } catch (error) {
        console.error("Error limpiando caches en logout:", error);
      }
    }
  }, [isAuthenticated]);

  // Efecto para cargar proyectos cuando hay usuario autenticado (en paralelo)
  useEffect(() => {
    const loadProjects = async (username: string) => {
      if (loadingRef.current) return;

      loadingRef.current = true;
      setIsLoadingProjects(true);

      try {
        const response = await apiService.getProyectosUsuario(username);

        if (response.success && Array.isArray(response.data)) {
          const userProjects = response.data;
          setProyectos(userProjects);

          if (userProjects.length === 1) {
            const project = userProjects[0];
            setSelectedProject(project);
            const userData = user || { documento: username, nombre: username };
            await saveProjectContextWithNavigation(project, userData, null);
          }
        }
      } catch (error) {
        console.error("Error cargando proyectos:", error);
      } finally {
        setIsLoadingProjects(false);
        loadingRef.current = false;
      }
    };

    if (
      isAuthenticated &&
      currentUsername &&
      !hasTriedLoading &&
      proyectos.length === 0 &&
      !loadingRef.current
    ) {
      setHasTriedLoading(true);
      loadProjects(currentUsername);
    }
  }, [
    isAuthenticated,
    currentUsername,
    hasTriedLoading,
    proyectos.length,
    user,
    saveProjectContextWithNavigation,
  ]);

  // Reintentar cargar cuando se recupera la conexión
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (
        state.isConnected &&
        isAuthenticated &&
        currentUsername &&
        proyectos.length === 0 &&
        !loadingRef.current
      ) {
        setHasTriedLoading(false);
      }
    });

    return () => unsubscribe();
  }, [isAuthenticated, currentUsername, proyectos.length]);

  // ========================================
  // FUNCIONES MEMOIZADAS CON useCallback
  // ========================================
  // Todas las funciones están envueltas en useCallback para evitar
  // que se recreen en cada render

  // Función para seleccionar proyecto y guardar contexto
  const setSelectedProjectWithLog = useCallback(
    async (project: Proyecto | null) => {
      setSelectedProject(project);

      // Guardar contexto cuando se selecciona proyecto
      if (project && user) {
        await saveProjectContextWithNavigation(project, user, null);
      } else {
        try {
          await AsyncStorage.removeItem("user_context");
        } catch (error) {
          console.error(
            "Error limpiando contexto al seleccionar proyecto:",
            error
          );
        }
      }
    },
    [user, saveProjectContextWithNavigation]
  );

  // Función para cambiar de proyecto
  const switchProject = useCallback(async () => {
    setIsChangingProject(true);
    setSelectedProject(null);

    // Limpiar contexto al cambiar proyecto
    try {
      await AsyncStorage.removeItem("user_context");
    } catch (error) {
      console.error("Error limpiando contexto al cambiar proyecto:", error);
    }
  }, []);

  // Función para limpiar proyecto seleccionado
  const clearProject = useCallback(async () => {
    setSelectedProject(null);
    setIsChangingProject(false);
    // Limpiar contexto
    try {
      await AsyncStorage.removeItem("user_context");
    } catch (error) {
      console.error("Error limpiando contexto al limpiar proyecto:", error);
    }
  }, []);

  // Función para recargar proyectos (después de unirse a uno nuevo)
  const reloadProjects = useCallback(async () => {
    if (!user) return;

    const userDoc = user.documento || user.usuario;
    if (!userDoc) return;

    // Limpiar proyecto actual y contexto
    setSelectedProject(null);
    try {
      await AsyncStorage.removeItem("user_context");
    } catch (error) {
      console.error("Error limpiando contexto:", error);
    }

    // Recargar proyectos directamente sin usar loadProjects
    if (loadingRef.current) return;

    loadingRef.current = true;
    setIsLoadingProjects(true);

    try {
      const response = await apiService.getProyectosUsuario(userDoc);

      if (response.success && Array.isArray(response.data)) {
        const userProjects = response.data;
        setProyectos(userProjects);
        // No auto-seleccionar proyecto después de recargar
      }
    } catch (error) {
      console.error("Error recargando proyectos:", error);
    } finally {
      setIsLoadingProjects(false);
      loadingRef.current = false;
    }
  }, [user]);

  // ========================================
  // VALOR DEL CONTEXTO MEMOIZADO
  // ========================================
  // useMemo previene que el objeto de contexto se recree en cada render
  // Solo se recrea cuando alguna de sus dependencias cambia
  const contextValue = useMemo(
    () => ({
      selectedProject,
      proyectos,
      isLoadingProjects,
      isChangingProject,
      setSelectedProject: setSelectedProjectWithLog,
      switchProject,
      clearProject,
      setIsChangingProject,
      reloadProjects,
    }),
    [
      selectedProject,
      proyectos,
      isLoadingProjects,
      isChangingProject,
      setSelectedProjectWithLog,
      switchProject,
      clearProject,
      reloadProjects,
    ]
  );

  return (
    <ProjectContext.Provider value={contextValue}>
      {children}
    </ProjectContext.Provider>
  );
}

// Hook personalizado
export function useProject() {
  const context = useContext(ProjectContext);
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider");
  }
  return context;
}
