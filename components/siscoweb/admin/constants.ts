import { THEME } from "@/constants/theme";

export interface DatoCopropiedad {
  id: string;
  nombre: string;
  tipo: string;
  valor: number;
  cambio: number;
  periodo: string;
  color: string;
}

export const DATOS_COPROPIEDAD: DatoCopropiedad[] = [
  {
    id: "1",
    nombre: "Activo Total",
    tipo: "Balance",
    valor: 272286239.69,
    cambio: 5.2,
    periodo: "Noviembre 2025",
    color: THEME.colors.success,
  },
  {
    id: "2",
    nombre: "Pasivo Total",
    tipo: "Balance",
    valor: 55196879,
    cambio: -2.1,
    periodo: "Noviembre 2025",
    color: THEME.colors.error,
  },
  {
    id: "3",
    nombre: "Patrimonio Total",
    tipo: "Balance",
    valor: 217089360.69,
    cambio: 8.7,
    periodo: "Noviembre 2025",
    color: THEME.colors.primary,
  },
];
