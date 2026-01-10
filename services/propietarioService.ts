import { apiService } from "./apiService";
import {
  BuscarUsuarioResponse,
  CrearUsuarioData,
  TransferirPropiedadData,
} from "@/types/CambioPropietario";

export const propietarioService = {
  // Busca un usuario por cédula en el proyecto actual

  async buscarUsuario(cedula: string): Promise<{
    success: boolean;
    data?: BuscarUsuarioResponse;
    error?: string;
  }> {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/propietarios/buscar",
        {
          cedula: cedula.trim(),
        },
        "PROPIETARIOS_ADMIN"
      );

      if (response.success) {
        return {
          success: true,
          data: response,
        };
      } else {
        return {
          success: false,
          error: response.error || "Error al buscar usuario",
        };
      }
    } catch (error: any) {
      console.error("Error buscando usuario:", error);
      return {
        success: false,
        error: "Sin conexión. Verifica tu red e intenta nuevamente",
      };
    }
  },

  // Crea un nuevo usuario en el proyecto

  async crearUsuario(userData: CrearUsuarioData): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/propietarios/crear",
        userData,
        "PROPIETARIOS_ADMIN"
      );

      if (response.success) {
        return {
          success: true,
          data: response,
        };
      } else {
        return {
          success: false,
          error: response.error || "Error al crear usuario",
        };
      }
    } catch (error: any) {
      console.error("Error creando usuario:", error);
      return {
        success: false,
        error: "Sin conexión. Verifica tu red e intenta nuevamente",
      };
    }
  },

  // Transfiere la propiedad de un apartamento

  async transferirPropiedad(transferData: TransferirPropiedadData): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/inmuebles/transferir",
        transferData,
        "PROPIETARIOS_ADMIN_TRANSFER"
      );

      if (response.success) {
        return {
          success: true,
          data: response,
        };
      } else {
        return {
          success: false,
          error: response.error || "Error al transferir propiedad",
        };
      }
    } catch (error: any) {
      console.error("Error transfiriendo propiedad:", error);
      return {
        success: false,
        error: "Sin conexión. Verifica tu red e intenta nuevamente",
      };
    }
  },

  // Lista todos los apartamentos del proyecto

  async listarApartamentos(): Promise<{
    success: boolean;
    data?: any[];
    error?: string;
  }> {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/inmuebles/listar",
        {},
        "PROPIETARIOS_ADMIN"
      );

      if (response.success) {
        return {
          success: true,
          data: response.apartamentos || [],
        };
      } else {
        return {
          success: false,
          error: response.error || "Error al listar apartamentos",
        };
      }
    } catch (error: any) {
      console.error("Error listando apartamentos:", error);
      return {
        success: false,
        error: "Sin conexión. Verifica tu red e intenta nuevamente",
      };
    }
  },

  // Elimina la cuenta del usuario actual

  async eliminarCuenta(): Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }> {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/usuarios/eliminar-cuenta",
        {},
        "DELETE_ACCOUNT"
      );

      if (response.success) {
        return {
          success: true,
          message: response.message || "Cuenta eliminada exitosamente",
        };
      } else {
        return {
          success: false,
          error: response.error || "Error al eliminar cuenta",
        };
      }
    } catch (error: any) {
      console.error("Error eliminando cuenta:", error);
      return {
        success: false,
        error: "Sin conexión. Verifica tu red e intenta nuevamente",
      };
    }
  },
};
