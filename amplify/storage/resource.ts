import { defineStorage } from "@aws-amplify/backend";

export const storage = defineStorage({
  name: "siscoAppDocuments",
  access: (allow) => ({
    // Estructura multi-tenant por NIT del proyecto
    // Cada NIT tiene su propia carpeta raíz

    // Documentos de asambleas por NIT
    "public/{proyecto_nit}/asambleas/{asamblea_id}/documentos/*": [
      allow.authenticated.to(["read", "write", "delete"]),
    ],

    // Documentos generales por NIT
    "public/{proyecto_nit}/documentos/*": [
      allow.authenticated.to(["read", "write", "delete"]),
    ],

    // PQRs por NIT (con ID específico)
    "public/{proyecto_nit}/pqrs/{pqr_id}/*": [
      allow.authenticated.to(["read", "write", "delete"]),
    ],

    // PQRs por NIT (acceso general)
    "public/{proyecto_nit}/pqrs/*": [
      allow.authenticated.to(["read", "write", "delete"]),
    ],

    // Espacios comunes por NIT
    "public/{proyecto_nit}/espacios/*": [
      allow.authenticated.to(["read", "write", "delete"]),
    ],
  }),
});
