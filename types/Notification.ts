// Tipos específicos para notificaciones
export type NotificationType =
  | "aviso"
  | "pqr"
  | "pago"
  | "asamblea"
  | "emergencia"
  | "welcome"
  | "default";

export interface NotificationData {
  id: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: {
    id?: string;
    aviso_tipo?: string;
    prioridad?: "baja" | "media" | "alta" | "urgente";
    proyecto_nit?: string;
    [key: string]: any;
  };
}

export interface FCMRemoteMessage {
  messageId?: string;
  notification?: {
    title?: string;
    body?: string;
  };
  data?: {
    type?: string;
    id?: string;
    [key: string]: any;
  };
  from?: string;
  sentTime?: number;
}

export interface InAppNotificationProps {
  visible: boolean;
  title: string;
  body: string;
  type?: NotificationType;
  onPress?: () => void;
  onDismiss?: () => void;
  duration?: number;
}
