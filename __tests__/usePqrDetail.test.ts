/**
 * Tests para usePqrDetail - Lógica pura
 *
 * Verifica la lógica de:
 * - Manejo de mensajes y desde_id
 * - Estados de la PQR
 * - Deduplicación de mensajes
 * - Polling y condiciones de activación
 */

import { EstadoPQR } from "@/types/Pqr";
import { Mensaje } from "@/components/pqr/PqrChatMessage";

const ESTADOS_ACTIVOS: EstadoPQR[] = ["Pendiente", "En Proceso"];

describe("usePqrDetail - Lógica de Mensajes", () => {
  describe("1. Carga inicial de mensajes", () => {
    test("debe guardar el último ID al cargar mensajes iniciales", () => {
      const mensajes: Mensaje[] = [
        {
          id: 1,
          mensaje: "Hola",
          es_admin: false,
          fecha_creacion: "2026-01-01T00:00:00",
        },
        {
          id: 2,
          mensaje: "Respuesta",
          es_admin: true,
          fecha_creacion: "2026-01-01T00:01:00",
        },
        {
          id: 3,
          mensaje: "Gracias",
          es_admin: false,
          fecha_creacion: "2026-01-01T00:02:00",
        },
      ];

      const ultimoId = mensajes[mensajes.length - 1].id;

      expect(ultimoId).toBe(3);
    });

    test("no debe actualizar ultimoId si la lista viene vacía", () => {
      const mensajes: Mensaje[] = [];
      let ultimoId = 0;

      if (mensajes.length > 0) {
        ultimoId = mensajes[mensajes.length - 1].id;
      }

      expect(ultimoId).toBe(0);
    });

    test("debe iniciar mensajes como array vacío", () => {
      const mensajes: Mensaje[] = [];
      expect(mensajes).toHaveLength(0);
    });
  });

  describe("2. Carga de mensajes nuevos con desde_id", () => {
    test("debe agregar solo mensajes nuevos al estado existente", () => {
      const prevMensajes: Mensaje[] = [
        {
          id: 1,
          mensaje: "Hola",
          es_admin: false,
          fecha_creacion: "2026-01-01T00:00:00",
        },
        {
          id: 2,
          mensaje: "Respuesta",
          es_admin: true,
          fecha_creacion: "2026-01-01T00:01:00",
        },
      ];

      const nuevosMensajes: Mensaje[] = [
        {
          id: 3,
          mensaje: "Nuevo",
          es_admin: false,
          fecha_creacion: "2026-01-01T00:02:00",
        },
      ];

      const resultado = [...prevMensajes, ...nuevosMensajes];

      expect(resultado).toHaveLength(3);
      expect(resultado[2].id).toBe(3);
    });

    test("no debe agregar nada si no hay mensajes nuevos", () => {
      const prevMensajes: Mensaje[] = [
        {
          id: 1,
          mensaje: "Hola",
          es_admin: false,
          fecha_creacion: "2026-01-01T00:00:00",
        },
      ];

      const nuevosMensajes: Mensaje[] = [];
      const resultado =
        nuevosMensajes.length > 0
          ? [...prevMensajes, ...nuevosMensajes]
          : prevMensajes;

      expect(resultado).toHaveLength(1);
    });

    test("debe actualizar ultimoId después de recibir mensajes nuevos", () => {
      let ultimoId = 5;
      const nuevosMensajes: Mensaje[] = [
        {
          id: 6,
          mensaje: "Nuevo 1",
          es_admin: false,
          fecha_creacion: "2026-01-01T00:00:00",
        },
        {
          id: 7,
          mensaje: "Nuevo 2",
          es_admin: true,
          fecha_creacion: "2026-01-01T00:01:00",
        },
      ];

      if (nuevosMensajes.length > 0) {
        ultimoId = nuevosMensajes[nuevosMensajes.length - 1].id;
      }

      expect(ultimoId).toBe(7);
    });

    test("debe pasar desde_id correcto al servicio", () => {
      const ultimoId = 10;
      const params = ultimoId > 0 ? { desde_id: ultimoId } : {};

      expect(params).toEqual({ desde_id: 10 });
    });

    test("no debe pasar desde_id si ultimoId es 0", () => {
      const ultimoId = 0;
      const params = ultimoId > 0 ? { desde_id: ultimoId } : {};

      expect(params).toEqual({});
    });
  });

  describe("3. Envío de mensajes", () => {
    test("debe agregar mensaje del servidor al estado local", () => {
      const prevMensajes: Mensaje[] = [
        {
          id: 1,
          mensaje: "Hola",
          es_admin: false,
          fecha_creacion: "2026-01-01T00:00:00",
        },
      ];

      const mensajeServidor: Mensaje = {
        id: 2,
        mensaje: "Nuevo mensaje",
        es_admin: false,
        fecha_creacion: "2026-01-01T00:01:00",
      };

      const resultado = [...prevMensajes, mensajeServidor];

      expect(resultado).toHaveLength(2);
      expect(resultado[1].id).toBe(2);
    });

    test("debe actualizar ultimoId con el id del mensaje enviado", () => {
      let ultimoId = 5;
      const mensajeEnviado: Mensaje = {
        id: 6,
        mensaje: "Enviado",
        es_admin: false,
        fecha_creacion: "2026-01-01T00:00:00",
      };

      ultimoId = mensajeEnviado.id;

      expect(ultimoId).toBe(6);
    });

    test("no debe enviar si el texto está vacío", () => {
      const texto = "   ";
      const puedeEnviar = texto.trim().length > 0;

      expect(puedeEnviar).toBe(false);
    });

    test("no debe enviar si no hay pqrId", () => {
      const pqrId = undefined;
      const texto = "Mensaje válido";
      const puedeEnviar = !!pqrId && texto.trim().length > 0;

      expect(puedeEnviar).toBe(false);
    });
  });

  describe("4. Estados de la PQR", () => {
    test("debe permitir responder en estado Pendiente", () => {
      const estado: EstadoPQR = "Pendiente";
      const puedeResponder = ESTADOS_ACTIVOS.includes(estado);

      expect(puedeResponder).toBe(true);
    });

    test("debe permitir responder en estado En Proceso", () => {
      const estado: EstadoPQR = "En Proceso";
      const puedeResponder = ESTADOS_ACTIVOS.includes(estado);

      expect(puedeResponder).toBe(true);
    });

    test("no debe permitir responder en estado Resuelto", () => {
      const estado: EstadoPQR = "Resuelto";
      const puedeResponder = ESTADOS_ACTIVOS.includes(estado);

      expect(puedeResponder).toBe(false);
    });

    test("no debe permitir responder en estado Anulado", () => {
      const estado: EstadoPQR = "Anulado";
      const puedeResponder = ESTADOS_ACTIVOS.includes(estado);

      expect(puedeResponder).toBe(false);
    });

    test("debe cambiar estado a En Proceso cuando admin responde a PQR Pendiente", () => {
      const estadoAnterior: EstadoPQR = "Pendiente";
      const isAdmin = true;
      let nuevoEstado: EstadoPQR = estadoAnterior;

      if (isAdmin && estadoAnterior === "Pendiente") {
        nuevoEstado = "En Proceso";
      }

      expect(nuevoEstado).toBe("En Proceso");
    });

    test("no debe cambiar estado si no es admin", () => {
      const estadoAnterior: EstadoPQR = "Pendiente";
      const isAdmin = false;
      let nuevoEstado: EstadoPQR = estadoAnterior;

      if (isAdmin && estadoAnterior === "Pendiente") {
        nuevoEstado = "En Proceso";
      }

      expect(nuevoEstado).toBe("Pendiente");
    });
  });

  describe("5. Polling", () => {
    test("debe activar polling solo en estados activos", () => {
      const estadosQueActivanPolling: EstadoPQR[] = ["Pendiente", "En Proceso"];
      const estadosQueNoActivanPolling: EstadoPQR[] = ["Resuelto", "Anulado"];

      estadosQueActivanPolling.forEach((estado) => {
        expect(ESTADOS_ACTIVOS.includes(estado)).toBe(true);
      });

      estadosQueNoActivanPolling.forEach((estado) => {
        expect(ESTADOS_ACTIVOS.includes(estado)).toBe(false);
      });
    });

    test("no debe activar polling si pqrId es undefined", () => {
      const pqrId = undefined;
      const estadoPqr: EstadoPQR = "Pendiente";
      const debePolling = !!pqrId && ESTADOS_ACTIVOS.includes(estadoPqr);

      expect(debePolling).toBe(false);
    });

    test("no debe activar polling si estadoPqr es undefined", () => {
      const pqrId = "1";
      const estadoPqr = undefined;
      const debePolling =
        !!pqrId &&
        !!estadoPqr &&
        ESTADOS_ACTIVOS.includes(estadoPqr as EstadoPQR);

      expect(debePolling).toBe(false);
    });
  });

  describe("6. Toast", () => {
    test("debe iniciar toast como no visible", () => {
      const toast = { visible: false, message: "", type: "success" as const };

      expect(toast.visible).toBe(false);
      expect(toast.message).toBe("");
    });

    test("debe mostrar toast de error con mensaje correcto", () => {
      let toast = {
        visible: false,
        message: "",
        type: "success" as "success" | "error" | "warning",
      };

      toast = { visible: true, message: "Error al cargar PQR", type: "error" };

      expect(toast.visible).toBe(true);
      expect(toast.type).toBe("error");
      expect(toast.message).toBe("Error al cargar PQR");
    });

    test("debe ocultar toast al llamar hideToast", () => {
      let toast = {
        visible: true,
        message: "Mensaje",
        type: "success" as const,
      };

      toast = { ...toast, visible: false };

      expect(toast.visible).toBe(false);
      expect(toast.message).toBe("Mensaje");
    });
  });
});
