// Documento desde la base de datos
export interface DocumentoDB {
  id: number;
  nombre_archivo: string;
  nombre_original: string;
  tamaño: number;
  fecha_creacion: string;
}

// Documento para la UI
export interface Documento {
  id: string;
  nombre: string;
  tipo: string;
  tamaño: string;
  fecha: string;
  categoria: string;
  nombre_archivo?: string;
  enCache?: boolean;
}

// Resultado de subir documento
export interface SubirDocumentoResult {
  success: boolean;
  documento?: {
    nombre_archivo: string;
    nombre_original: string;
    tamaño: number;
  };
  error?: string;
}

// Resultado de listar documentos
export interface ListarDocumentosResult {
  success: boolean;
  documentos?: DocumentoDB[];
  error?: string;
}

// Resultado de obtener URL
export interface ObtenerUrlResult {
  success: boolean;
  url?: string;
  error?: string;
}
