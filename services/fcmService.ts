import { getApp } from "@react-native-firebase/app";
import {
  getMessaging,
  onMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  setBackgroundMessageHandler,
} from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";

const app = getApp();
const messagingInstance = getMessaging(app);

// Background handler - Maneja notificaciones cuando la app está cerrada o en background
// Debe estar en el nivel superior del archivo (fuera de cualquier clase o función)
setBackgroundMessageHandler(messagingInstance, async (remoteMessage: any) => {
  // FCM muestra la notificación automáticamente cuando la app está en background
  // Este handler es solo para procesar datos si fuera necesario
});

class FCMService {
  private static instance: FCMService;
  private onMessageCallback?: (message: any) => void;
  private notificationsEnabled: boolean = false;

  static getInstance(): FCMService {
    if (!FCMService.instance) {
      FCMService.instance = new FCMService();
    }
    return FCMService.instance;
  }

  // Verificar si las notificaciones están habilitadas
  async checkNotificationsEnabled(): Promise<boolean> {
    try {
      const settings = await Notifications.getPermissionsAsync();
      this.notificationsEnabled = settings.granted;
      return settings.granted;
    } catch {
      this.notificationsEnabled = false;
      return false;
    }
  }

  // Obtener estado actual de notificaciones
  areNotificationsEnabled(): boolean {
    return this.notificationsEnabled;
  }

  // Configurar handlers de FCM
  async initialize() {
    await this.checkNotificationsEnabled();

    // Foreground handler - Maneja notificaciones cuando la app está abierta y en uso
    onMessage(messagingInstance, async (remoteMessage) => {
      // Si hay un callback personalizado (ej: componente in-app), usarlo
      if (this.onMessageCallback) {
        this.onMessageCallback(remoteMessage);
      } else {
        // Si no hay callback, mostrar notificación nativa
        const notificationContent: any = {
          title:
            remoteMessage.data?.title ||
            remoteMessage.notification?.title ||
            "Nueva notificación",
          body:
            remoteMessage.data?.body ||
            remoteMessage.notification?.body ||
            "Tienes un nuevo mensaje",
          data: remoteMessage.data || {},
        };

        await Notifications.scheduleNotificationAsync({
          content: notificationContent,
          trigger: null,
        });
      }
    });

    // Handler cuando usuario toca notificación y app está en background
    onNotificationOpenedApp(messagingInstance, () => {
      // Aquí puedes agregar navegación si es necesario
    });

    // Handler cuando usuario toca notificación y app estaba completamente cerrada
    getInitialNotification(messagingInstance).then(() => {
      // Aquí puedes agregar navegación si es necesario
    });
  }

  // Permitir que otros componentes manejen mensajes
  setOnMessageCallback(callback: (message: any) => void) {
    this.onMessageCallback = callback;
  }

  // Quitar callback
  removeOnMessageCallback() {
    this.onMessageCallback = undefined;
  }

  // Método para que componentes escuchen mensajes FCM en tiempo real
  // Ejemplo de uso: fcmService.onMessage((message) => { /* manejar mensaje */ })
  onMessage(callback: (message: any) => void) {
    // Configurar el callback personalizado
    this.setOnMessageCallback(callback);

    // Retornar función de limpieza para remover el listener cuando el componente se desmonte
    return () => {
      this.removeOnMessageCallback();
    };
  }
}

export const fcmService = FCMService.getInstance();
