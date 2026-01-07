import { useUser } from "@/contexts/UserContext";
import { useProject } from "@/contexts/ProjectContext";

export const useRole = () => {
  const { user } = useUser();
  const { selectedProject } = useProject();

  // PRIORIDAD: rol del proyecto seleccionado, luego rol del usuario
  const currentRole =
    selectedProject?.rol_usuario || user?.rol || "propietario";

  const isAdmin = currentRole === "admin";
  const isUser = currentRole === "propietario";

  return {
    isAdmin,
    isUser,
    role: currentRole,
  };
};
