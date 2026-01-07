export interface ValidacionAsistenciaResponse {
  apartamentos: Apartamento[];
  coeficiente_total: number;
}

export interface Apartamento {
  id: number;
  codigo: string;
  coeficiente: number;
  tipo: "propietario" | "apoderado";
}

export interface RegistroAsistenciaResponse {
  documento_participante: string;
  coeficiente_total: number;
  apartamentos_count: number;
  apartamentos_numeros: string[];
}

export interface RegistroAsistenciaRequest {
  asamblea_id: number;
  apartamentos_ids: number[];
}

export interface QuorumInfo {
  quorum_actual: number;
  quorum_requerido: number;
  alcanzado: boolean;
}
