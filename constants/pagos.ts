// constants/pagos.ts
import { Ionicons } from "@expo/vector-icons";

type IoniconsName = keyof typeof Ionicons.glyphMap;

type TipoCuenta = {
  value:
    | "ahorros"
    | "corriente"
    | "billeteras_digitales"
    | "pasarela"
    | "fisico";
  label: string;
  icon: IoniconsName;
};

export const TIPOS_CUENTA: readonly TipoCuenta[] = [
  { value: "ahorros", label: "Ahorros", icon: "card" },
  { value: "corriente", label: "Corriente", icon: "card" },
  {
    value: "billeteras_digitales",
    label: "Billeteras Digitales",
    icon: "phone-portrait",
  },
  {
    value: "pasarela",
    label: "Pasarela de Pago",
    icon: "wallet",
  },
  { value: "fisico", label: "Pago Físico", icon: "storefront" },
];

export const TIPOS_CON_NUMERO = [
  "ahorros",
  "corriente",
  "billeteras_digitales",
] as const;

type TipoConNumero = (typeof TIPOS_CON_NUMERO)[number];

export const requiereNumeroCuenta = (tipo: string): tipo is TipoConNumero => {
  return TIPOS_CON_NUMERO.includes(tipo as TipoConNumero);
};

const TIPOS_MAP = {
  ahorros: "Cuenta de Ahorros",
  corriente: "Cuenta Corriente",
  billeteras_digitales: "Billetera Digital",
  pasarela: "Pasarela de Pago",
  fisico: "Pago en Efectivo",
} as const;

export const getTipoNombre = (tipo: string): string => {
  return TIPOS_MAP[tipo as keyof typeof TIPOS_MAP] || tipo;
};

export const handleOpenPaymentLink = (
  url: string,
  onError?: (message: string) => void
) => {
  if (!url) return;

  import("@/utils/linkingHelper").then(({ openURL }) => {
    openURL(url, onError);
  });
};

export const getTypeIcon = (tipo: string): IoniconsName => {
  switch (tipo) {
    case "ahorros":
    case "corriente":
      return "card";
    case "billeteras_digitales":
      return "phone-portrait";
    case "pasarela":
      return "wallet";
    case "fisico":
      return "storefront";
    default:
      return "card-outline";
  }
};

export const truncateUrl = (url: string, maxLength: number = 30): string => {
  if (!url || url.length <= maxLength) return url;

  // Remover protocolo para mostrar
  const cleanUrl = url.replace(/^https?:\/\//, "");

  if (cleanUrl.length <= maxLength) return cleanUrl;

  return cleanUrl.substring(0, maxLength - 3) + "...";
};
