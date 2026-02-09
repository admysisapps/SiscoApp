import { uploadData, getUrl } from "aws-amplify/storage";

// Cache para URLs firmadas de documentos
const urlCache = new Map<string, { url: string; expires: number }>();

export const s3ServiceDocumentos = {
  // Sube un documento al bucket S3
  async uploadDocumento(
    proyectoNit: string,
    file: { uri: string; name: string; type?: string }
  ) {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const key = `${proyectoNit}/documentos/${fileName}`;

      const response = await fetch(file.uri);
      const blob = await response.blob();

      const result = await uploadData({
        path: key,
        data: blob,
        options: {
          contentType: file.type || "application/octet-stream",
        },
      }).result;

      return {
        success: true,
        fileName: fileName,
        originalName: file.name,
        fileSize: blob.size,
        s3Path: result.path,
      };
    } catch (error) {
      console.error("Error subiendo documento:", error);
      return {
        success: false,
        error: "Error al subir documento",
      };
    }
  },

  // Obtiene URL firmada de un documento CON CACHE
  async getDocumentoUrl(proyectoNit: string, fileName: string) {
    try {
      const cacheKey = `doc_${proyectoNit}_${fileName}`;

      // Verificar cache
      const cached = urlCache.get(cacheKey);
      if (cached && Date.now() < cached.expires) {
        return {
          success: true,
          url: cached.url,
          fileName,
        };
      }

      // Generar nueva URL
      const key = `${proyectoNit}/documentos/${fileName}`;
      const result = await getUrl({
        path: key,
        options: {
          expiresIn: 3600,
          validateObjectExistence: false,
        },
      });

      const url = result.url.toString();

      // Guardar en cache por 50 minutos
      urlCache.set(cacheKey, {
        url,
        expires: Date.now() + 50 * 60 * 1000,
      });

      return {
        success: true,
        url,
        fileName,
      };
    } catch (error) {
      console.error("Error obteniendo URL de documento:", error);
      return {
        success: false,
        error: "Error al obtener documento",
      };
    }
  },
};
