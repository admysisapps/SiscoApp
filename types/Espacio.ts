// Interfaces para horarios
export interface HorarioSemanal {
  activo: boolean;
  hora_inicio: string;
  hora_fin: string;
  precio_especial: string;
}

export interface HorarioAPI {
  dia_semana: number;
  activo: boolean;
  hora_inicio: string;
  hora_fin: string;
  precio_especial?: number | null;
}

// Interface para el espacio en la API
export interface EspacioAPI {
  nombre?: string;
  descripcion?: string;
  reglas?: string;
  capacidad_maxima?: number;
  costo?: number;
  tiempo_minimo_reserva?: number;
  tiempo_maximo_reserva?: number;
  duracion_bloque?: number;
  tiempo_reserva?: number;
  estado?: "activa" | "inactiva" | "mantenimiento";
  tipo_reserva?: "por_minutos" | "por_horas" | "bloque_fijo" | "gratuito";
  requiere_aprobacion?: boolean;
  fecha_mantenimiento?: string;
  horarios?: HorarioAPI[];
  imagen_nombre?: string;
}

// Interface para imagen seleccionada
export interface ImagenSeleccionada {
  name: string;
  uri?: string;
  mimeType?: string;
  size?: number;
  uploaded: boolean;
  existing?: boolean;
}

// Type para mapeo de horarios semanales
export type HorariosSemanalesMap = {
  [key: number]: HorarioSemanal;
};

// Types para estados y configuración
export type EstadoEspacio = "activa" | "inactiva" | "mantenimiento";
export type TipoReserva =
  | "por_minutos"
  | "por_horas"
  | "bloque_fijo"
  | "gratuito";

// Interface para datos del formulario
export interface FormDataEspacio {
  nombre: string;
  descripcion: string;
  reglas: string;
  capacidad_maxima: string;
  costo: string;
  hora_inicio: string;
  hora_fin: string;
  tiempo_minimo_reserva: string;
  tiempo_maximo_reserva: string;
  duracion_bloque: string;
  tiempo_reserva: string;
}

// Interface para configuración del espacio
export interface ConfiguracionEspacio {
  estado: EstadoEspacio;
  tipo_reserva: TipoReserva;
  requiere_aprobacion: boolean;
  fecha_mantenimiento: string;
}
