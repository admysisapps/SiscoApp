export interface Proyecto {
  nit: string;
  nombre: string;
  descripcion?: string;
  rolUsuario: string;
  estado: "activo" | "inactivo";
  poderesHabilitados: boolean;
  maxApoderadosPropietario: number;
  maxApoderadosAdmin: number;
  permisoAdminApoderados: boolean;
  copropiedad: string;
  codigo?: string;
}
