import { apiService } from "./apiService";

export interface ProjectInfo {
  nit: string;
  nombre: string;
  descripcion: string;
  database_name: string;
}

// Servicio para gestión de proyectos

export const projectService = {
  //Verificar código y obtener info del proyecto

  async verificarCodigoInvitacion(codigoInvitacion: string): Promise<{
    success: boolean;
    proyecto?: ProjectInfo;
    error?: string;
    yaUnido?: boolean;
    message?: string;
    email?: string;
  }> {
    try {
      return await apiService.makeRequestWithContextType(
        "/proyectos/validar-codigo",
        {
          codigo_invitacion: codigoInvitacion.trim(),
        },
        "USER_JOIN_PROJECT"
      );
    } catch (error) {
      console.error("Error verificando código:", error);
      throw error;
    }
  },

  // Unirse al proyecto (después de verificar)

  async unirseAProyecto(codigoInvitacion: string): Promise<{
    success: boolean;
    message?: string;
    email?: string;
    error?: string;
  }> {
    try {
      return await apiService.makeRequestWithContextType(
        "/usuarios/unirse-proyecto",
        {
          codigo_invitacion: codigoInvitacion.trim(),
        },
        "USER_JOIN_PROJECT"
      );
    } catch (error) {
      console.error("Error uniéndose al proyecto:", error);
      throw error;
    }
  },
};
