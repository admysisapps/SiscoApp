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
import { AppError } from "@/types/AppError";
import { useUser } from "./UserContext";
import { useAuth } from "./AuthContext";
import { apiService } from "@/services/apiService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { userCacheService } from "@/services/cache/userCacheService";
import NetInfo from "@react-native-community/netinfo";

// Interfaz del Context
interface ProjectContextType {
  selectedProject: Proyecto | null;
  proyectos: Proyecto[];
  isLoadingProjects: boolean;
  projectsError: AppError | null;
  setSelectedProject: (project: Proyecto | null) => void;
  switchProject: () => void;
  reloadProjects: () => Promise<void>;
}

// Crear el Context
const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

function sanitizeUserData(
  data: string | number | null | undefined
): string | number | null | undefined {
  if (typeof data === "string") {
    return data.replace(/[<>"'&]/g, "").substring(0, 255);
  }
  return data;
}

// Provider
export function ProjectProvider({ children }: { children: ReactNode }) {
  // Estados de proyectos
  const [selectedProject, setSelectedProject] = useState<Proyecto | null>(null);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);
  const [hasTriedLoading, setHasTriedLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<AppError | null>(null);

  const { user, hasInitialized: userInitialized } = useUser();
  const { isAuthenticated, currentUsername } = useAuth();
  const loadingRef = useRef(false);

  // Persiste el contexto del proyecto en AsyncStorage
  const persistProjectContext = useCallback(
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
          rol: sanitizeUserData(project.rolUsuario),
          proyecto_nit: sanitizeUserData(project.nit),
          proyecto_nombre: sanitizeUserData(project.nombre),
          copropiedad: sanitizeUserData(project.copropiedad),
          poderes_habilitados: project.poderesHabilitados,
          max_apoderados_propietario: project.maxApoderadosPropietario,
          max_apoderados_admin: project.maxApoderadosAdmin,
          permiso_admin_apoderados: project.permisoAdminApoderados,
          apartamento_codigo: sanitizeUserData(apartment?.codigo_apt) || null,
        };

        await AsyncStorage.setItem("user_context", JSON.stringify(context));
      } catch (error) {
        console.error("Error guardando contexto:", error);
      }
    },
    []
  );

  // Aplica la selección de proyecto: actualiza estado y persiste en AsyncStorage

  // Efecto para limpiar en logout
  useEffect(() => {
    if (!isAuthenticated) {
      setSelectedProject(null);
      setProyectos([]);
      setIsLoadingProjects(false);
      setHasTriedLoading(false);
      loadingRef.current = false;
      userCacheService.clearProjectContext();
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
          setProjectsError(null);
          const userProjects = response.data;
          setProyectos(userProjects);

          if (userProjects.length === 1) {
            const project = userProjects[0];
            setSelectedProject(project);
            const userData = user || { documento: username, nombre: username };
            await persistProjectContext(project, userData, null);
          }
        } else if (response.statusCode === 403) {
          setProjectsError({ type: "projects_inactive" });
        } else if (response.statusCode === 404) {
          setProjectsError({ type: "no_projects" });
        } else {
          setProjectsError({ type: "server_error", retryable: true });
        }
      } catch (error) {
        console.error("Error cargando proyectos:", error);
        setProjectsError({ type: "server_error", retryable: true });
      } finally {
        setIsLoadingProjects(false);
        loadingRef.current = false;
      }
    };

    if (
      isAuthenticated &&
      currentUsername &&
      userInitialized &&
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
    userInitialized,
    hasTriedLoading,
    proyectos.length,
    user,
    persistProjectContext,
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

  // FUNCIONES MEMOIZADAS CON useCallback
  // Todas las funciones están envueltas en useCallback para evitar
  // que se recreen en cada render

  // Función para seleccionar proyecto y guardar contexto
  const handleSetSelectedProject = useCallback(
    async (project: Proyecto | null) => {
      setSelectedProject(project);

      if (project && user) {
        await persistProjectContext(project, user, null);
      } else {
        await userCacheService.clearProjectContext();
      }
    },
    [user, persistProjectContext]
  );

  // Función para cambiar de proyecto
  const switchProject = useCallback(async () => {
    setSelectedProject(null);
    await userCacheService.clearProjectContext();
  }, []);

  // Función para recargar proyectos (después de unirse a uno nuevo)
  const reloadProjects = useCallback(async () => {
    if (!currentUsername) return;

    setSelectedProject(null);
    await userCacheService.clearProjectContext();

    // Recargar proyectos directamente sin usar loadProjects
    if (loadingRef.current) return;

    loadingRef.current = true;
    setIsLoadingProjects(true);

    try {
      const response = await apiService.getProyectosUsuario(currentUsername);

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
  }, [currentUsername]);

  // VALOR DEL CONTEXTO MEMOIZADO
  // useMemo previene que el objeto de contexto se recree en cada render
  // Solo se recrea cuando alguna de sus dependencias cambia
  const contextValue = useMemo(
    () => ({
      selectedProject,
      proyectos,
      isLoadingProjects,
      projectsError,
      setSelectedProject: handleSetSelectedProject,
      switchProject,
      reloadProjects,
    }),
    [
      selectedProject,
      proyectos,
      isLoadingProjects,
      projectsError,
      handleSetSelectedProject,
      switchProject,
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
