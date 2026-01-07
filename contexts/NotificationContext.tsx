import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { fcmService } from "@/services/fcmService";
// import { router } from "expo-router";
import { InAppNotification } from "@/components/InAppNotification";
import {
  NotificationData,
  FCMRemoteMessage,
  NotificationType,
} from "@/types/Notification";

interface NotificationContextType {
  currentNotification: NotificationData | null;
  showNotification: (notification: NotificationData) => void;
  hideNotification: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentNotification, setCurrentNotification] =
    useState<NotificationData | null>(null);

  const showNotification = useCallback((notification: NotificationData) => {
    setCurrentNotification(notification);
  }, []);

  useEffect(() => {
    // Configurar callback para FCM
    fcmService.setOnMessageCallback((remoteMessage: FCMRemoteMessage) => {
      // Extraer title y body de data o notification
      const title =
        remoteMessage.data?.title || remoteMessage.notification?.title || "";
      const body =
        remoteMessage.data?.body || remoteMessage.notification?.body || "";

      // Validar que title y body tengan contenido antes de mostrar
      if (!title.trim() || !body.trim()) {
        return;
      }

      showNotification({
        id: remoteMessage.messageId || Date.now().toString(),
        title,
        body,
        type: (remoteMessage.data?.type as NotificationType) || "default",
        data: remoteMessage.data,
      });
    });

    return () => {
      fcmService.removeOnMessageCallback();
    };
  }, [showNotification]);

  const hideNotification = useCallback(() => {
    setCurrentNotification(null);
  }, []);

  // const navigateToSection = useCallback(
  //   (type: NotificationType, id?: string) => {
  //     switch (type) {
  //       case "asamblea":
  //         router.push(`/(tabs)/(asambleas)/${id}`);
  //         break;
  //       case "pqr":
  //         router.push(`/(screens)/pqr/`);
  //         break;
  //       case "pago":
  //         router.push(`/(screens)/pagos/`);
  //         break;
  //       case "aviso":
  //         router.push("/(screens)/avisos/AvisosScreen");
  //         break;
  //       default:
  //         console.log("Tipo de notificación no reconocido:", type);
  //     }
  //   },
  //   []
  // );

  const handleNotificationPress = useCallback(() => {
    // Solo ocultar la notificación, sin navegación
    hideNotification();
  }, [hideNotification]);

  return (
    <NotificationContext.Provider
      value={{
        currentNotification,
        showNotification,
        hideNotification,
      }}
    >
      {children}

      {/* Renderizar notificación si existe */}
      {currentNotification && (
        <InAppNotification
          visible={!!currentNotification}
          title={currentNotification.title}
          body={currentNotification.body}
          type={currentNotification.type}
          onPress={handleNotificationPress}
          onDismiss={hideNotification}
        />
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
