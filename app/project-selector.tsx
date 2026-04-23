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

  const { proyectos: proyectosTyped, setSelectedProject } = useProject();
  const { loadApartments } = useApartment();

  const [isReady, setIsReady] = useState(false);
  const [loadingNit, setLoadingNit] = useState<string | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => { isMounted.current = false; };
  }, []);

  useEffect(() => {
    if (proyectosTyped.length > 0) {
      setIsReady(true);
    }
  }, [proyectosTyped.length]);

  const handleProjectSelected = useCallback(async (proyecto: Proyecto) => {
    if (loadingNit) return;
    setLoadingNit(proyecto.nit);
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
      if (isMounted.current) setLoadingNit(null);
    }
  }, [loadingNit, setSelectedProject, loadApartments, router]);

  if (!isReady) {
    return <LoadingScreen />;
  }

  if (proyectosTyped.length === 0) {
    return <AccessDenied />;
  }

  return (
    <ProjectSelector
      onProjectSelected={handleProjectSelected}
      loadingNit={loadingNit}
    />
  );
}
