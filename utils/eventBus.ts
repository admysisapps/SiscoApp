import { EventEmitter } from "events";

class EventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(20);
  }
}

export const eventBus = new EventBus();

export const EVENTS = {
  PQR_UPDATED: "pqr:updated",
  RESERVA_UPDATED: "reserva:updated",
  PUBLICACION_REMOVED_FROM_FEED: "publicacion:removed_from_feed",
  DOCUMENTO_CACHED: "documento:cached",
};
