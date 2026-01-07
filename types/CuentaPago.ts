export interface CuentaPago {
  id: number;
  nombre_banco: string;
  tipo_cuenta:
    | "ahorros"
    | "corriente"
    | "pasarela"
    | "fisico"
    | "billeteras_digitales";
  titular: string;
  numero_cuenta?: string;
  descripcion: string;
  enlace_pago?: string;
  informacion_adicional?: string;

  // Información del conjunto
  conjunto_nombre?: string;
  conjunto_nit?: string;
}
