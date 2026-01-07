export interface Proyecto {
  NIT: string;
  Nombre: string;
  descripcion?: string;
  rol_usuario: string;
  estado: "activo" | "inactivo";
  poderes_habilitados: boolean;
  max_apoderados_propietario: number;
  max_apoderados_admin: number;
  permiso_admin_apoderados: boolean;
  copropiedad: string;
  codigo?: string;
}
