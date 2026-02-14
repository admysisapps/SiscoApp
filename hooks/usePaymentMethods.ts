// hooks/usePaymentMethods.ts
import { useState, useCallback } from "react";
import { CuentaPago } from "@/types/CuentaPago";
import { cuentasPagoService } from "@/services/cuentasPagoService";
import { PaymentCache } from "@/utils/paymentCache";
import { apiService } from "@/services/apiService";

export const usePaymentMethods = () => {
  const [showModal, setShowModal] = useState(false);
  const [cuentas, setCuentas] = useState<CuentaPago[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCuentas = useCallback(
    async (forceRefresh = false, showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        setError(null);

        const context = await apiService.getUserContext();
        const copropiedad = context?.copropiedad;

        if (!copropiedad) {
          setError("No se pudo obtener el contexto del proyecto");
          if (showLoading) setLoading(false);
          return;
        }

        let serverVersion: string | null = null;

        if (!forceRefresh) {
          const versionResponse =
            await cuentasPagoService.checkPaymentVersions();

          if (versionResponse.success && versionResponse.payments_version) {
            serverVersion = versionResponse.payments_version;
            const needsUpdate = await PaymentCache.needsUpdate(
              versionResponse.payments_version,
              copropiedad
            );

            if (!needsUpdate) {
              const cachedData = await PaymentCache.get(copropiedad);
              if (cachedData) {
                setCuentas(cachedData);
                if (showLoading) setLoading(false);
                return;
              }
            }
          } else if (
            versionResponse.success &&
            versionResponse.payments_version === null
          ) {
            await PaymentCache.clear(copropiedad);
            setCuentas([]);
            if (showLoading) setLoading(false);
            return;
          }
        }

        const response = await cuentasPagoService.obtenerCuentasPago();

        if (response.success) {
          setCuentas(response.cuentas || []);

          if (serverVersion) {
            await PaymentCache.save(
              response.cuentas,
              serverVersion,
              copropiedad
            );
          } else if (!forceRefresh) {
            const versionResponse =
              await cuentasPagoService.checkPaymentVersions();
            if (versionResponse.success && versionResponse.payments_version) {
              await PaymentCache.save(
                response.cuentas,
                versionResponse.payments_version,
                copropiedad
              );
            } else if (
              versionResponse.success &&
              versionResponse.payments_version === null
            ) {
              await PaymentCache.clear(copropiedad);
            }
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
        if (showLoading) setLoading(false);
      }
    },
    []
  );

  const openPaymentMethods = useCallback(async () => {
    const context = await apiService.getUserContext();
    const copropiedad = context?.copropiedad;

    if (!copropiedad) {
      setError("No se pudo obtener el contexto del proyecto");
      setShowModal(true);
      return;
    }

    const cachedData = await PaymentCache.get(copropiedad);
    if (cachedData && cachedData.length > 0) {
      setCuentas(cachedData);
      setShowModal(true);
      loadCuentas(false, false).catch(() => {});
    } else {
      setLoading(true);
      setShowModal(true);
      await loadCuentas(false, true);
    }
  }, [loadCuentas]);

  const closePaymentMethods = useCallback(() => setShowModal(false), []);

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
