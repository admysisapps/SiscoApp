import { useCallback, useEffect, useRef, useState } from "react";
import { useRole } from "@/hooks/useRole";
import { fcmService } from "@/services/fcmService";
import { pqrService } from "@/services/pqrService";
import { EstadoPQR, PQR } from "@/types/Pqr";
import { eventBus, EVENTS } from "@/utils/eventBus";
import { Mensaje } from "@/components/pqr/PqrChatMessage";

interface UsePqrDetailReturn {
  pqr: PQR | null;
  loading: boolean;
  mensajes: Mensaje[];
  enviando: boolean;
  toast: {
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  };
  puedeResponder: boolean;
  recargarDetalle: () => Promise<void>;
  enviarMensaje: (texto: string) => Promise<void>;
  cambiarEstado: (nuevoEstado: EstadoPQR) => Promise<void>;
  anularPQR: () => Promise<void>;
  hideToast: () => void;
}

const ESTADOS_ACTIVOS: EstadoPQR[] = ["Pendiente", "En Proceso"];
const POLLING_INTERVAL = 5000;

export function usePqrDetail(pqrId: string | undefined): UsePqrDetailReturn {
  const { isAdmin, isContador } = useRole();
  const canManage = isAdmin || isContador;

  const [pqr, setPqr] = useState<PQR | null>(null);
  const [loading, setLoading] = useState(true);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });

  const ultimoIdRef = useRef<number>(0);

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" = "success"
  ) => setToast({ visible: true, message, type });

  const hideToast = () => setToast((prev) => ({ ...prev, visible: false }));

  const cargarMensajesInicial = useCallback(async () => {
    if (!pqrId) return;
    try {
      const response = await pqrService.obtenerMensajes(Number(pqrId));
      if (response.success && response.data.length > 0) {
        setMensajes(response.data);
        ultimoIdRef.current = response.data[response.data.length - 1].id;
      }
    } catch (error) {
      console.error("Error cargando mensajes:", error);
    }
  }, [pqrId]);

  const cargarMensajesNuevos = useCallback(async () => {
    if (!pqrId) return;
    try {
      const response = await pqrService.obtenerMensajes(
        Number(pqrId),
        ultimoIdRef.current > 0 ? ultimoIdRef.current : undefined
      );
      if (response.success && response.data.length > 0) {
        setMensajes((prev) => [...prev, ...response.data]);
        ultimoIdRef.current = response.data[response.data.length - 1].id;
      }
    } catch (error) {
      console.error("Error cargando mensajes nuevos:", error);
    }
  }, [pqrId]);

  const recargarDetalle = useCallback(async () => {
    if (!pqrId) return;
    try {
      setLoading(true);
      const response = await pqrService.obtenerPQRPorId(Number(pqrId));
      if (response.success) {
        setPqr(response.data);
      } else {
        showToast(response.error || "Error al cargar PQR", "error");
      }
    } catch {
      showToast("Error al cargar PQR", "error");
    } finally {
      setLoading(false);
    }
  }, [pqrId]);

  useEffect(() => {
    if (!pqrId) return;
    recargarDetalle();
    cargarMensajesInicial();
  }, [pqrId, recargarDetalle, cargarMensajesInicial]);

  useEffect(() => {
    if (!pqrId) return;
    const unsubscribe = fcmService.onMessage((notification) => {
      if (
        notification.data?.type === "pqr_mensaje" &&
        notification.data.pqr_id === pqrId
      ) {
        cargarMensajesNuevos();
      }
    });
    return () => unsubscribe();
  }, [pqrId, cargarMensajesNuevos]);

  const estadoPqr = pqr?.estado_pqr;

  useEffect(() => {
    if (!pqrId || !estadoPqr || !ESTADOS_ACTIVOS.includes(estadoPqr)) return;

    let interval: ReturnType<typeof setInterval>;

    const setupPolling = async () => {
      const notificationsEnabled = await fcmService.checkNotificationsEnabled();
      if (!notificationsEnabled) {
        interval = setInterval(cargarMensajesNuevos, POLLING_INTERVAL);
      }
    };

    setupPolling();
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [pqrId, estadoPqr, cargarMensajesNuevos]);

  const enviarMensaje = useCallback(
    async (texto: string) => {
      if (!texto.trim() || !pqrId) return;
      try {
        setEnviando(true);
        const estadoAnterior = pqr?.estado_pqr;
        const response = await pqrService.enviarMensaje(Number(pqrId), texto);

        if (response.success) {
          setMensajes((prev) => [...prev, response.data]);
          ultimoIdRef.current = response.data.id;

          if (canManage && estadoAnterior === "Pendiente") {
            setPqr((prev) =>
              prev ? { ...prev, estado_pqr: "En Proceso" } : null
            );
            eventBus.emit(EVENTS.PQR_UPDATED, {
              id: Number(pqrId),
              estado: "En Proceso",
            });
            showToast("PQR cambiada a 'En Proceso'", "success");
          }
        } else {
          if (response.error?.includes("estado: Resuelto")) {
            setPqr((prev) =>
              prev ? { ...prev, estado_pqr: "Resuelto" } : null
            );
          }
          showToast(response.error || "Error al enviar mensaje", "error");
        }
      } catch {
        showToast("Error al enviar mensaje", "error");
      } finally {
        setEnviando(false);
      }
    },
    [pqrId, pqr?.estado_pqr, canManage]
  );

  const cambiarEstado = useCallback(
    async (nuevoEstado: EstadoPQR) => {
      if (!pqr) return;
      try {
        const response = await pqrService.actualizarEstadoPQR(
          pqr.id_pqr,
          nuevoEstado
        );
        if (response.success) {
          setPqr((prev) =>
            prev ? { ...prev, estado_pqr: nuevoEstado } : null
          );
          eventBus.emit(EVENTS.PQR_UPDATED, {
            id: pqr.id_pqr,
            estado: nuevoEstado,
          });
          showToast(`Estado cambiado a ${nuevoEstado}`, "success");
        } else {
          showToast(response.error || "Error al cambiar estado", "error");
        }
      } catch {
        showToast("Error al cambiar estado", "error");
      }
    },
    [pqr]
  );

  const anularPQR = useCallback(async () => {
    if (!pqr) return;
    try {
      const response = await pqrService.anularPQR(pqr.id_pqr);
      if (response.success) {
        setPqr((prev) => (prev ? { ...prev, estado_pqr: "Anulado" } : null));
        eventBus.emit(EVENTS.PQR_UPDATED, {
          id: pqr.id_pqr,
          estado: "Anulado",
        });
        showToast(response.message || "PQR anulada exitosamente", "success");
      } else {
        showToast(response.error || "Error al anular PQR", "error");
      }
    } catch {
      showToast("Error al anular PQR", "error");
    }
  }, [pqr]);

  const puedeResponder = pqr ? ESTADOS_ACTIVOS.includes(pqr.estado_pqr) : false;

  return {
    pqr,
    loading,
    mensajes,
    enviando,
    toast,
    puedeResponder,
    recargarDetalle,
    enviarMensaje,
    cambiarEstado,
    anularPQR,
    hideToast,
  };
}
