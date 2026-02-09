import { apiService } from "./apiService";
import { s3ServiceDocumentos } from "./s3ServiceDocumentos";
import {
  SubirDocumentoResult,
  ListarDocumentosResult,
  ObtenerUrlResult,
} from "@/types/Documento";

export const documentoService = {
  // Sube documento completo (S3 + DB)
  async subirDocumento(
    proyectoNit: string,
    file: { uri: string; name: string; type?: string }
  ): Promise<SubirDocumentoResult> {
    try {
      // 1. Subir archivo a S3
      const s3Result = await s3ServiceDocumentos.uploadDocumento(
        proyectoNit,
        file
      );

      if (
        !s3Result.success ||
        !s3Result.fileName ||
        !s3Result.originalName ||
        !s3Result.fileSize
      ) {
        return {
          success: false,
          error: s3Result.error || "Error al subir archivo",
        };
      }

      // 2. Guardar metadata en DB via Lambda
      const dbResult = await apiService.makeRequestWithContextType(
        "/documentos/subir",
        {
          nombre_archivo: s3Result.fileName,
          nombre_original: s3Result.originalName,
          tamaño: s3Result.fileSize,
        },
        "DOCUMENTOS_CREATE"
      );

      if (!dbResult.success) {
        // TODO: Considerar eliminar archivo de S3 si falla DB
        return {
          success: false,
          error: dbResult.error || "Error al guardar",
        };
      }

      return {
        success: true,
        documento: {
          nombre_archivo: s3Result.fileName,
          nombre_original: s3Result.originalName,
          tamaño: s3Result.fileSize,
        },
      };
    } catch (error) {
      console.error("Error subiendo documento:", error);
      return {
        success: false,
        error: "Error al subir documento",
      };
    }
  },

  // Obtiene URL de descarga de un documento
  async obtenerUrlDocumento(
    proyectoNit: string,
    nombreArchivo: string
  ): Promise<ObtenerUrlResult> {
    try {
      const result = await s3ServiceDocumentos.getDocumentoUrl(
        proyectoNit,
        nombreArchivo
      );

      if (!result.success || !result.url) {
        return {
          success: false,
          error: result.error || "Error al obtener URL del documento",
        };
      }

      return {
        success: true,
        url: result.url,
      };
    } catch (error) {
      console.error("Error obteniendo URL de documento:", error);
      return {
        success: false,
        error: "Error al obtener URL del documento",
      };
    }
  },

  // Lista todos los documentos del proyecto
  async listarDocumentos(): Promise<ListarDocumentosResult> {
    try {
      const result = await apiService.makeRequestWithContextType(
        "/documentos/listar",
        {},
        "DOCUMENTOS_LIST"
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error || "Error al listar documentos",
        };
      }

      return {
        success: true,
        documentos: result.documentos || [],
      };
    } catch (error) {
      console.error("Error listando documentos:", error);
      return {
        success: false,
        error: "Error al listar documentos",
      };
    }
  },

  // Elimina un documento (DB + S3 + caché local)
  async eliminarDocumento(
    proyectoNit: string,
    documentoId: string,
    nombreArchivo: string,
    nombreOriginal: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await apiService.makeRequestWithContextType(
        "/documentos/eliminar",
        {
          documento_id: documentoId,
          nombre_archivo: nombreArchivo,
        },
        "DOCUMENTOS_DELETE"
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error || "Error al eliminar documento",
        };
      }

      const { documentoCacheService } =
        await import("./cache/documentoCacheService");
      await documentoCacheService.eliminarLocal(proyectoNit, nombreOriginal);

      return { success: true };
    } catch (error) {
      console.error("Error eliminando documento:", error);
      return {
        success: false,
        error: "Error al eliminar documento",
      };
    }
  },
};
