export interface DetalleConcepto {
  descrip: string;
  cuota: number | string;
  "pagos/ajustes": number | string;
  saldo: string;
  descuento?: number | string;
}

export interface Movimiento {
  periodo: string;
  detalle: DetalleConcepto[];
}

export interface CuentaCobro {
  unidad: number;
  tipo: "Cuenta de Cobro" | "Estado de Cuenta";
  param: {
    fecha_desc?: string;
    porcentaje_desc?: string;
  };
  saldo_inicial: string;
  movimientos: Movimiento[];
}
