import {
  CreatePublicacionRequest,
  TipoPublicacion,
  EstadoPublicacion,
  MotivoReporte,
  Publicacion,
} from "@/types/publicaciones";
import { apiService } from "./apiService";

interface BaseResponse {
  success: boolean;
  error?: string;
}

interface ListarPublicacionesResponse extends BaseResponse {
  publicaciones: Publicacion[];
  hay_mas: boolean;
  pagina: number;
}

interface ListarMisPublicacionesResponse extends BaseResponse {
  publicaciones: Publicacion[];
}

function assertSuccess(response: BaseResponse, contexto: string): void {
  if (!response.success) {
    throw new Error(response.error ?? `Error en ${contexto}`);
  }
}

export const publicacionesService = {
  async crearPublicacion(data: CreatePublicacionRequest): Promise<void> {
    const response = (await apiService.makeRequestWithContextType(
      "/publicaciones/crear",
      data,
      "PUBLICACIONES_CREATE"
    )) as BaseResponse;
    assertSuccess(response, "crearPublicacion");
  },

  async cambiarEstadoPublicacion(
    publicacionId: number,
    nuevoEstado: EstadoPublicacion
  ): Promise<void> {
    const response = (await apiService.makeRequestWithContextType(
      "/publicaciones/cambiar-estado",
      { publicacion_id: publicacionId, nuevo_estado: nuevoEstado },
      "PUBLICACIONES_UPDATE_STATE"
    )) as BaseResponse;
    assertSuccess(response, "cambiarEstadoPublicacion");
  },

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
  } = {}): Promise<ListarPublicacionesResponse> {
    const response = (await apiService.makeRequestWithContextType(
      "/publicaciones/listar",
      { pagina, limite, filtros },
      "PUBLICACIONES_LIST"
    )) as ListarPublicacionesResponse;
    assertSuccess(response, "listarPublicaciones");
    return response;
  },

  async listarMisPublicaciones(): Promise<ListarMisPublicacionesResponse> {
    const response = (await apiService.makeRequestWithContextType(
      "/publicaciones/listar-por-usuario",
      {},
      "PUBLICACIONES_LIST"
    )) as ListarMisPublicacionesResponse;
    assertSuccess(response, "listarMisPublicaciones");
    return response;
  },

  async bloquearPublicacion(
    publicacionId: number,
    razonBloqueo: string
  ): Promise<void> {
    const response = (await apiService.makeRequestWithContextType(
      "/publicaciones/bloquear",
      { publicacion_id: publicacionId, razon_bloqueo: razonBloqueo },
      "PUBLICACIONES_UPDATE_STATE_ADMIN"
    )) as BaseResponse;
    assertSuccess(response, "bloquearPublicacion");
  },

  async reportarPublicacion(
    publicacionId: number,
    motivo: MotivoReporte
  ): Promise<void> {
    const response = (await apiService.makeRequestWithContextType(
      "/publicaciones/reportar",
      { publicacion_id: publicacionId, motivo },
      "PUBLICACIONES_REPORT"
    )) as BaseResponse;
    assertSuccess(response, "reportarPublicacion");
  },
};
