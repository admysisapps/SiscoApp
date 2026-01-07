export interface Aviso {
  id: number;
  tipo:
    | "advertencia"
    | "recordatorio"
    | "pago"
    | "general"
    | "mantenimiento"
    | "emergencia";
  titulo: string;
  descripcion: string;
  fecha_creacion: string;
  fecha_evento?: string | null; // Opcional y puede ser null
  push: boolean; // Cambió de push_enviado a push
  prioridad: "baja" | "media" | "alta" | "urgente";
  archivos_nombres?: string; // Para archivos adjuntos
}

// Tipo para crear avisos (sin id y campos auto-generados)
export interface CreateAvisoRequest {
  tipo:
    | "advertencia"
    | "recordatorio"
    | "pago"
    | "general"
    | "mantenimiento"
    | "emergencia";
  titulo: string;
  descripcion: string;
  fecha_evento?: string | null;
  push?: boolean; // Opcional, default TRUE para notificar
  prioridad: "baja" | "media" | "alta" | "urgente";
}

// Tipo para actualizar avisos
export interface UpdateAvisoRequest {
  tipo?:
    | "advertencia"
    | "recordatorio"
    | "pago"
    | "general"
    | "mantenimiento"
    | "emergencia";
  titulo?: string;
  descripcion?: string;
  fecha_evento?: string | null;
  push?: boolean; // Para activar/desactivar notificaciones
  prioridad?: "baja" | "media" | "alta" | "urgente";
}
