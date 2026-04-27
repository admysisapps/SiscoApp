import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "expo-router";
import ProjectSelector from "@/components/ProjectSelector";
import AccessDenied from "@/app/(screens)/AccessDenied";
import LoadingScreen from "@/components/LoadingScreen";

import { useProject } from "@/contexts/ProjectContext";
import { useApartment } from "@/contexts/ApartmentContext";

import { Proyecto } from "@/types/Proyecto";

export default function ProjectSelectorScreen() {
  const router = useRouter();

  const {
    proyectos: proyectosTyped,
    setSelectedProject,
    projectsError,
  } = useProject();
  const { loadApartments } = useApartment();

  const [isReady, setIsReady] = useState(false);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (proyectosTyped.length > 0) {
      setIsReady(true);
    }
  }, [proyectosTyped.length]);

  const handleProjectSelected = useCallback(
    async (proyecto: Proyecto) => {
      const key = `${proyecto.nit}-${proyecto.rolUsuario}`;
      if (loadingKey) return;
      setLoadingKey(key);
      setSelectedProject(proyecto);

      try {
        if (proyecto.rolUsuario !== "admin") {
          await loadApartments(proyecto);
          router.replace("/(tabs)");
        } else {
          router.replace("/(admin)");
        }
      } catch (error) {
        console.error("[ProjectSelector] Error al cargar apartamentos:", error);
      } finally {
        if (isMounted.current) setLoadingKey(null);
      }
    },
    [loadingKey, setSelectedProject, loadApartments, router]
  );

  if (!isReady && !projectsError) {
    return <LoadingScreen />;
  }

  if (projectsError?.type === "projects_inactive") {
    return <AccessDenied reason="projects_inactive" />;
  }

  if (projectsError?.type === "no_projects" || proyectosTyped.length === 0) {
    return <AccessDenied reason="no_projects" />;
  }

  return (
    <ProjectSelector
      onProjectSelected={handleProjectSelected}
      loadingKey={loadingKey}
    />
  );
}
