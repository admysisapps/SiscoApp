export type TipoPeticion = "Petición" | "Queja" | "Reclamo";

export type EstadoPQR = "Pendiente" | "En Proceso" | "Resuelto" | "Anulado";

export interface PQR {
  id_pqr: number;
  id_apartamento: number;
  documento_creador: string;
  tipo_peticion: TipoPeticion;
  estado_pqr: EstadoPQR;
  asunto: string;
  descripcion: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  archivo_s3_key?: string;
  archivo_nombre?: string;
  // Datos relacionados (para mostrar en UI)
  apartamento?: {
    codigo_apt: string;
    numero: string;
    bloque: string;
  };
  creador?: {
    nombre: string;
    apellido: string;
  };
}

export interface CreatePQRRequest {
  tipo_peticion: TipoPeticion;
  asunto: string;
  descripcion: string;
}

export interface UpdatePQRRequest {
  estado_pqr?: EstadoPQR;
  asunto?: string;
  descripcion?: string;
}
