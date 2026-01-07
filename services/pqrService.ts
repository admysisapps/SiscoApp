import { CreatePQRRequest, EstadoPQR } from "@/types/Pqr";
import { apiService } from "./apiService";

export const pqrService = {
  // Obtener PQRs con paginación
  async obtenerPQRs(pagina: number = 1, limite: number = 10) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/pqr/listar",
        {
          pagina,
          limite,
        },
        "PQR_LIST"
      ); // Lista de PQRs con filtrado por apartamento

      if (response.success) {
        return {
          success: true,
          data: response.pqrs || [],
          pagination: {
            pagina_actual: Number(response.pagina_actual) || pagina,
            total_paginas: Number(response.total_paginas) || 1,
            total_registros: Number(response.total_registros) || 0,
            limite: Number(response.limite) || limite,
          },
        };
      } else {
        return {
          success: false,
          error: response.error || "Error al obtener PQRs",
        };
      }
    } catch (error: any) {
      // Detectar errores de red en React Native
      if (
        error.message?.includes("Network request failed") ||
        error.message?.includes("fetch") ||
        error.name === "NetworkError" ||
        error.code === "NETWORK_ERROR"
      ) {
        return { success: false, error: "Sin conexión a internet" };
      }
      if (error.status === 401) {
        return { success: false, error: "Sesión expirada" };
      }
      if (error.status === 403) {
        return { success: false, error: "Sin permisos para ver PQRs" };
      }
      if (error.status >= 500) {
        return {
          success: false,
          error: "Error del servidor, inténtalo más tarde",
        };
      }
      return { success: false, error: "Error al cargar PQRs" };
    }
  },

  // Crear nueva PQR
  async crearPQR(
    pqrData: CreatePQRRequest & {
      archivo_s3_key?: string;
      archivo_nombre?: string;
    }
  ) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/pqr/crear",
        {
          ...pqrData,
        },
        "PQR_CREATE"
      );

      if (response.success) {
        return {
          success: true,
          data: response.pqr,
          message: response.message || "PQR creada exitosamente",
        };
      } else {
        return {
          success: false,
          error: response.error || "Error al crear PQR",
        };
      }
    } catch (error: any) {
      // Detectar errores de red en React Native
      if (
        error.message?.includes("Network request failed") ||
        error.message?.includes("fetch") ||
        error.name === "NetworkError" ||
        error.code === "NETWORK_ERROR"
      ) {
        return { success: false, error: "Sin conexión a internet" };
      }
      if (error.status === 400) {
        return { success: false, error: "Datos inválidos en la PQR" };
      }
      if (error.status === 413) {
        return { success: false, error: "Archivo demasiado grande" };
      }
      if (error.status >= 500) {
        return {
          success: false,
          error: "Error del servidor, inténtalo más tarde",
        };
      }
      return { success: false, error: "Error al crear PQR" };
    }
  },

  // Obtener PQR por ID
  async obtenerPQRPorId(idPqr: number) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/pqr/detalle",
        {
          id_pqr: idPqr,
        },
        "PQR_DETAIL"
      ); // Necesita validar acceso a PQR específica

      if (response.success) {
        return {
          success: true,
          data: response.pqr,
        };
      } else {
        return {
          success: false,
          error: response.error || "Error al obtener detalle de PQR",
        };
      }
    } catch (error: any) {
      // Detectar errores de red en React Native
      if (
        error.message?.includes("Network request failed") ||
        error.message?.includes("fetch") ||
        error.name === "NetworkError" ||
        error.code === "NETWORK_ERROR"
      ) {
        return { success: false, error: "Sin conexión a internet" };
      }
      if (error.status === 404) {
        return { success: false, error: "PQR no encontrada" };
      }
      if (error.status === 403) {
        return { success: false, error: "Sin permisos para ver esta PQR" };
      }
      return { success: false, error: "Error al cargar PQR" };
    }
  },

  // Actualizar estado de PQR (solo admin)
  async actualizarEstadoPQR(idPqr: number, nuevoEstado: EstadoPQR) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/pqr/cambiar-estado",
        {
          id_pqr: idPqr,
          estado_pqr: nuevoEstado,
        },
        "PQR_ADMIN"
      );

      if (response.success) {
        return {
          success: true,
          data: response.pqr,
          message: response.message || "Estado actualizado exitosamente",
        };
      } else {
        return {
          success: false,
          error: response.error || "Error al actualizar estado",
        };
      }
    } catch (error: any) {
      // Detectar errores de red en React Native
      if (
        error.message?.includes("Network request failed") ||
        error.message?.includes("fetch") ||
        error.name === "NetworkError" ||
        error.code === "NETWORK_ERROR"
      ) {
        return { success: false, error: "Sin conexión a internet" };
      }
      if (error.status === 403) {
        return {
          success: false,
          error: "Solo administradores pueden cambiar estados",
        };
      }
      if (error.status === 400) {
        return { success: false, error: "Estado no válido para esta PQR" };
      }
      return { success: false, error: "Error al actualizar estado" };
    }
  },

  // Obtener mensajes de seguimiento de una PQR
  async obtenerMensajes(idPqr: number) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/pqr/listar-mensajes",
        {
          id_pqr: idPqr,
        },
        "PQR_MESSAGES"
      );

      if (response.success) {
        return {
          success: true,
          data: response.mensajes || [],
        };
      } else {
        return {
          success: false,
          error: response.error || "Error al obtener mensajes",
        };
      }
    } catch (error: any) {
      // Detectar errores de red en React Native
      if (
        error.message?.includes("Network request failed") ||
        error.message?.includes("fetch") ||
        error.name === "NetworkError" ||
        error.code === "NETWORK_ERROR"
      ) {
        return { success: false, error: "Sin conexión a internet" };
      }
      if (error.status === 404) {
        return { success: false, error: "PQR no encontrada" };
      }
      return { success: false, error: "Error al cargar mensajes" };
    }
  },

  // Enviar mensaje de seguimiento a una PQR
  async enviarMensaje(idPqr: number, mensaje: string) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/pqr/enviar-mensajes",
        {
          id_pqr: idPqr,
          mensaje: mensaje.trim(),
        },
        "PQR_MESSAGES"
      ); // Valida acceso y envía mensaje

      if (response.success) {
        return {
          success: true,
          data: response.mensaje,
          message: response.message || "Mensaje enviado exitosamente",
        };
      } else {
        return {
          success: false,
          error: response.error || "Error al enviar mensaje",
        };
      }
    } catch (error: any) {
      // Detectar errores de red en React Native
      if (
        error.message?.includes("Network request failed") ||
        error.message?.includes("fetch") ||
        error.name === "NetworkError" ||
        error.code === "NETWORK_ERROR"
      ) {
        return { success: false, error: "Sin conexión a internet" };
      }
      if (error.status === 400) {
        return {
          success: false,
          error: "No se pueden agregar mensajes a esta PQR",
        };
      }
      if (error.status === 403) {
        return { success: false, error: "Sin permisos para responder" };
      }
      return { success: false, error: "Error al enviar mensaje" };
    }
  },

  // Anular PQR (solo el creador y si está pendiente)
  async anularPQR(idPqr: number) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/pqr/anular",
        {
          id_pqr: idPqr,
        },
        "PQR_DETAIL"
      ); // Valida que sea el creador de la PQR

      if (response.success) {
        return {
          success: true,
          data: response.pqr,
          message: response.message || "PQR anulada exitosamente",
        };
      } else {
        return {
          success: false,
          error: response.error || "Error al anular PQR",
        };
      }
    } catch (error: any) {
      // Detectar errores de red en React Native
      if (
        error.message?.includes("Network request failed") ||
        error.message?.includes("fetch") ||
        error.name === "NetworkError" ||
        error.code === "NETWORK_ERROR"
      ) {
        return { success: false, error: "Sin conexión a internet" };
      }
      if (error.status === 400) {
        return {
          success: false,
          error: "Solo se pueden anular PQRs pendientes",
        };
      }
      if (error.status === 403) {
        return { success: false, error: "Solo puedes anular tus propias PQRs" };
      }
      return { success: false, error: "Error al anular PQR" };
    }
  },
};
