// Tipos para el módulo de Reservas/Espacios Comunes

export interface HorarioEspacio {
  dia_semana: number; // 1-7 (1=lunes, 7=domingo)
  hora_inicio: string; // "06:00"
  hora_fin: string; // "22:00"
  activo: boolean;
  precio_especial?: number;
}

export interface EspacioComun {
  id: number;
  nombre: string;
  descripcion: string;
  reglas: string;
  estado: "activa" | "inactiva";
  tipo_reserva: "gratuito" | "por_minutos" | "bloque_fijo";
  costo: number;
  capacidad_maxima: number;
  tiempo_minimo_reserva: number; // minutos
  tiempo_maximo_reserva: number; // minutos
  tiempo_reserva: number; // horas de antelación
  requiere_aprobacion: boolean;
  imagen_nombre?: string;
  horarios: HorarioEspacio[];
  fecha_creacion: string;
  fecha_actualizacion: string;
  duracion_bloque?: number; // minutos
}

export interface Reserva {
  id: number;
  espacio_id: number;
  usuario_documento: string;
  usuario_nombre: string;
  apartamento_codigo: string;
  fecha_reserva: string; // "2024-01-15"
  hora_inicio: string; // "14:00"
  hora_fin: string; // "16:00"
  estado: EstadoReserva;
  motivo?: string;
  observaciones?: string;
  precio_total?: number;

  created_at: string;
  updated_at: string;

  // Relaciones
  espacio?: EspacioComun;
}

export type EstadoReserva =
  | "Pendiente" // Esperando aprobación
  | "Confirmada" // Aprobada y activa
  | "Cancelada" // Cancelada por el usuario
  | "Rechazada"; // Rechazada por admin; //

export type EstadoReservaIcon =
  | "checkmark-circle"
  | "time"
  | "close-circle"
  | "ban"
  | "help-circle";

export type TiempoReserva = number; // horas de antelación requerida

export type TipoReserva = "gratuito" | "por_minutos" | "bloque_fijo";

export type EstadoEspacio = "activa" | "inactiva";

export interface CrearReservaData {
  espacio_id: number;
  fecha_reserva: string;
  hora_inicio: string;
  hora_fin: string;
  motivo?: string;
  observaciones?: string;
}

export interface FiltrosReserva {
  estado?: EstadoReserva;
  fecha_desde?: string;
  fecha_hasta?: string;
  espacio_id?: number;
}

// Para el calendario de disponibilidad
export interface DisponibilidadEspacio {
  fecha: string;
  horarios_ocupados: {
    hora_inicio: string;
    hora_fin: string;
    reserva_id: number;
  }[];
  horarios_disponibles: {
    hora_inicio: string;
    hora_fin: string;
  }[];
}
