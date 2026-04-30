import { useUser } from "@/contexts/UserContext";
import { useProject } from "@/contexts/ProjectContext";
import { ROLES, UserRole } from "@/types/Roles";

export const useRole = () => {
  const { user } = useUser();
  const { selectedProject } = useProject();

  // PRIORIDAD: rol del proyecto seleccionado, luego rol del usuario
  const currentRole: UserRole = (selectedProject?.rolUsuario ||
    user?.rol ||
    ROLES.PROPIETARIO) as UserRole;

  const isAdmin = currentRole === ROLES.ADMIN;
  const isUser = currentRole === ROLES.PROPIETARIO;
  const isContador = currentRole === ROLES.CONTADOR;

  return {
    isAdmin,
    isUser,
    isContador,
    role: currentRole,
  };
};
