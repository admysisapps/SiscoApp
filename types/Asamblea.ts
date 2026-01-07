export interface Asamblea {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: string;
  hora: string;
  lugar: string;
  modalidad: "presencial" | "virtual" | "mixta";
  enlace_virtual?: string;
  estado: "programada" | "en_curso" | "finalizada" | "cancelada";
  tipo_asamblea: "ordinaria" | "extraordinaria";
  quorum_requerido: number;
  quorum_alcanzado: number;
  proyecto_id: string;
  creador_id: number;
  fecha_creacion: string;
  fecha_actualizacion: string;
  archivos_nombres?: {
    nombre: string;
    nombreS3: string;
    tamaño: string;
  }[];
}
