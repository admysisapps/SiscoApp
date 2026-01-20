import { useEffect, useRef } from "react";
import { useProject } from "@/contexts/ProjectContext";
import { useApartment } from "@/contexts/ApartmentContext";

/**
 * Hook que conecta ProjectContext con ApartmentContext
 * Carga automáticamente apartamentos cuando se selecciona un proyecto
 */
export function useProjectApartment() {
  const { selectedProject } = useProject();
  const { loadApartments, clearApartments } = useApartment();
  const lastProjectRef = useRef<string | null>(null);

  // Cargar apartamentos cuando se selecciona un proyecto
  useEffect(() => {
    const currentProjectId = selectedProject?.nit || null;

    // Solo ejecutar si el proyecto realmente cambió
    if (lastProjectRef.current !== currentProjectId) {
      lastProjectRef.current = currentProjectId;

      if (selectedProject && selectedProject.rolUsuario !== "admin") {
        // Ejecutar de forma asíncrona para no bloquear el renderizado
        setTimeout(() => {
          loadApartments(selectedProject);
        }, 0);
      } else {
        clearApartments();
      }
    }
  }, [selectedProject, loadApartments, clearApartments]);

  return {
    // Re-exportar funciones de ambos contextos para compatibilidad
    ...useProject(),
    ...useApartment(),
  };
}
