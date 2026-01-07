export interface User {
  usuario?: string; // Cédula del usuario (legacy)
  documento: string; // Cédula del usuario (nuevo)

  nombre: string;
  apellido: string;
  email: string; // Cambiar correo por email
  telefono: string;
  rol: "admin" | "propietario"; // Rol del usuario
}
