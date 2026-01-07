export type TipoPublicacion = "inmuebles" | "servicios" | "productos";

export type EstadoPublicacion =
  | "activa"
  | "pausada"
  | "finalizada"
  | "expirada"
  | "bloqueada";

export interface Publicacion {
  id: number;
  tipo: TipoPublicacion;
  titulo: string;
  descripcion: string;
  precio: number;
  negociable: boolean;
  contacto: string;
  fecha_creacion: string;
  fecha_expiracion: string;
  estado: EstadoPublicacion;
  usuario_documento: string;
  archivos_nombres: string[] | null;
  // Información del usuario (desde JOIN)
  usuario?: {
    nombre: string;
    apellido: string;
    documento: string;
  };
  // Campos de moderación
  moderada_por?: string;
  fecha_moderacion?: string;
  razon_bloqueo?: string;
}

export interface CreatePublicacionRequest {
  tipo: TipoPublicacion;
  titulo: string;
  descripcion: string;
  precio: number;
  negociable: boolean;
  contacto: string;
  fecha_expiracion: string;
  archivos_nombres?: string[];
}
