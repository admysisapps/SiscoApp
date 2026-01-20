export interface Apoderado {
  id: number;
  nombre: string;
  cedula: string;
  correo: string;
  telefono?: string;
  asamblea_id: number;
  proyecto_NIT: string;
  usuario_id: string;
  apartamentos: string; // "101, 102, 103"
  codigo_expiracion: string;
  codigo_usado: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface ApoderadoLoginData {
  correo: string;
  cedula: string;
  codigo_otp: string;
  codigo_copropiedad: string;
}

export interface ApoderadoSession {
  apoderado_id: number;
  nombre: string;
  documento: string;
  correo: string;
  apartamentos: string[];
  proyecto_nombre: string;
  proyecto_nit: string;
  copropiedad: string;
  puede_reingresar: boolean;
  asamblea: {
    id: number;
    titulo: string;
    descripcion: string;
    fecha: string;
    hora: string;
    lugar: string;
    modalidad: "presencial" | "virtual" | "mixta";
    enlace_virtual: string;
    estado: "programada" | "en_curso" | "finalizada" | "cancelada";
    tipo_asamblea: "ordinaria" | "extraordinaria";
    quorum_requerido: number;
    quorum_alcanzado: number;
  };
}

export interface ApoderadoFormData {
  nombre: string;
  cedula: string;
  correo: string;
  telefono?: string;
  apartamentos?: string;
}

export interface ApoderadoFormErrors {
  nombre?: string;
  cedula?: string;
  correo?: string;
  telefono?: string;
  apartamentos?: string;
}
