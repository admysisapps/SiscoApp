import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp } from "@react-native-firebase/app";
import { getMessaging, getToken } from "@react-native-firebase/messaging";
import {
  getCrashlytics,
  recordError,
} from "@react-native-firebase/crashlytics";
import { apiService } from "./apiService";

const BASE_URL = "https://kberc0s7n3.execute-api.us-east-1.amazonaws.com";

// Configurar comportamiento de notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private fcmToken: string | null = null;

  // Verificar si ya se pidieron permisos antes
  async hasRequestedPermissions(): Promise<boolean> {
    const requested = await AsyncStorage.getItem(
      "notifications_permissions_requested"
    );
    return requested === "true";
  }

  // Pedir permisos
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      return false;
    }

    const { status: currentStatus } = await Notifications.getPermissionsAsync();

    if (currentStatus === "granted") {
      await AsyncStorage.setItem("notifications_permissions_requested", "true");
      return true;
    }

    const { status } = await Notifications.requestPermissionsAsync();

    await AsyncStorage.setItem("notifications_permissions_requested", "true");
    return status === "granted";
  }

  // Configurar notificaciones FCM
  async setupNotifications(): Promise<string | null> {
    if (!Device.isDevice) return null;

    try {
      const app = getApp();
      const messaging = getMessaging(app);
      const fcmToken = await getToken(messaging);
      this.fcmToken = fcmToken;
      return fcmToken;
    } catch (error) {
      console.error(" Error obteniendo FCM token:", error);
      const crashlytics = getCrashlytics();
      recordError(crashlytics, error as Error);
      return null;
    }
  }

  // Configurar listeners para respuestas a notificaciones
  setupListeners() {
    const responseListener =
      Notifications.addNotificationResponseReceivedListener(() => {
        // La navegación se maneja en fcmService
      });

    // Retornar función de limpieza
    return () => {
      responseListener.remove();
    };
  }

  // Enviar notificación de bienvenida local
  async sendWelcomeNotification(): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "¡Bienvenido a Sisco!",
          body: "Ya puedes recibir notificaciones importantes de tu copropiedad.",
          data: { type: "welcome" },
        },
        trigger: null,
      });
    } catch {
      // Error silencioso - notificación de bienvenida no es crítica
    }
  }

  // Registrar token FCM para nuevo proyecto
  async registerTokenForNewProject(
    username: string,
    proyecto_nit: string
  ): Promise<boolean> {
    if (!this.fcmToken) {
      return false;
    }

    try {
      const endpoint = `${BASE_URL}/notificaciones/unirse-proyecto`;

      const payload = {
        usuario_documento: username,
        proyecto_nit: proyecto_nit,
        push_token: this.fcmToken,
        dispositivo_tipo: Platform.OS === "ios" ? "ios" : "android",
      };

      // Obtener token de autenticación
      const authToken = await apiService.getAuthToken();
      const headers: any = {
        "Content-Type": "application/json",
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      return response.ok && result.success;
    } catch {
      return false;
    }
  }

  // Desactivar token al cerrar sesión (desactiva todos los proyectos del usuario en este dispositivo)
  async deactivateToken(username: string): Promise<boolean> {
    try {
      const endpoint = `${BASE_URL}/notificaciones/desactivar`;

      const payload = {
        usuario_documento: username,
        push_token: this.fcmToken || "unknown",
      };

      const authToken = await apiService.getAuthToken();
      const headers: any = {
        "Content-Type": "application/json",
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      return response.ok && result.success;
    } catch {
      return false;
    }
  }

  // Enviar notificación de bienvenida al nuevo proyecto
  async sendWelcomeToNewProjectNotification(
    projectName: string
  ): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `¡Bienvenido a ${projectName}!`,
          body: `Ya puedes acceder a todas las funciones de tu nuevo proyecto. ¡Explora reservas, avisos y más!`,
          data: { type: "welcome_project", project: projectName },
        },
        trigger: null,
      });
    } catch {
      // notificación de bienvenida
    }
  }

  // Configurar notificaciones para TODOS los proyectos del usuario
  async setupNotificationsForAllProjects(username: string): Promise<{
    success: boolean;
    granted: boolean;
    message: string;
    projectsRegistered: number;
  }> {
    try {
      const granted = await this.requestPermissions();

      if (granted) {
        const token = await this.setupNotifications();

        if (token) {
          this.setupListeners();

          // Registrar para TODOS los proyectos del usuario
          const projectsRegistered = await this.registerTokenForAllUserProjects(
            username,
            token
          );

          if (projectsRegistered > 0) {
            await this.sendWelcomeNotification();
            return {
              success: true,
              granted: true,
              message: `¡Notificaciones activadas para ${projectsRegistered} proyecto(s)!`,
              projectsRegistered,
            };
          }
        }
      }

      return {
        success: true,
        granted: false,
        message: "Notificaciones no activadas",
        projectsRegistered: 0,
      };
    } catch {
      return {
        success: false,
        granted: false,
        message: "Error configurando notificaciones",
        projectsRegistered: 0,
      };
    }
  }

  // Registrar token para todos los proyectos del usuario
  async registerTokenForAllUserProjects(
    username: string,
    token: string
  ): Promise<number> {
    try {
      const endpoint = `${BASE_URL}/notificaciones/sincronizar-notificaciones`;

      const payload = {
        usuario_documento: username,
        push_token: token,
        dispositivo_tipo: Platform.OS === "ios" ? "ios" : "android",
      };

      // Obtener token de autenticación
      const authToken = await apiService.getAuthToken();
      const headers: any = {
        "Content-Type": "application/json",
      };
      if (authToken) {
        headers.Authorization = `Bearer ${authToken}`;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      // Si es error de token duplicado, considerarlo como éxito
      if (
        !result.success &&
        result.error &&
        result.error.includes("Duplicate entry")
      ) {
        return 1; // Al menos 1 proyecto ya tiene el token
      }

      return result.success ? result.projectsRegistered : 0;
    } catch {
      return 0;
    }
  }

  // Verificar y sincronizar notificaciones con el backend
  async checkUserHasNotifications(username: string): Promise<boolean> {
    try {
      // Verificar permisos del sistema
      const { status } = await Notifications.getPermissionsAsync();
      const hasPermissions = status === "granted";

      // Si tiene permisos, obtener token y sincronizar
      if (hasPermissions) {
        const token = await this.setupNotifications();

        if (token) {
          const projectsRegistered = await this.registerTokenForAllUserProjects(
            username,
            token
          );

          return projectsRegistered > 0;
        }
      }

      return hasPermissions;
    } catch {
      return false;
    }
  }

  // Obtener token FCM actual
  getToken(): string | null {
    return this.fcmToken;
  }
}

export const notificationService = new NotificationService();
