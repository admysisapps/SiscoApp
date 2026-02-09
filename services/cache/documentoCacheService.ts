import { File, Directory, Paths } from "expo-file-system";
import * as FileSystem from "expo-file-system/legacy";
import * as IntentLauncher from "expo-intent-launcher";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

const getCacheDirectory = (proyectoNit: string) => {
  return new Directory(Paths.document, "documentos", proyectoNit);
};

const getCacheFile = (proyectoNit: string, nombreArchivo: string) => {
  return new File(Paths.document, "documentos", proyectoNit, nombreArchivo);
};

export const documentoCacheService = {
  // Verifica si el archivo existe localmente
  async existeLocal(
    proyectoNit: string,
    nombreArchivo: string
  ): Promise<boolean> {
    try {
      const file = getCacheFile(proyectoNit, nombreArchivo);
      return file.exists;
    } catch {
      return false;
    }
  },

  // Descarga y guarda el archivo
  async descargarYGuardar(
    proyectoNit: string,
    nombreArchivo: string,
    s3Url: string
  ): Promise<string> {
    try {
      const dir = getCacheDirectory(proyectoNit);
      dir.create({ intermediates: true, idempotent: true });

      const fileDestino = getCacheFile(proyectoNit, nombreArchivo);
      const file = await File.downloadFileAsync(s3Url, fileDestino, {
        idempotent: true,
      });

      return file.uri;
    } catch (error: any) {
      if (error.message?.includes("404")) {
        throw new Error(
          "Este documento ya no está disponible. Por favor, contacta al administrador."
        );
      }
      throw new Error(
        "No se pudo descargar el documento. Verifica tu conexión a internet."
      );
    }
  },

  // Abre el archivo (local o descarga primero)
  async abrirDocumento(
    proyectoNit: string,
    nombreArchivo: string,
    s3Url: string
  ): Promise<void> {
    try {
      const file = getCacheFile(proyectoNit, nombreArchivo);

      if (!file.exists) {
        await this.descargarYGuardar(proyectoNit, nombreArchivo, s3Url);
      }

      await this.abrirArchivoLocal(file.uri, nombreArchivo);
    } catch (error) {
      console.error("Error abriendo documento:", error);
      throw error;
    }
  },

  // Abre archivo local sin descargar
  async abrirDocumentoLocal(
    proyectoNit: string,
    nombreArchivo: string
  ): Promise<void> {
    try {
      const file = getCacheFile(proyectoNit, nombreArchivo);
      await this.abrirArchivoLocal(file.uri, nombreArchivo);
    } catch (error) {
      console.error("Error abriendo documento local:", error);
      throw error;
    }
  },

  // Método auxiliar para abrir archivo
  async abrirArchivoLocal(
    fileUri: string,
    nombreArchivo: string
  ): Promise<void> {
    if (Platform.OS === "android") {
      const contentUri = await FileSystem.getContentUriAsync(fileUri);
      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
        data: contentUri,
        flags: 1,
        type: this.getMimeType(nombreArchivo),
      });
    } else {
      await Sharing.shareAsync(fileUri, {
        UTI: this.getMimeType(nombreArchivo),
        mimeType: this.getMimeType(nombreArchivo),
      });
    }
  },

  // Obtiene el MIME type basado en la extensión
  getMimeType(nombreArchivo: string): string {
    const ext = nombreArchivo.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ppt: "application/vnd.ms-powerpoint",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      txt: "text/plain",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
    };
    return mimeTypes[ext || ""] || "application/octet-stream";
  },

  // Eliminar archivo local
  async eliminarLocal(
    proyectoNit: string,
    nombreArchivo: string
  ): Promise<void> {
    try {
      const file = getCacheFile(proyectoNit, nombreArchivo);
      if (file.exists) {
        file.delete();
      }
    } catch (error) {
      console.error("Error eliminando archivo local:", error);
    }
  },

  // Limpiar todos los archivos del proyecto
  async limpiarCache(proyectoNit: string): Promise<void> {
    try {
      const dir = getCacheDirectory(proyectoNit);
      if (dir.exists) {
        dir.delete();
      }
    } catch (error) {
      console.error("Error limpiando caché:", error);
    }
  },

  // Obtener tamaño del caché (en bytes)
  async obtenerTamañoCache(proyectoNit: string): Promise<number> {
    try {
      const dir = getCacheDirectory(proyectoNit);
      if (!dir.exists) return 0;

      const contents = dir.list();
      let totalSize = 0;

      for (const item of contents) {
        if (item instanceof File) {
          totalSize += item.size;
        }
      }

      return totalSize;
    } catch {
      return 0;
    }
  },
};
