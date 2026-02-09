export interface Documento {
  id: string;
  nombre: string;
  tipo: string;
  tamaño: string;
  fecha: string;
  categoria: string;
}

export const DOCUMENTOS_MOCK: Documento[] = [
  {
    id: "1",
    nombre: "Reglamento de Copropiedad 2024.pdf",
    tipo: "PDF",
    tamaño: "2.4 MB",
    fecha: "15/01/2024",
    categoria: "Legal",
  },
  {
    id: "2",
    nombre: "Acta Asamblea Ordinaria Marzo.pdf",
    tipo: "PDF",
    tamaño: "1.8 MB",
    fecha: "20/03/2024",
    categoria: "Actas",
  },
  {
    id: "3",
    nombre: "Presupuesto Anual 2024.xlsx",
    tipo: "XLSX",
    tamaño: "856 KB",
    fecha: "10/01/2024",
    categoria: "Financiero",
  },
  {
    id: "4",
    nombre: "Póliza de Seguro Todo Riesgo.pdf",
    tipo: "PDF",
    tamaño: "3.2 MB",
    fecha: "05/02/2024",
    categoria: "Seguros",
  },
  {
    id: "5",
    nombre: "Certificado Bomberos 2024.pdf",
    tipo: "PDF",
    tamaño: "1.1 MB",
    fecha: "12/02/2024",
    categoria: "Certificados",
  },
  {
    id: "6",
    nombre: "Contrato Vigilancia.pdf",
    tipo: "PDF",
    tamaño: "980 KB",
    fecha: "01/01/2024",
    categoria: "Contratos",
  },
  {
    id: "7",
    nombre: "Balance General Noviembre.pdf",
    tipo: "PDF",
    tamaño: "1.5 MB",
    fecha: "11/12/2024",
    categoria: "Financiero",
  },
  {
    id: "8",
    nombre: "Manual de Convivencia.pdf",
    tipo: "PDF",
    tamaño: "2.1 MB",
    fecha: "15/01/2024",
    categoria: "Legal",
  },
];

export const CATEGORIAS = [
  "Todos",
  "Legal",
  "Actas",
  "Financiero",
  "Seguros",
  "Certificados",
  "Contratos",
];
