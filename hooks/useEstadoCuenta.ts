import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/apiService";
import { CuentaCobro } from "@/types/cuentaCobro";

const SW_URL =
  "https://ykhlian2yj.execute-api.us-east-1.amazonaws.com/TESTAPI/getdatasw";

const MOCK_NIT = "777777777";
const MOCK_CODIGO = "1";

async function fetchEstadoCuenta(
  nit: string,
  codigo: string,
  year: string,
  token: string | null
): Promise<CuentaCobro> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(SW_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({ nit, codigo, year, c_cobr: false }),
  });

  if (!response.ok)
    throw new Error(`Error ${response.status} al cargar estado de cuenta`);

  const json: CuentaCobro = await response.json();
  if (!json.unidad || json.tipo !== "Estado de Cuenta")
    throw new Error("Respuesta inválida del servidor");

  return json;
}

const CURRENT_YEAR = new Date().getFullYear().toString();
const PREV_YEAR = (new Date().getFullYear() - 1).toString();

export function useEstadoCuenta(): {
  estadoCuenta: CuentaCobro | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: ["estado-cuenta", MOCK_NIT, MOCK_CODIGO, CURRENT_YEAR],
    queryFn: async (): Promise<CuentaCobro> => {
      const token = await apiService.getAuthToken();
      return fetchEstadoCuenta(MOCK_NIT, MOCK_CODIGO, CURRENT_YEAR, token);
    },
    staleTime: 5 * 60 * 1000,
  });

  return {
    estadoCuenta: data ?? null,
    isLoading,
    error: error as Error | null,
  };
}

export function useEstadoCuentaAnioAnterior(): {
  estadoCuenta: CuentaCobro | null;
  isLoading: boolean;
  error: Error | null;
  fetch: () => void;
} {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["estado-cuenta", MOCK_NIT, MOCK_CODIGO, PREV_YEAR],
    queryFn: async (): Promise<CuentaCobro> => {
      const token = await apiService.getAuthToken();
      return fetchEstadoCuenta(MOCK_NIT, MOCK_CODIGO, PREV_YEAR, token);
    },
    staleTime: 5 * 60 * 1000,
    enabled: false,
  });

  return {
    estadoCuenta: data ?? null,
    isLoading,
    error: error as Error | null,
    fetch: refetch,
  };
}
