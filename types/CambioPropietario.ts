import { Apartamento } from "./Apartamento";

export interface BuscarUsuarioResponse {
  existe: boolean;
  cedula: string;
  usuario?: {
    documento: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    estado: string;
  };
  apartamentos?: Apartamento[];
  total_apartamentos?: number;
}

export interface CrearUsuarioData {
  documento: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
}

export interface TransferirPropiedadData {
  apartamento_id: number;
  nuevo_propietario_documento: string;
}

export interface ApartamentoListado {
  id: number;
  codigo_apt: string;
  numero: string;
  bloque: string;
  coeficiente: number;
  propietario_nombre?: string | null;
}
