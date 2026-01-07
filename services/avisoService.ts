import { apiService } from "./apiService";
import { CreateAvisoRequest } from "@/types/Avisos";

export const avisosService = {
  async crearAviso(avisoData: CreateAvisoRequest) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/comunicados/crear",
        avisoData,
        "PROPIETARIOS_ADMIN_TRANSFER"
      );

      if (!response.success && response.error) {
        return { success: false, error: response.error };
      }

      return response;
    } catch (error: any) {
      return {
        success: false,
        error:
          error?.response?.data?.error ||
          error?.message ||
          "Error al crear aviso",
      };
    }
  },

  async obtenerAvisos(pagina: number = 1, limite: number = 15) {
    try {
      return await apiService.makeRequestWithContextType(
        "/comunicados/listar",
        { pagina, limite },
        "AVISOS"
      );
    } catch {
      return { success: false, error: "Error al obtener avisos" };
    }
  },
};
