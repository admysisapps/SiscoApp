//Tipos de contexto por módulos - Organizados semánticamente

export const CONTEXT_TYPES = {
  // Sin contexto
  NONE: "NONE", // Sin contexto de usuario
  FULL: "FULL", // Contexto completo (incluye email)

  // Módulo Usuario
  USER_BASIC: ["documento"], // Solo documento del usuario
  USER_JOIN_PROJECT: ["documento", "email"], // Para unirse a proyecto (documento + email)
  USER_UPDATE: ["documento", "proyecto_nit", "copropiedad"], // Actualizar perfil con validación
  USER_INFO: ["documento", "proyecto_nit", "copropiedad"], // Información completa del usuario

  // Módulo Apartamentos
  APARTMENTS: ["documento", "copropiedad"], // Apartamentos del propietario

  // Módulo PQR - Contextos específicos por operación
  PQR_LIST: [
    "documento",
    "rol",
    "apartamento_codigo",
    "proyecto_nit",
    "copropiedad",
  ],

  // Lista filtrada de PQRs
  PQR_CREATE: [
    "documento",
    "apartamento_codigo",
    "proyecto_nit",
    "rol",
    "copropiedad",
  ],

  // Operaciones administrativas

  PQR_ADMIN: ["documento", "rol", "proyecto_nit", "copropiedad"],

  PQR_DETAIL: [
    "documento",
    "rol",
    "apartamento_codigo",
    "proyecto_nit",
    "copropiedad",
  ],

  // Detalle con validación de acceso
  PQR_MESSAGES: [
    "documento",
    "rol",
    "apartamento_codigo",
    "proyecto_nit",
    "copropiedad",
  ],

  // Mensajes con validación completa

  // Módulo Asambleas - Contexto completo por ahora
  ASSEMBLY_FULL: "FULL", // Contexto completo para asambleas (temporal)

  // Módulo Poderes - Contexto completo por ahora
  POWERS_FULL: "FULL", // Contexto completo para poderes (temporal)

  // Módulo Proyectos - Sin contexto
  PROJECTS_NONE: "NONE", // Sin contexto para proyectos

  // Módulo Espacios Comunes - Contextos específicos por operación
  SPACES_ADMIN_CREATE: ["documento", "rol", "copropiedad"], // Crear espacio (solo admin)

  SPACES_ADMIN_EDIT: ["documento", "rol", "copropiedad"], // Editar espacio (solo admin)

  SPACES_LIST: ["documento", "copropiedad"], // Listar espacios (todos los usuarios)

  SPACES_DETAIL: ["documento", "copropiedad"], // Detalle de espacio (todos los usuarios)

  // Módulo Reservas
  RESERVATIONS_VALIDATE: ["documento", "copropiedad"], // Validar disponibilidad

  RESERVAS_CREATE: ["documento", "rol", "copropiedad", "apartamento_codigo"], // Crear reserva (propietarios)

  RESERVAS_LIST: ["documento", "rol", "copropiedad", "apartamento_codigo"], // Listar reservas (filtrado por rol)

  // Gestión admin de reservas
  RESERVAS_CANCEL: [
    "documento",
    "rol",
    "copropiedad",
    "apartamento_codigo",
    "proyecto_nit",
  ],

  // Cancelar reservas
  RESERVAS_ADMIN: ["documento", "rol", "copropiedad", "proyecto_nit"],

  // Detalle de la reserva
  RESERVAS_DETAIL: [
    "documento",
    "rol",
    "copropiedad",
    "apartamento_codigo",
    "proyecto_nit",
  ],

  // Módulo Métodos de Pago
  PAYMENT_METHODS_ADMIN: ["documento", "rol", "copropiedad"], // Crear método de pago (solo admin)
  PAYMENT_METHODS_LIST: ["documento", "copropiedad"], // Listar métodos de pago
  PAYMENT_METHODS_VERSION: ["copropiedad"],

  // Módulo Propietarios
  PROPIETARIOS_ADMIN: ["documento", "rol", "copropiedad"],

  // Operaciones administrativas de propietarios
  PROPIETARIOS_ADMIN_TRANSFER: [
    "copropiedad",
    "documento",
    "rol",
    "proyecto_nit",
  ],

  //avisos
  AVISOS: ["documento", "copropiedad"],

  // Módulo Publicaciones
  PUBLICACIONES_CREATE: ["documento", "copropiedad"], // Crear publicación (todos los usuarios)

  PUBLICACIONES_UPDATE_STATE: ["documento", "copropiedad", "proyecto_nit"], // Cambiar estado de publicación (propietario)

  PUBLICACIONES_LIST: ["documento", "copropiedad"], // Listar publicaciones

  PUBLICACIONES_UPDATE_STATE_ADMIN: [
    "documento",
    "copropiedad",
    "proyecto_nit",
    "rol",
  ],

  //cambio de correo(falta agregarlo a auth)
  CHANGE_EMAIL: ["copropiedad", "documento", "proyecto_nit"],

  //asiatencia
  VALIDATE_ATTENDANCE: ["documento", "copropiedad", "proyecto_nit"],

  //asambleas
  GET_ASSEMBLY: ["documento", "copropiedad", "proyecto_nit"], // Listar y consultar asambleas
  ASSEMBLY_CREATE: ["documento", "rol", "copropiedad", "proyecto_nit"], // Crear asamblea (admin)
  ASSEMBLY_UPDATE: ["documento", "rol", "copropiedad", "proyecto_nit"], // Cambiar estado (admin)
  ASSEMBLY_QUORUM: ["documento", "copropiedad", "proyecto_nit"], // Consultar quórum
  ASSEMBLY_REPORT: ["documento", "rol", "copropiedad", "proyecto_nit"], // Generar reportes (admin)

  //poderes
  GENERATE_POWER: ["documento", "rol", "proyecto_nit", "copropiedad"],
  DELETE_POWER: ["documento", "copropiedad", "proyecto_nit"],

  //votaciones
  VOTACIONES_CREATE: ["documento", "rol", "proyecto_nit", "copropiedad"],
  VOTACIONES_LIST: ["copropiedad"],

  ACTIVE_QUESTION: ["documento", "copropiedad"],
  MANAGEMENT_QUESTIONS: ["proyecto_nit", "copropiedad", "rol"],

  //eliminar cuenta
  DELETE_ACCOUNT: ["documento", "proyecto_nit", "copropiedad"],

  //documentos
  DOCUMENTOS_CREATE: ["documento", "rol", "copropiedad"],
  DOCUMENTOS_LIST: ["copropiedad", "rol"],
  DOCUMENTOS_DELETE: ["documento", "rol", "copropiedad", "proyecto_nit"],
  DOCUMENTOS_UPDATE_VISIBILITY: ["documento", "rol", "copropiedad"],
};
