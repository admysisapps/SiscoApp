import { useQuery } from "@tanstack/react-query";
import { apiService } from "@/services/apiService";
import { CuentaCobro } from "@/types/cuentaCobro";

const SW_URL =
  "https://ykhlian2yj.execute-api.us-east-1.amazonaws.com/TESTAPI/getdatasw";

// TODO: reemplazar con selectedProject.nit, selectedApartment.codigo_apt y año dinámico
const MOCK_NIT = "777777777";
const MOCK_CODIGO = "1";
const MOCK_YEAR = "2026";

export function useCuentaCobro(): {
  cuentaCobro: CuentaCobro | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { data, isLoading, error } = useQuery({
    queryKey: ["cuenta-cobro", MOCK_NIT, MOCK_CODIGO, MOCK_YEAR],
    queryFn: async (): Promise<CuentaCobro> => {
      const token = await apiService.getAuthToken();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(SW_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          nit: MOCK_NIT,
          codigo: MOCK_CODIGO,
          year: MOCK_YEAR,
          c_cobr: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status} al cargar cuenta de cobro`);
      }

      const json: CuentaCobro = await response.json();

      if (!json.unidad || json.tipo !== "Cuenta de Cobro") {
        throw new Error("Respuesta inválida del servidor");
      }

      return json;
    },
    staleTime: 5 * 60 * 1000,
  });

  return { cuentaCobro: data ?? null, isLoading, error: error as Error | null };
}
