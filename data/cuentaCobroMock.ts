import { CuentaCobro } from "@/types/cuentaCobro";

// Cuenta par - inmueble con deuda y descuento activo
export const mockCuentaCobro1: CuentaCobro = {
  unidad: 102,
  tipo: "Cuenta de Cobro",
  param: {
    fecha_desc: "2026-03-30",
    porcentaje_desc: 10.0,
  },
  movimientos: [
    {
      periodo: "03-2026",
      saldo_ini_deuda: 450000.0,
      saldo_ini_ant: -50000.0,
      detalle: [
        {
          descrip: "CUOTA DE ADMINISTRACION",
          cuota: 280000.0,
          anticipos: -30000.0,
        },
        {
          descrip: "PARQUEADERO CARRO (P-45)",
          cuota: 110000.0,
          anticipos: 0,
        },
        {
          descrip: "SERVICIO DE CASILLERO",
          cuota: 15000.0,
          anticipos: 0,
        },
        {
          descrip: "MULTA CONVIVENCIA (RUIDO)",
          cuota: 140000.0,
          anticipos: 0,
        },
        {
          descrip: "FONDO DE IMPREVISTOS",
          cuota: 3000.0,
          anticipos: 0,
        },
      ],
    },
  ],
  saldo_sin_desc: 1000500,
  saldo_con_desc: 972500,
};

// Cuenta impar - inmueble al día sin deuda
export const mockCuentaCobro2: CuentaCobro = {
  unidad: 201,
  tipo: "Cuenta de Cobro",
  param: {
    fecha_desc: "2026-03-15",
    porcentaje_desc: 5.0,
  },
  movimientos: [
    {
      periodo: "03-2026",
      saldo_ini_deuda: 0,
      saldo_ini_ant: 0,
      detalle: [
        { descrip: "CUOTA DE ADMINISTRACION", cuota: 320000.0, anticipos: 0 },
        { descrip: "PARQUEADERO MOTO (M-12)", cuota: 45000.0, anticipos: 0 },
        { descrip: "FONDO DE IMPREVISTOS", cuota: 5000.0, anticipos: 0 },
      ],
    },
  ],
  saldo_sin_desc: 370000,
  saldo_con_desc: 351500,
};
