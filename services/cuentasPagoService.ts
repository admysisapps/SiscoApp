import { apiService } from "./apiService";
import { CuentaPago } from "@/types/CuentaPago";

export const cuentasPagoService = {
  async crearCuentaPago(cuentaData: Omit<CuentaPago, "id">) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/metodos-pago/crear",
        cuentaData,
        "PAYMENT_METHODS_ADMIN"
      );

      if (!response.success && response.error) {
        return { success: false, error: response.error };
      }

      return response;
    } catch (error: any) {
      return {
        success: false,
        error:
          error?.response?.data?.error ||
          error?.message ||
          "Error al crear método de pago",
      };
    }
  },

  async obtenerCuentasPago() {
    try {
      return await apiService.makeRequestWithContextType(
        "/metodos-pago/listar",
        {},
        "PAYMENT_METHODS_LIST"
      );
    } catch {
      return { success: false, error: "Error al obtener métodos de pago" };
    }
  },

  async editarCuentaPago(cuentaId: number, cuentaData: Partial<CuentaPago>) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/metodos-pago/editar",
        { cuenta_id: cuentaId, ...cuentaData },
        "PAYMENT_METHODS_ADMIN"
      );

      if (!response.success && response.error) {
        return { success: false, error: response.error };
      }

      return response;
    } catch (error: any) {
      return {
        success: false,
        error:
          error?.response?.data?.error ||
          error?.message ||
          "Error al editar método de pago",
      };
    }
  },

  async eliminarCuentaPago(cuentaId: number) {
    try {
      return await apiService.makeRequestWithContextType(
        "/metodos-pago/eliminar",
        { cuenta_id: cuentaId },
        "PAYMENT_METHODS_ADMIN"
      );
    } catch {
      return { success: false, error: "Error al eliminar método de pago" };
    }
  },

  async checkPaymentVersions() {
    try {
      return await apiService.makeRequestWithContextType(
        "/metodos-pago/version",
        {},
        "PAYMENT_METHODS_VERSION"
      );
    } catch {
      return { success: false, error: "Error al verificar versiones" };
    }
  },
};
