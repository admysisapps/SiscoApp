import { CuentaCobro } from "@/types/cuentaCobro";
import { apiService } from "./apiService";

const SW_URL =
  "https://ykhlian2yj.execute-api.us-east-1.amazonaws.com/TESTAPI/getdatasw";

export const swApiService = {
  async getDataSW(year: string, cCobr: boolean): Promise<CuentaCobro> {
    const context = await apiService.getUserContext();
    const token = await apiService.getAuthToken();

    const nit: string = context?.proyecto_nit ?? null;
    const codigo: string = context?.apartamento_codigo ?? null;

    if (!nit || !codigo) {
      throw new Error("Contexto de proyecto o apartamento no disponible");
    }

    if (__DEV__) {
      console.log("[swApiService]", { nit, codigo, year, cCobr });
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) headers.Authorization = `Bearer ${token}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(SW_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ nit, codigo, year, c_cobr: cCobr }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status} al consultar datos SW`);
      }

      const json: CuentaCobro = await response.json();

      const tipoEsperado = cCobr ? "Cuenta de Cobro" : "Estado de Cuenta";
      if (!json.unidad || json.tipo !== tipoEsperado) {
        throw new Error("Respuesta inválida del servidor SW");
      }

      return json;
    } finally {
      clearTimeout(timeoutId);
    }
  },
};
