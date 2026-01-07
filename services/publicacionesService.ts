import {
  CreatePublicacionRequest,
  TipoPublicacion,
  EstadoPublicacion,
} from "@/types/publicaciones";
import { apiService } from "./apiService";

export const publicacionesService = {
  //Crear nueva publicación

  async crearPublicacion(data: CreatePublicacionRequest) {
    try {
      return await apiService.makeRequestWithContextType(
        "/publicaciones/crear",
        data,
        "PUBLICACIONES_CREATE"
      );
    } catch (error: any) {
      throw error;
    }
  },

  // Cambiar estado de publicación (pausar/activar/finalizar)

  async cambiarEstadoPublicacion(
    publicacionId: number,
    nuevoEstado: EstadoPublicacion
  ) {
    try {
      return await apiService.makeRequestWithContextType(
        "/publicaciones/cambiar-estado",
        {
          publicacion_id: publicacionId,
          nuevo_estado: nuevoEstado,
        },
        "PUBLICACIONES_UPDATE_STATE"
      );
    } catch (error: any) {
      throw error;
    }
  },

  // Listar publicaciones con paginación

  async listarPublicaciones({
    pagina = 1,
    limite = 12,
    filtros = {},
  }: {
    pagina?: number;
    limite?: number;
    filtros?: {
      tipo?: TipoPublicacion;
      estado?: EstadoPublicacion;
      mis_publicaciones?: boolean;
    };
  } = {}) {
    try {
      return await apiService.makeRequestWithContextType(
        "/publicaciones/listar",
        {
          pagina,
          limite,
          filtros,
        },
        "PUBLICACIONES_LIST"
      );
    } catch (error: any) {
      throw error;
    }
  },

  //Listar mis publicaciones

  async listarMisPublicaciones() {
    try {
      return await apiService.makeRequestWithContextType(
        "/publicaciones/listar-por-usuario",
        {},
        "PUBLICACIONES_LIST"
      );
    } catch (error: any) {
      throw error;
    }
  },

  //  Bloquear publicación (solo admin)

  async bloquearPublicacion(publicacionId: number, razonBloqueo: string) {
    try {
      return await apiService.makeRequestWithContextType(
        "/publicaciones/bloquear",
        {
          publicacion_id: publicacionId,
          razon_bloqueo: razonBloqueo,
        },
        "PUBLICACIONES_UPDATE_STATE_ADMIN"
      );
    } catch (error: any) {
      throw error;
    }
  },
};
