/**
 * Test de INTEGRACIÓN - NotificationContext
 *
 * Verifica el contexto completo de notificaciones
 */

import { renderHook, act } from "@testing-library/react-native";
import {
  NotificationProvider,
  useNotification,
} from "@/contexts/NotificationContext";

// Variables para los mocks
const mockSetOnMessageCallback = jest.fn();
const mockRemoveOnMessageCallback = jest.fn();

// Mock del fcmService
jest.mock("@/services/fcmService", () => ({
  fcmService: {
    setOnMessageCallback: (callback: any) => mockSetOnMessageCallback(callback),
    removeOnMessageCallback: () => mockRemoveOnMessageCallback(),
  },
}));

// Mock del componente InAppNotification
jest.mock("@/components/InAppNotification", () => ({
  InAppNotification: () => null,
}));

describe("NotificationContext - Test de Integración", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("1. Inicialización del Contexto", () => {
    test("debe iniciar sin notificación", () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: NotificationProvider,
      });

      expect(result.current.currentNotification).toBeNull();
    });

    test("debe registrar callback de FCM al montar", () => {
      renderHook(() => useNotification(), {
        wrapper: NotificationProvider,
      });

      expect(mockSetOnMessageCallback).toHaveBeenCalledTimes(1);
      expect(mockSetOnMessageCallback).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    test("debe limpiar callback de FCM al desmontar", () => {
      const { unmount } = renderHook(() => useNotification(), {
        wrapper: NotificationProvider,
      });

      unmount();

      expect(mockRemoveOnMessageCallback).toHaveBeenCalledTimes(1);
    });
  });

  describe("2. Mostrar Notificación Manual", () => {
    test("debe mostrar notificación con showNotification", () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: NotificationProvider,
      });

      const notification = {
        id: "123",
        title: "Test Notification",
        body: "This is a test",
        type: "default" as const,
      };

      act(() => {
        result.current.showNotification(notification);
      });

      expect(result.current.currentNotification).toEqual(notification);
    });

    test("debe actualizar notificación si se muestra otra", () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: NotificationProvider,
      });

      const notification1 = {
        id: "1",
        title: "First",
        body: "First notification",
        type: "default" as const,
      };

      const notification2 = {
        id: "2",
        title: "Second",
        body: "Second notification",
        type: "default" as const,
      };

      act(() => {
        result.current.showNotification(notification1);
      });

      expect(result.current.currentNotification?.id).toBe("1");

      act(() => {
        result.current.showNotification(notification2);
      });

      expect(result.current.currentNotification?.id).toBe("2");
    });
  });

  describe("3. Ocultar Notificación", () => {
    test("debe ocultar notificación con hideNotification", () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: NotificationProvider,
      });

      const notification = {
        id: "123",
        title: "Test",
        body: "Test body",
        type: "default" as const,
      };

      act(() => {
        result.current.showNotification(notification);
      });

      expect(result.current.currentNotification).not.toBeNull();

      act(() => {
        result.current.hideNotification();
      });

      expect(result.current.currentNotification).toBeNull();
    });
  });

  describe("4. Recepción de Mensajes FCM", () => {
    test("debe mostrar notificación cuando llega mensaje FCM", () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: NotificationProvider,
      });

      const fcmCallback = mockSetOnMessageCallback.mock.calls[0][0];

      const remoteMessage = {
        messageId: "fcm-123",
        data: {
          title: "FCM Title",
          body: "FCM Body",
          type: "info",
        },
      };

      act(() => {
        fcmCallback(remoteMessage);
      });

      expect(result.current.currentNotification).toEqual({
        id: "fcm-123",
        title: "FCM Title",
        body: "FCM Body",
        type: "info",
        data: remoteMessage.data,
      });
    });

    test("debe usar notification si data no tiene title/body", () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: NotificationProvider,
      });

      const fcmCallback = mockSetOnMessageCallback.mock.calls[0][0];

      const remoteMessage = {
        messageId: "fcm-456",
        notification: {
          title: "Notification Title",
          body: "Notification Body",
        },
        data: {},
      };

      act(() => {
        fcmCallback(remoteMessage);
      });

      expect(result.current.currentNotification?.title).toBe(
        "Notification Title"
      );
      expect(result.current.currentNotification?.body).toBe(
        "Notification Body"
      );
    });

    test("debe ignorar mensaje sin title", () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: NotificationProvider,
      });

      const fcmCallback = mockSetOnMessageCallback.mock.calls[0][0];

      const remoteMessage = {
        messageId: "fcm-789",
        data: {
          body: "Body without title",
        },
      };

      act(() => {
        fcmCallback(remoteMessage);
      });

      expect(result.current.currentNotification).toBeNull();
    });

    test("debe ignorar mensaje sin body", () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: NotificationProvider,
      });

      const fcmCallback = mockSetOnMessageCallback.mock.calls[0][0];

      const remoteMessage = {
        messageId: "fcm-999",
        data: {
          title: "Title without body",
        },
      };

      act(() => {
        fcmCallback(remoteMessage);
      });

      expect(result.current.currentNotification).toBeNull();
    });

    test("debe ignorar mensaje con title vacío", () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: NotificationProvider,
      });

      const fcmCallback = mockSetOnMessageCallback.mock.calls[0][0];

      const remoteMessage = {
        messageId: "fcm-empty",
        data: {
          title: "   ",
          body: "Body text",
        },
      };

      act(() => {
        fcmCallback(remoteMessage);
      });

      expect(result.current.currentNotification).toBeNull();
    });

    test("debe generar ID si no viene messageId", () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: NotificationProvider,
      });

      const fcmCallback = mockSetOnMessageCallback.mock.calls[0][0];

      const remoteMessage = {
        data: {
          title: "No ID Message",
          body: "Message without ID",
        },
      };

      act(() => {
        fcmCallback(remoteMessage);
      });

      expect(result.current.currentNotification).not.toBeNull();
      expect(result.current.currentNotification?.id).toBeDefined();
      expect(typeof result.current.currentNotification?.id).toBe("string");
    });
  });

  describe("5. Tipos de Notificación", () => {
    test('debe usar tipo "default" si no se especifica', () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: NotificationProvider,
      });

      const fcmCallback = mockSetOnMessageCallback.mock.calls[0][0];

      const remoteMessage = {
        messageId: "fcm-type",
        data: {
          title: "Test",
          body: "Test body",
        },
      };

      act(() => {
        fcmCallback(remoteMessage);
      });

      expect(result.current.currentNotification?.type).toBe("default");
    });

    test("debe respetar tipo especificado en data", () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: NotificationProvider,
      });

      const fcmCallback = mockSetOnMessageCallback.mock.calls[0][0];

      const remoteMessage = {
        messageId: "fcm-custom-type",
        data: {
          title: "Test",
          body: "Test body",
          type: "warning",
        },
      };

      act(() => {
        fcmCallback(remoteMessage);
      });

      expect(result.current.currentNotification?.type).toBe("warning");
    });
  });

  describe("6. Datos Adicionales", () => {
    test("debe incluir data completa en la notificación", () => {
      const { result } = renderHook(() => useNotification(), {
        wrapper: NotificationProvider,
      });

      const fcmCallback = mockSetOnMessageCallback.mock.calls[0][0];

      const remoteMessage = {
        messageId: "fcm-data",
        data: {
          title: "Test",
          body: "Test body",
          type: "info",
          customField: "custom value",
          userId: "12345",
        },
      };

      act(() => {
        fcmCallback(remoteMessage);
      });

      expect(result.current.currentNotification?.data).toEqual(
        remoteMessage.data
      );
      expect(result.current.currentNotification?.data?.customField).toBe(
        "custom value"
      );
    });
  });

  describe("7. Hook useNotification", () => {
    test("debe lanzar error si se usa fuera del Provider", () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();

      expect(() => {
        renderHook(() => useNotification());
      }).toThrow("useNotification must be used within a NotificationProvider");

      consoleError.mockRestore();
    });
  });
});
