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

  const loadCuentas = useCallback(
    async (forceRefresh = false, showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        setError(null);

        let serverVersion: string | null = null;

        if (!forceRefresh) {
          // Verificar versión del servidor
          const versionResponse =
            await cuentasPagoService.checkPaymentVersions();

          if (versionResponse.success && versionResponse.payments_version) {
            serverVersion = versionResponse.payments_version;
            const needsUpdate = await PaymentCache.needsUpdate(
              versionResponse.payments_version
            );

            if (!needsUpdate) {
              const cachedData = await PaymentCache.get();
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
            // payments_version: null = NO hay cuentas configuradas
            await PaymentCache.clear();
            setCuentas([]);
            if (showLoading) setLoading(false);
            return;
          }
        }

        // Cargar datos frescos del servidor
        const response = await cuentasPagoService.obtenerCuentasPago();

        if (response.success) {
          setCuentas(response.cuentas || []);

          // Guardar en cache solo si tenemos versión
          if (serverVersion) {
            await PaymentCache.save(response.cuentas, serverVersion);
          } else if (!forceRefresh) {
            // Solo hacer request si no tenemos la versión y no es forceRefresh
            const versionResponse =
              await cuentasPagoService.checkPaymentVersions();
            if (versionResponse.success && versionResponse.payments_version) {
              await PaymentCache.save(
                response.cuentas,
                versionResponse.payments_version
              );
            } else if (
              versionResponse.success &&
              versionResponse.payments_version === null
            ) {
              await PaymentCache.clear();
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
    // Intentar cargar cache primero para mostrar datos inmediatamente
    const cachedData = await PaymentCache.get();
    if (cachedData && cachedData.length > 0) {
      // Hay cache: abrir con datos SIN loading
      setCuentas(cachedData);
      setShowModal(true);
      // Actualizar en background sin mostrar loading
      loadCuentas(false, false).catch(() => {});
    } else {
      // No hay cache: mostrar loading del servidor
      setLoading(true);
      setShowModal(true);
      await loadCuentas(false, true);
    }
  }, [loadCuentas]);

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
