import { apiService } from "./apiService";

export const asambleaService = {
  // SERVICIOS DE ASAMBLEAS

  // Obtiene todas las asambleas de un proyecto

  async getAsambleas(proyectoId: string) {
    try {
      return await apiService.makeRequestWithContextType(
        "/asambleas/listar",
        {
          proyecto_id: proyectoId,
        },
        "GET_ASSEMBLY"
      );
    } catch (error) {
      console.error("Error obteniendo asambleas:", error);
      throw error;
    }
  },

  // Obtiene detalles de una asamblea específica

  async getAsamblea(asambleaId: number) {
    try {
      return await apiService.makeRequestWithContextType(
        "/asambleas/detalle",
        {
          asamblea_id: asambleaId,
        },
        "GET_ASSEMBLY"
      );
    } catch (error) {
      console.error("Error obteniendo detalles de asamblea:", error);
      throw error;
    }
  },

  // Crea una nueva asamblea

  async crearAsamblea(asambleaData: any) {
    try {
      return await apiService.makeRequestWithContextType(
        "/asambleas/crear",
        {
          asamblea_data: asambleaData,
        },
        "ASSEMBLY_CREATE"
      );
    } catch (error) {
      console.error("Error creando asamblea:", error);
      throw error;
    }
  },

  //Cambia el estado de una asamblea

  async cambiarEstadoAsamblea(asambleaId: number, nuevoEstado: string) {
    try {
      return await apiService.makeRequestWithContextType(
        "/asambleas/cambiar-estado",
        {
          asamblea_id: asambleaId,
          nuevo_estado: nuevoEstado,
        },
        "ASSEMBLY_UPDATE"
      );
    } catch (error) {
      console.error("Error cambiando estado de asamblea:", error);
      throw error;
    }
  },

  // Guarda archivos de asamblea en BD

  async guardarArchivosAsamblea(
    asambleaId: number,
    archivos: { nombre: string; nombreS3: string; tamaño: string }[]
  ) {
    try {
      return await apiService.makeRequestWithContextType(
        "/asambleas/guardar-archivos",
        {
          asamblea_id: asambleaId,
          archivos: archivos,
        },
        "ASSEMBLY_UPDATE"
      );
    } catch (error) {
      console.error("Error guardando archivos de asamblea:", error);
      throw error;
    }
  },

  // Elimina un archivo de asamblea (BD + S3)

  async eliminarArchivoAsamblea(asambleaId: number, nombreS3: string) {
    try {
      return await apiService.makeRequestWithContextType(
        "/asambleas/eliminar-archivo",
        {
          asamblea_id: asambleaId,
          nombre_s3: nombreS3,
        },
        "ASSEMBLY_UPDATE"
      );
    } catch (error) {
      console.error("Error eliminando archivo de asamblea:", error);
      throw error;
    }
  },

  // Genera reporte de asistencia para asamblea finalizada

  async generarReporteAsistencia(asambleaId: number) {
    try {
      return await apiService.makeRequestWithContextType(
        "/asambleas/reportes/asistencia",
        {
          asamblea_id: asambleaId,
        },
        "ASSEMBLY_REPORT"
      );
    } catch (error) {
      console.error("Error generando reporte de asistencia:", error);
      throw error;
    }
  },
};
