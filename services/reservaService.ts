import { apiService } from "./apiService";
import { EstadoReserva } from "@/types/Reserva";

export const reservaService = {
  //Crear espacio común - Solo Admin

  async crearEspacio(espacioData: any) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/zonascomunes/crear",
        espacioData,
        "SPACES_ADMIN_CREATE"
      );

      // Si la lambda devuelve error específico, usarlo
      if (!response.success && response.error) {
        return {
          success: false,
          error: response.error, // Error específico de la lambda
        };
      }

      return response;
    } catch (error: any) {
      console.error("Error creando espacio:", error);

      // Si hay mensaje específico en el error, usarlo
      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        "Error al crear espacio";

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  //Listar espacios comunes

  async listarEspacios(
    params: {
      solo_activos?: boolean;
      incluir_horarios?: boolean;
    } = {}
  ) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/zonascomunes/listar",
        {
          solo_activos: params.solo_activos ?? true,
          incluir_horarios: params.incluir_horarios ?? false,
        },
        "SPACES_LIST"
      );
      return response;
    } catch (error) {
      console.error("Error listando espacios:", error);
      return {
        success: false,
        error: "Error al obtener espacios",
      };
    }
  },

  // Listar espacios comunes SIN CACHE - Para zona-disponibles

  async listarEspaciosFresh(
    params: {
      solo_activos?: boolean;
      incluir_horarios?: boolean;
    } = {}
  ) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/zonascomunes/listar",
        {
          solo_activos: params.solo_activos ?? true,
          incluir_horarios: params.incluir_horarios ?? false,
          _timestamp: Date.now(), // Forzar petición fresca
        },
        "SPACES_LIST"
      );
      return response;
    } catch (error) {
      console.error("Error listando espacios fresh:", error);
      return {
        success: false,
        error: "Error al obtener espacios",
      };
    }
  },

  // Obtener detalle de espacio por ID

  async obtenerEspacio(espacioId: number) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/zonascomunes/detalle",
        {
          espacio_id: espacioId,
        },
        "SPACES_DETAIL"
      );
      return response;
    } catch (error) {
      console.error("Error obteniendo espacio:", error);
      return {
        success: false,
        error: "Error al obtener detalle del espacio",
      };
    }
  },

  // Editar espacio común - Solo Admin

  async editarEspacio(espacioId: number, espacioData: any) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/zonascomunes/actualizar",
        {
          espacio_id: espacioId,
          ...espacioData,
        },
        "SPACES_ADMIN_EDIT"
      );

      if (!response.success && response.error) {
        return {
          success: false,
          error: response.error,
        };
      }

      return response;
    } catch (error: any) {
      console.error("Error editando espacio:", error);

      const errorMessage =
        error?.response?.data?.error ||
        error?.message ||
        "Error al editar espacio";

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  //RESERVAS

  //Validar disponibilidad de un espacio en un rango de tiempo

  async validarDisponibilidad(params: {
    espacio_id: number;
    fecha_reserva: string;
    hora_inicio: string;
    hora_fin: string;
  }) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/reservas/validar-minutos",
        params,
        "RESERVATIONS_VALIDATE"
      );
      return response;
    } catch (error) {
      console.error("Error validando disponibilidad:", error);
      return {
        success: false,
        error: "Error al validar disponibilidad",
      };
    }
  },

  //Obtener horarios disponibles de un día

  async obtenerHorariosDia(params: {
    espacio_id: number;
    fecha_reserva: string;
    tipo_reserva: string;
  }) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/reservas/validar-horas",
        params,
        "RESERVATIONS_VALIDATE"
      );
      return response;
    } catch (error) {
      console.error("Error obteniendo horarios del día:", error);
      return {
        success: false,
        error: "Error al obtener horarios",
      };
    }
  },

  //Crear nueva reserva

  async crearReserva(params: {
    espacio_id: number;
    fecha_reserva: string;
    hora_inicio: string;
    hora_fin: string;
    precio_total: number;
    duracion_minutos?: number;
    motivo?: string;
  }) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/reservas/crear",
        params,
        "RESERVAS_CREATE"
      );
      return response;
    } catch (error) {
      console.error("Error creando reserva:", error);
      return {
        success: false,
        error: "Error al crear la reserva",
      };
    }
  },

  // Listar reservas por mes con paginación y filtros

  async listarReservas(params: {
    mes: number; // OBLIGATORIO: 1-12
    anio: number; // OBLIGATORIO: 2020-2030
    pagina?: number;
    limite?: number;
    estado?: EstadoReserva;
    espacio_id?: number;
  }) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/reservas/listar",
        {
          mes: params.mes,
          anio: params.anio,
          pagina: params.pagina || 1,
          limite: params.limite || 20,
          filtros: {
            estado: params.estado,
            espacio_id: params.espacio_id,
          },
        },
        "RESERVAS_LIST"
      );
      return response;
    } catch (error) {
      console.error("Error listando reservas:", error);
      return {
        success: false,
        error: "Error al obtener reservas",
      };
    }
  },

  // Cancelar reserva

  async cancelarReserva(reservaId: number, motivo?: string) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/reservas/cancelar",
        {
          reserva_id: reservaId,
          motivo_cancelacion: motivo,
        },
        "RESERVAS_CANCEL"
      );
      return response;
    } catch (error) {
      console.error("Error cancelando reserva:", error);
      return {
        success: false,
        error: "Error al cancelar reserva",
      };
    }
  },

  // Obtener detalle de reserva - Funciona para propietarios y administradores

  async obtenerReservaDetalle(reservaId: number) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/reservas/detalle",
        {
          reserva_id: reservaId,
        },
        "RESERVAS_DETAIL"
      );
      return response;
    } catch (error) {
      console.error("Error obteniendo detalle de reserva:", error);
      return {
        success: false,
        error: "Error al obtener detalle de la reserva",
      };
    }
  },

  //Cambiar estado de reserva - Solo Admin

  async cambiarEstadoReserva(
    reservaId: number,
    nuevoEstado: EstadoReserva,
    observaciones?: string
  ) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/reservas/cambiar-estado",
        {
          reserva_id: reservaId,
          nuevo_estado: nuevoEstado,
          observaciones: observaciones,
        },
        "RESERVAS_ADMIN"
      );
      return response;
    } catch (error) {
      console.error("Error cambiando estado de reserva:", error);
      return {
        success: false,
        error: "Error al cambiar estado de la reserva",
      };
    }
  },

  // Actualizar observaciones de reserva - Solo Admin

  async actualizarObservaciones(reservaId: number, observaciones: string) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/reservas/observaciones",
        {
          reserva_id: reservaId,
          observaciones: observaciones,
        },
        "RESERVAS_ADMIN"
      );
      return response;
    } catch (error) {
      console.error("Error actualizando observaciones:", error);
      return {
        success: false,
        error: "Error al actualizar observaciones",
      };
    }
  },
};
