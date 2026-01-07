// constants/pagos.ts
import { Ionicons } from "@expo/vector-icons";

type IoniconsName = keyof typeof Ionicons.glyphMap;

export const TIPOS_CUENTA = [
  { value: "ahorros", label: "Ahorros", icon: "card" as IoniconsName },
  { value: "corriente", label: "Corriente", icon: "card" as IoniconsName },
  {
    value: "billeteras_digitales",
    label: "Billeteras Digitales",
    icon: "phone-portrait" as IoniconsName,
  },
  {
    value: "pasarela",
    label: "Pasarela de Pago",
    icon: "wallet" as IoniconsName,
  },
  { value: "fisico", label: "Pago Físico", icon: "storefront" as IoniconsName },
] as const;

export const TIPOS_CON_NUMERO = [
  "ahorros",
  "corriente",
  "billeteras_digitales",
] as const;

export const getTipoNombre = (tipo: string): string => {
  const tipos = {
    ahorros: "Cuenta de Ahorros",
    corriente: "Cuenta Corriente",
    billeteras_digitales: "Billetera Digital",
    pasarela: "Pasarela de Pago",
    fisico: "Pago en Efectivo",
  };
  return tipos[tipo as keyof typeof tipos] || tipo;
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
