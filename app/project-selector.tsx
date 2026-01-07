import React, { useEffect, useState } from "react";
import { Redirect } from "expo-router";
import ProjectSelector from "../components/ProjectSelector";
import AccessDenied from ".//(screens)/AccessDenied";
import LoadingScreen from "@/components/LoadingScreen";

import { useProject } from "@/contexts/ProjectContext";

import { Proyecto } from "@/types/Proyecto";

export default function ProjectSelectorScreen() {
  // Usar proyectos del contexto
  const {
    proyectos: proyectosTyped,
    selectedProject,
    setSelectedProject,
  } = useProject();

  // Estado para controlar cuándo la interfaz está lista para mostrarse
  const [isReady, setIsReady] = useState(false);

  // Efecto simplificado - solo maneja la UI
  useEffect(() => {
    if (proyectosTyped.length > 0) {
      setIsReady(true);
    }
  }, [proyectosTyped.length]);

  // Función que maneja la selección manual de un proyecto
  const handleProjectSelected = (proyecto: Proyecto) => {
    setSelectedProject(proyecto);
  };

  // NAVEGACIÓN: Si hay un proyecto seleccionado, navegar según el rol
  if (selectedProject) {
    if (selectedProject.rol_usuario === "admin") {
      return <Redirect href="/(admin)" />;
    } else {
      return <Redirect href="/(tabs)" />;
    }
  }

  // LOADING: Si no está listo, no mostrar nada (LoadingOverlay se encarga de la pantalla de carga)
  if (!isReady) {
    return <LoadingScreen />;
  }

  // ESTADO VACÍO: Usuario sin proyectos asignados - Mostrar AccessDenied
  if (proyectosTyped.length === 0) {
    return <AccessDenied />;
  }

  // SELECTOR: Mostrar lista de proyectos para que el usuario elija (solo si tiene múltiples)

  return <ProjectSelector onProjectSelected={handleProjectSelected} />;
}
