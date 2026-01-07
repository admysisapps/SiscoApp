// hooks/usePaymentMethods.ts
import { useState, useCallback } from "react";
import { CuentaPago } from "@/types/CuentaPago";
import { cuentasPagoService } from "@/services/cuentasPagoService";
import { PaymentCache } from "@/utils/paymentCache";

export const usePaymentMethods = () => {
  const [showModal, setShowModal] = useState(false);
  const [cuentas, setCuentas] = useState<CuentaPago[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCuentas = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      let versionResponse: any = null;

      if (!forceRefresh) {
        // Verificar versión del servidor
        versionResponse = await cuentasPagoService.checkPaymentVersions();

        if (versionResponse.success && versionResponse.payments_version) {
          const needsUpdate = await PaymentCache.needsUpdate(
            versionResponse.payments_version
          );

          if (!needsUpdate) {
            // Usar cache
            const cachedData = await PaymentCache.get();
            if (cachedData) {
              setCuentas(cachedData);
              setLoading(false);
              return;
            }
          }
        }
      }

      // Cargar datos frescos
      const response = await cuentasPagoService.obtenerCuentasPago();

      if (response.success) {
        setCuentas(response.cuentas || []);

        // Guardar en cache con versión (reutilizar la respuesta anterior si existe)
        if (!versionResponse) {
          versionResponse = await cuentasPagoService.checkPaymentVersions();
        }

        if (versionResponse.success && versionResponse.payments_version) {
          await PaymentCache.save(
            response.cuentas,
            versionResponse.payments_version
          );
        }
      } else {
        setError(
          response.error ||
            "Error al cargar informacion de metodos pagos de pago"
        );
      }
    } catch {
      setError("Error de conexión al cargar informacion metodos de pago");
    } finally {
      setLoading(false);
    }
  }, []);

  const openPaymentMethods = useCallback(() => {
    setShowModal(true);
    if (cuentas.length === 0) loadCuentas();
  }, [cuentas.length, loadCuentas]);

  const closePaymentMethods = useCallback(() => setShowModal(false), []);

  // Removido useEffect que cargaba cuentas automáticamente
  // Las cuentas se cargan solo cuando el usuario abre el modal

  return {
    showModal,
    openPaymentMethods,
    closePaymentMethods,
    cuentas,
    loading,
    error,
    refreshCuentas: loadCuentas,
  };
};
