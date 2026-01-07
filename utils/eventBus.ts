import { EventEmitter } from "events";

class EventBus extends EventEmitter {}

export const eventBus = new EventBus();

export const EVENTS = {
  PQR_UPDATED: "pqr:updated",
  RESERVA_UPDATED: "reserva:updated",
  CUENTA_PAGO_CREATED: "cuenta_pago:created",
  CUENTA_PAGO_UPDATED: "cuenta_pago:updated",
  CUENTA_PAGO_DELETED: "cuenta_pago:deleted",
};
