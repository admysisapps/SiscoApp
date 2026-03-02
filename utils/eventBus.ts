import { EventEmitter } from "events";

class EventBus extends EventEmitter {}

export const eventBus = new EventBus();

export const EVENTS = {
  PQR_UPDATED: "pqr:updated",
  RESERVA_UPDATED: "reserva:updated",
  PUBLICACION_CREATED: "publicacion:created",
  PUBLICACION_UPDATED: "publicacion:updated",
  DOCUMENTO_CACHED: "documento:cached",
};
