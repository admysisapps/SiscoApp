/**
 * Test UNITARIO - fcmService
 *
 * Verifica las funciones del servicio FCM
 */

import { fcmService } from "@/services/fcmService";
import * as Notifications from "expo-notifications";

// Mocks
jest.mock("@react-native-firebase/app", () => ({
  getApp: jest.fn(() => ({})),
}));

jest.mock("@react-native-firebase/messaging", () => ({
  getMessaging: jest.fn(() => ({})),
  onMessage: jest.fn(),
  onNotificationOpenedApp: jest.fn(),
  getInitialNotification: jest.fn(() => Promise.resolve(null)),
  setBackgroundMessageHandler: jest.fn(),
}));

jest.mock("expo-notifications", () => ({
  getPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
}));

const mockNotifications = Notifications as jest.Mocked<typeof Notifications>;

describe("fcmService - Test Unitario", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("1. checkNotificationsEnabled", () => {
    test("debe verificar permisos habilitados", async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        granted: true,
      } as any);

      const result = await fcmService.checkNotificationsEnabled();

      expect(result).toBe(true);
      expect(mockNotifications.getPermissionsAsync).toHaveBeenCalled();
    });

    test("debe verificar permisos deshabilitados", async () => {
      mockNotifications.getPermissionsAsync.mockResolvedValue({
        granted: false,
      } as any);

      const result = await fcmService.checkNotificationsEnabled();

      expect(result).toBe(false);
    });

    test("debe manejar error al verificar permisos", async () => {
      mockNotifications.getPermissionsAsync.mockRejectedValue(
        new Error("Error")
      );

      const result = await fcmService.checkNotificationsEnabled();

      expect(result).toBe(false);
    });
  });

  describe("2. areNotificationsEnabled", () => {
    test("debe retornar estado de notificaciones", () => {
      const result = fcmService.areNotificationsEnabled();
      expect(typeof result).toBe("boolean");
    });
  });

  describe("3. setOnMessageCallback", () => {
    test("debe configurar callback", () => {
      const mockCallback = jest.fn();
      fcmService.setOnMessageCallback(mockCallback);
      // El callback se configura internamente
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe("4. removeOnMessageCallback", () => {
    test("debe remover callback", () => {
      fcmService.removeOnMessageCallback();
      // El callback se remueve internamente
    });
  });

  describe("5. onMessage", () => {
    test("debe configurar listener y retornar cleanup", () => {
      const mockCallback = jest.fn();
      const cleanup = fcmService.onMessage(mockCallback);

      expect(typeof cleanup).toBe("function");

      // Ejecutar cleanup
      cleanup();
    });
  });
});
