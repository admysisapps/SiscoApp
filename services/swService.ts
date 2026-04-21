import { CuentaCobro } from "@/types/cuentaCobro";
import { swApiService } from "./swApiService";

export const swService = {
  async getEstadoCuenta(year: string): Promise<CuentaCobro> {
    try {
      return await swApiService.getDataSW(year, false);
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error("Tiempo de espera agotado al cargar estado de cuenta");
      }
      if (error.message?.includes("Network request failed")) {
        throw new Error("Sin conexión a internet");
      }
      throw error;
    }
  },

  async getCuentaCobro(year: string): Promise<CuentaCobro> {
    try {
      return await swApiService.getDataSW(year, true);
    } catch (error: any) {
      if (error.name === "AbortError") {
        throw new Error("Tiempo de espera agotado al cargar cuenta de cobro");
      }
      if (error.message?.includes("Network request failed")) {
        throw new Error("Sin conexión a internet");
      }
      throw error;
    }
  },
};
