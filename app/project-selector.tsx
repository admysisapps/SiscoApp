import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import ProjectSelector from "../components/ProjectSelector";
import AccessDenied from ".//(screens)/AccessDenied";
import LoadingScreen from "@/components/LoadingScreen";

import { useProject } from "@/contexts/ProjectContext";
import { useApartment } from "@/contexts/ApartmentContext";

import { Proyecto } from "@/types/Proyecto";

export default function ProjectSelectorScreen() {
  const router = useRouter();

  // Usar proyectos del contexto
  const { proyectos: proyectosTyped, setSelectedProject } = useProject();
  const { loadApartments } = useApartment();

  // Estado para controlar cuándo la interfaz está lista para mostrarse
  const [isReady, setIsReady] = useState(false);

  // Efecto simplificado - solo maneja la UI
  useEffect(() => {
    if (proyectosTyped.length > 0) {
      setIsReady(true);
    }
  }, [proyectosTyped.length]);

  // Función que maneja la selección manual de un proyecto
  const handleProjectSelected = async (proyecto: Proyecto) => {
    setSelectedProject(proyecto);

    try {
      // Si no es admin, cargar apartamentos antes de navegar
      if (proyecto.rolUsuario !== "admin") {
        await loadApartments(proyecto);
        router.replace("/(tabs)");
      } else {
        router.replace("/(admin)");
      }
    } catch (error) {
      console.error("[ProjectSelector] Error al cargar apartamentos:", error);
    }
  };

  // NAVEGACIÓN: Eliminada - ahora se hace en handleProjectSelected

  // LOADING: Si no está listo, no mostrar nada
  if (!isReady) {
    return <LoadingScreen />;
  }

  // ESTADO VACÍO: Usuario sin proyectos asignados
  if (proyectosTyped.length === 0) {
    return <AccessDenied />;
  }

  // SELECTOR: Mostrar lista de proyectos para que el usuario elija
  return <ProjectSelector onProjectSelected={handleProjectSelected} />;
}
