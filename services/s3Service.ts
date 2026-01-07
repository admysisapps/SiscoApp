import { uploadData, getUrl, remove } from "aws-amplify/storage";

//  CACHE SIMPLE - Evita regenerar URLs firmadas
const urlCache = new Map<string, { url: string; expires: number }>();

export const s3Service = {
  async uploadPQRFile(
    proyectoNit: string,
    file: { uri: string; name: string; type?: string }
  ) {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const key = `${proyectoNit}/pqrs/${fileName}`;

      const response = await fetch(file.uri);
      const blob = await response.blob();

      const result = await uploadData({
        path: key,
        data: blob,
        options: {
          contentType: file.type || "application/octet-stream",
        },
      }).result;

      // URL se genera al momento de la descarga

      return {
        success: true,
        key: result.path, // Path completo para guardar en BD
        fileName: fileName, // Nombre con timestamp para BD
        originalName: file.name, // Nombre original
        fileSize: blob.size,
        s3Path: result.path, // Path completo para descarga
      };
    } catch (error) {
      console.error(" Error subiendo archivo:", error);
      return {
        success: false,
        error: "Error al subir archivo",
      };
    }
  },

  async getFileUrl(key: string) {
    try {
      const result = await getUrl({
        path: key,
        options: {
          expiresIn: 3600,
          validateObjectExistence: false,
        },
      });
      return result.url.toString();
    } catch (error) {
      console.error(" Error obteniendo URL:", error);
      throw error;
    }
  },

  async downloadPQRFile(proyectoNit: string, fileName: string) {
    try {
      // Construir la ruta igual que en la subida
      const key = `${proyectoNit}/pqrs/${fileName}`;

      const url = await this.getFileUrl(key);

      return {
        success: true,
        url,
        fileName,
      };
    } catch (error) {
      console.error(" Error descargando archivo:", error);
      return {
        success: false,
        error: "Error al obtener archivo",
      };
    }
  },

  //Obtiene URL de imagen de espacio común CON CACHE

  async getEspacioImageUrl(proyectoNit: string, imageName: string) {
    try {
      const cacheKey = `${proyectoNit}_${imageName}`;

      // Verificar si existe en cache y no ha expirado
      const cached = urlCache.get(cacheKey);
      if (cached && Date.now() < cached.expires) {
        return {
          success: true,
          url: cached.url,
          imageName,
        };
      }

      // No está en cache o expiró, generar nueva URL
      const key = `${proyectoNit}/espacios/${imageName}`;
      const url = await this.getFileUrl(key);

      // Guardar en cache por 5 horas
      urlCache.set(cacheKey, {
        url,
        expires: Date.now() + 5 * 60 * 60 * 1000,
      });

      return {
        success: true,
        url,
        imageName,
      };
    } catch (error) {
      console.error(" Error obteniendo URL de imagen:", error);
      return {
        success: false,
        error: "Error al obtener imagen",
      };
    }
  },

  //Sube imagen de zona común

  async uploadEspacioImage(
    proyectoNit: string,
    file: { uri: string; name: string; type?: string },
    customFileName?: string
  ) {
    try {
      const fileName = customFileName || `${Date.now()}_${file.name}`;
      const key = `${proyectoNit}/espacios/${fileName}`;

      const response = await fetch(file.uri);
      const blob = await response.blob();

      const result = await uploadData({
        path: key,
        data: blob,
        options: {
          contentType: file.type || "image/jpeg",
        },
      }).result;

      // Limpiar cache si es actualización de imagen existente
      if (customFileName) {
        const cacheKey = `${proyectoNit}_${customFileName}`;
        urlCache.delete(cacheKey);
      }

      return {
        success: true,
        key: result.path,
        fileName: file.name,
        fileSize: blob.size,
        s3Path: result.path,
      };
    } catch (error) {
      console.error(" Error subiendo imagen:", error);
      return {
        success: false,
        error: "Error al subir imagen",
      };
    }
  },

  //Elimina imagen de zona común

  async deleteEspacioImage(proyectoNit: string, imageName: string) {
    try {
      const key = `${proyectoNit}/espacios/${imageName}`;
      await remove({ path: key });

      return {
        success: true,
        message: "Imagen eliminada",
      };
    } catch (error) {
      console.error("Error eliminando imagen:", error);
      return {
        success: false,
        error: "Error al eliminar imagen",
      };
    }
  },

  // COMUNICADOS - Múltiples archivos
  async uploadAvisoFiles(
    proyectoNit: string,
    files: { uri: string; name: string; type?: string }[]
  ) {
    try {
      const fileNames: string[] = [];

      for (const file of files) {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const key = `${proyectoNit}/comunicados/${fileName}`;

        const response = await fetch(file.uri);
        const blob = await response.blob();

        await uploadData({
          path: key,
          data: blob,
          options: {
            contentType: file.type || "application/octet-stream",
          },
        }).result;

        fileNames.push(fileName);
      }

      return {
        success: true,
        fileNames, // Array para BD como JSON
      };
    } catch (error) {
      console.error("Error subiendo archivos de comunicado:", error);
      return {
        success: false,
        error: "Error al subir archivos",
      };
    }
  },

  async getAvisoFileUrl(proyectoNit: string, fileName: string) {
    try {
      const key = `${proyectoNit}/comunicados/${fileName}`;
      const url = await this.getFileUrl(key);
      return {
        success: true,
        url,
        fileName,
      };
    } catch {
      return {
        success: false,
        error: "Error al obtener archivo",
      };
    }
  },

  // PUBLICACIONES - Múltiples imágenes (máximo 5)
  async uploadPublicacionFiles(
    proyectoNit: string,
    tipoPublicacion: "inmuebles" | "productos" | "servicios",
    files: { uri: string; name: string; type?: string }[]
  ) {
    try {
      if (files.length > 5) {
        return {
          success: false,
          error: "Máximo 5 imágenes por publicación",
        };
      }

      const fileNames: string[] = [];

      for (const file of files) {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const key = `${proyectoNit}/publicaciones/${tipoPublicacion}/${fileName}`;

        const response = await fetch(file.uri);
        const blob = await response.blob();

        await uploadData({
          path: key,
          data: blob,
          options: {
            contentType: file.type || "image/jpeg",
          },
        }).result;

        fileNames.push(fileName);
      }

      return {
        success: true,
        fileNames, // Array para BD como JSON
      };
    } catch (error) {
      console.error("Error subiendo imágenes de publicación:", error);
      return {
        success: false,
        error: "Error al subir imágenes",
      };
    }
  },

  // Obtiene URL de imagen de publicación CON CACHE

  async getPublicacionImageUrl(
    proyectoNit: string,
    tipoPublicacion: "inmuebles" | "productos" | "servicios",
    imageName: string
  ) {
    try {
      const cacheKey = `pub_${proyectoNit}_${tipoPublicacion}_${imageName}`;

      // Verificar si existe en cache y no ha expirado
      const cached = urlCache.get(cacheKey);
      if (cached && Date.now() < cached.expires) {
        return {
          success: true,
          url: cached.url,
          imageName,
        };
      }

      // No está en cache o expiró, generar nueva URL
      const key = `${proyectoNit}/publicaciones/${tipoPublicacion}/${imageName}`;
      const url = await this.getFileUrl(key);

      // Guardar en cache por 5 horas
      urlCache.set(cacheKey, {
        url,
        expires: Date.now() + 5 * 60 * 60 * 1000,
      });

      return {
        success: true,
        url,
        imageName,
      };
    } catch (error) {
      console.error("Error obteniendo URL de imagen de publicación:", error);
      return {
        success: false,
        error: "Error al obtener imagen",
      };
    }
  },

  //Elimina imágenes de publicación

  async deletePublicacionImages(
    proyectoNit: string,
    tipoPublicacion: "inmuebles" | "productos" | "servicios",
    imageNames: string[]
  ) {
    try {
      for (const imageName of imageNames) {
        const key = `${proyectoNit}/publicaciones/${tipoPublicacion}/${imageName}`;
        await remove({ path: key });

        // Limpiar cache
        const cacheKey = `pub_${proyectoNit}_${tipoPublicacion}_${imageName}`;
        urlCache.delete(cacheKey);
      }

      return {
        success: true,
        message: "Imágenes eliminadas ",
      };
    } catch (error) {
      console.error("Error eliminando imágenes de publicación:", error);
      return {
        success: false,
        error: "Error al eliminar la imagen ",
      };
    }
  },

  // ASAMBLEAS - Múltiples archivos (documentos, imágenes, presentaciones, etc.)
  async uploadAsambleaFiles(
    proyectoNit: string,
    files: { uri: string; name: string; type?: string }[]
  ) {
    try {
      const fileNames: string[] = [];

      for (const file of files) {
        const timestamp = Date.now();
        const fileName = `${timestamp}_${file.name}`;
        const key = `${proyectoNit}/asambleas/${fileName}`;

        const response = await fetch(file.uri);
        const blob = await response.blob();

        await uploadData({
          path: key,
          data: blob,
          options: {
            contentType: file.type || "application/octet-stream",
          },
        }).result;

        fileNames.push(fileName);
      }

      return {
        success: true,
        fileNames, // Array para BD como JSON
      };
    } catch (error) {
      console.error("Error subiendo archivos de asamblea:", error);
      return {
        success: false,
        error: "Error al subir archivos",
      };
    }
  },

  async getAsambleaFileUrl(proyectoNit: string, fileName: string) {
    try {
      const key = `${proyectoNit}/asambleas/${fileName}`;
      const url = await this.getFileUrl(key);
      return {
        success: true,
        url,
        fileName,
      };
    } catch {
      return {
        success: false,
        error: "Error al obtener archivo",
      };
    }
  },

  async deleteAsambleaFile(proyectoNit: string, fileName: string) {
    try {
      const key = `${proyectoNit}/asambleas/${fileName}`;
      await remove({ path: key });

      return {
        success: true,
        message: "Archivo eliminado",
      };
    } catch (error) {
      console.error("Error eliminando archivo de asamblea:", error);
      return {
        success: false,
        error: "Error al eliminar archivo",
      };
    }
  },
};
