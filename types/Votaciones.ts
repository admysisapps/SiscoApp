export type EstadoVotacion =
  | "programada"
  | "en_curso"
  | "finalizada"
  | "cancelada";
export type TipoPregunta = "si_no" | "multiple";

export interface Votacion {
  id: number;
  asamblea_id: number;
  titulo: string;
  descripcion?: string;
  estado: EstadoVotacion;
  fecha_inicio?: string;
  fecha_fin?: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  preguntas?: {
    id: number;
    pregunta: string;
    tipo_pregunta: string;
    orden: number;
    estado: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    fecha_creacion: string;
    opciones: {
      id: number;
      opcion: string;
      fecha_creacion: string;
    }[];
  }[];
}

export interface PreguntaVotacion {
  id: number;
  votacion_id: number;
  pregunta: string;
  tipo_pregunta: TipoPregunta;
  orden: number;
  estado: EstadoVotacion;
  fecha_inicio?: string;
  fecha_fin?: string;
  fecha_creacion: string;
  opciones?: OpcionRespuesta[];
}

export interface OpcionRespuesta {
  id: number;
  pregunta_id: number;
  opcion: string;
  fecha_creacion: string;
}

export type PreguntaFormData = Omit<Partial<PreguntaVotacion>, "opciones"> & {
  opciones?: string[];
};

export interface Voto {
  id: number;
  pregunta_id: number;
  opcion_id: number;
  documento_participante: string;
  coeficiente_usado: number;
  fecha_registro: string;
}

export interface ResultadoVotacion {
  id: number;
  pregunta_id: number;
  opcion_id: number;
  total_votos: number;
  total_coeficiente: number;
  fecha_actualizacion: string;
}

// Tipos para asamblea activa
export interface RegistroAsambleaData {
  coeficiente_total: number;
  apartamentos_count: number;
  apartamentos_numeros: string[];
  observer_mode?: boolean;
}

export interface PreguntaActiva {
  id: number;
  pregunta: string;
  tipo_pregunta: TipoPregunta;
  estado: EstadoVotacion;
  orden: number;
  fecha_inicio: string;
  votacion_id: number;
  segundos_restantes: number;
  votacion_titulo: string;
  ya_voto: boolean;
  opciones: {
    id: number;
    opcion: string;
  }[];
}

// Tipo para la respuesta del API
export interface ResultadoPreguntaAPI {
  pregunta_id: number;
  pregunta_texto: string;
  resultados: {
    id: number | null;
    opcion_id: number | null;
    opcion_texto: string;
    total_votos: number;
    total_coeficiente: string | number;
    es_abstencion?: boolean;
  }[];
}

// Tipo para el componente (datos transformados)
export interface ResultadoPregunta {
  pregunta_id: number;
  pregunta_texto: string;
  resultados: ResultadoOpcion[];
}

// Helper para transformar datos del API al formato del componente
export const transformarResultadosAPI = (
  apiData: ResultadoPreguntaAPI[]
): ResultadoPregunta[] => {
  return apiData.map((pregunta) => ({
    pregunta_id: pregunta.pregunta_id,
    pregunta_texto: pregunta.pregunta_texto,
    resultados: pregunta.resultados.map((r) => ({
      id: r.id || `abs-${pregunta.pregunta_id}`,
      opcion_id: r.opcion_id || 0,
      opcion_texto: r.opcion_texto,
      total_votos: r.total_votos,
      total_coeficiente:
        typeof r.total_coeficiente === "string"
          ? parseFloat(r.total_coeficiente)
          : r.total_coeficiente,
    })),
  }));
};

export interface ToastState {
  visible: boolean;
  message: string;
  type: "success" | "error" | "warning";
}

// Tipo para el componente ResultadosVotacion
export interface ResultadoOpcion {
  id: number | string;
  opcion_id: number;
  opcion_texto: string;
  total_votos: number;
  total_coeficiente: number;
}
