export const ROLES = {
  ADMIN: "admin",
  PROPIETARIO: "propietario",
  CONTADOR: "contador",
} as const;

export type UserRole = (typeof ROLES)[keyof typeof ROLES];
// = "admin" | "propietario" | "contador"
