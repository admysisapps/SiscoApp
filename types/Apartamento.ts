export interface Apartamento {
  id: number;
  codigo_apt: string; // "A101", "B202" - Para consultas
  numero: string; // "101", "202"
  bloque: string; // "A", "B"
  coeficiente: string; // "0.025000"
  propietario_documento: string;
}
