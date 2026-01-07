export const COLORS = {
  primary: "#013973", // Azul principal oscuro
  secondary: "#0095ff", // Azul secundario brillante
  accent: "#0080e6", // Azul accent intermedio
  background: "#F8F9FA", // Fondo principal gris muy claro
  surface: "#FFFFFF", // Superficie de tarjetas y elementos
  surfaceLight: "#F3F4F6", // Cards y elementos con sombra sutil
  text: {
    primary: "#000000", // Texto principal negro
    secondary: "#6B7280", // Texto secundario (gris medio)
    muted: "#9CA3AF", // Texto deshabilitado
    inverse: "#FFFFFF", // Texto sobre fondos oscuros
    heading: "#0F172A", // Texto para títulos y encabezados
    disabled: "#D1D5DB", // Texto y elementos deshabilitados
    warningDark: "#92400E", // Texto sobre fondos de warning
    successDark: "#065F46", // Texto sobre fondos de success
  },
  border: "#E5E7EB", // Bordes y divisores
  input: {
    background: "#F9FAFB", // Fondo de inputs
    border: "#D1D5DB", // Borde de inputs
    focus: "#0095ff", // Borde de inputs en foco (azul brillante)
  },
  success: "#10B981", // Verde para mensajes de éxito
  successLight: "#ECFDF5", // Fondo claro para success
  warning: "#F59E0B", // Amarillo para advertencias
  warningLight: "#FFFBEB", // Fondo claro para warning
  error: "#EF4444", // Rojo para errores
  info: "#0095ff", // Azul brillante para información
  indigo: "#4F46E5", // Índigo/Morado para pqr
  purple: "#7C3AED", // Morado para PQR

  admin: "#4a7ba7", // color para administradores
  header: {
    title: "#1E293B", // Color de títulos en headers
  },
  modalOverlay: "rgba(0, 0, 0, 0.7)", // Fondo oscuro para modales

  // Colores para botones de contacto
  whatsapp: "#25D366", // Verde de WhatsApp
  phone: "#007bffff", // Azul de iOS para teléfono

  // Variaciones de los colores principales
  primaryLight: "#4a7ba7", // Primary más claro
  primaryDark: "#001f3f", // Primary más oscuro
  secondaryLight: "#66b3ff", // Secondary más claro
  secondaryDark: "#0066cc", // Secondary más oscuro
} as const;

export const THEME = {
  colors: COLORS,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
  },
} as const;
