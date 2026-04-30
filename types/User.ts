import { UserRole } from "./Roles";

export interface User {
  usuario?: string; // Cédula del usuario (legacy)
  documento: string; // Cédula del usuario (nuevo)

  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  rol: UserRole;
}
