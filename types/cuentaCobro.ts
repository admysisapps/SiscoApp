export interface DetalleConcepto {
  descrip: string;
  cuota: number;
  anticipos: number;
}

export interface Movimiento {
  periodo: string;
  saldo_ini_deuda: number;
  saldo_ini_ant: number;
  detalle: DetalleConcepto[];
}

export interface ParametrosDescuento {
  fecha_desc: string;
  porcentaje_desc: number;
}

export interface CuentaCobro {
  unidad: number;
  tipo: string;
  param: ParametrosDescuento;
  movimientos: Movimiento[];
  saldo_con_desc: number;
  saldo_sin_desc: number;
}
