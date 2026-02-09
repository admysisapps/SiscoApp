/**
 * Test de INTEGRACIÓN - ApoderadoContext
 *
 * Verifica el contexto completo de autenticación de apoderados
 */

import { renderHook, act } from "@testing-library/react-native";
import { ApoderadoProvider, useApoderado } from "@/contexts/ApoderadoContext";
import { apoderadoService } from "@/services/apoderadoService";
import { sessionService } from "@/services/cache/sessionService";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock Firebase
jest.mock("@react-native-firebase/app", () => ({
  getApp: jest.fn(() => ({})),
}));

jest.mock("@react-native-firebase/crashlytics", () => ({
  getCrashlytics: jest.fn(() => ({})),
  recordError: jest.fn(),
  log: jest.fn(),
}));

// Mocks
jest.mock("@/services/apoderadoService");
jest.mock("@/services/cache/sessionService");

const mockApoderadoService = apoderadoService as jest.Mocked<
  typeof apoderadoService
>;
const mockSessionService = sessionService as jest.Mocked<typeof sessionService>;

describe("ApoderadoContext - Test de Integración", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("1. Inicialización del Contexto", () => {
    test("debe iniciar sin sesión", () => {
      const { result } = renderHook(() => useApoderado(), {
        wrapper: ApoderadoProvider,
      });

      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.loading).toBe(false);
    });

    test("debe limpiar sesión al desmontar", () => {
      const { unmount } = renderHook(() => useApoderado(), {
        wrapper: ApoderadoProvider,
      });

      unmount();

      expect(mockSessionService.clearSession).toHaveBeenCalled();
    });
  });

  describe("2. Login Exitoso", () => {
    test("debe hacer login correctamente", async () => {
      const mockSession = {
        apoderado_id: 1,
        nombre: "Juan Pérez",
        documento: "1234567890",
        correo: "juan@test.com",
        apartamentos: ["101", "102"],
        proyecto_nombre: "Proyecto Test",
        proyecto_nit: "900123456",
        copropiedad: "LP251234",
        puede_reingresar: true,
        asamblea: {
          id: 1,
          titulo: "Asamblea Test",
          descripcion: "Descripción test",
          fecha: "2024-01-15",
          hora: "10:00",
          lugar: "Salón comunal",
          modalidad: "presencial" as const,
          enlace_virtual: "",
          estado: "en_curso" as const,
          tipo_asamblea: "ordinaria" as const,
          quorum_requerido: 50,
          quorum_alcanzado: 60,
        },
      };

      mockApoderadoService.loginApoderado.mockResolvedValue({
        success: true,
        data: mockSession,
      });

      const { result } = renderHook(() => useApoderado(), {
        wrapper: ApoderadoProvider,
      });

      const loginData = {
        correo: "juan@test.com",
        cedula: "1234567890",
        codigo_otp: "123456",
        codigo_copropiedad: "LP251234",
      };

      let response;
      await act(async () => {
        response = await result.current.login(loginData);
      });

      expect(mockApoderadoService.loginApoderado).toHaveBeenCalledWith(
        loginData
      );
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.isAuthenticated).toBe(true);
      expect(response).toEqual({ success: true, data: mockSession });
    });

    test("debe manejar estado de loading durante login", async () => {
      mockApoderadoService.loginApoderado.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true, data: {} as any }), 100)
          )
      );

      const { result } = renderHook(() => useApoderado(), {
        wrapper: ApoderadoProvider,
      });

      expect(result.current.loading).toBe(false);

      const loginPromise = act(async () => {
        await result.current.login({
          correo: "test@test.com",
          cedula: "123",
          codigo_otp: "123456",
          codigo_copropiedad: "LP251234",
        });
      });

      await loginPromise;
      expect(result.current.loading).toBe(false);
    });
  });

  describe("3. Login con Errores", () => {
    test("debe manejar error de código inválido", async () => {
      mockApoderadoService.loginApoderado.mockResolvedValue({
        success: false,
        error: "Código de acceso incorrecto",
      });

      const { result } = renderHook(() => useApoderado(), {
        wrapper: ApoderadoProvider,
      });

      await expect(
        act(async () => {
          await result.current.login({
            correo: "test@test.com",
            cedula: "123",
            codigo_otp: "000000",
            codigo_copropiedad: "LP251234",
          });
        })
      ).rejects.toThrow("Código de acceso incorrecto");

      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    test("debe manejar error de proyecto inválido", async () => {
      mockApoderadoService.loginApoderado.mockResolvedValue({
        success: false,
        error: "Código de proyecto inválido",
      });

      const { result } = renderHook(() => useApoderado(), {
        wrapper: ApoderadoProvider,
      });

      await expect(
        act(async () => {
          await result.current.login({
            correo: "test@test.com",
            cedula: "123",
            codigo_otp: "123456",
            codigo_copropiedad: "INVALID",
          });
        })
      ).rejects.toThrow("Código de proyecto inválido");
    });

    test("debe manejar error de credenciales inválidas", async () => {
      mockApoderadoService.loginApoderado.mockResolvedValue({
        success: false,
        error: "No pudimos validar el correo o la cédula",
      });

      const { result } = renderHook(() => useApoderado(), {
        wrapper: ApoderadoProvider,
      });

      await expect(
        act(async () => {
          await result.current.login({
            correo: "wrong@test.com",
            cedula: "999",
            codigo_otp: "123456",
            codigo_copropiedad: "LP251234",
          });
        })
      ).rejects.toThrow("No pudimos validar el correo o la cédula");
    });

    test("debe manejar código ya utilizado", async () => {
      mockApoderadoService.loginApoderado.mockResolvedValue({
        success: false,
        error: "El código de acceso ya fue utilizado",
      });

      const { result } = renderHook(() => useApoderado(), {
        wrapper: ApoderadoProvider,
      });

      await expect(
        act(async () => {
          await result.current.login({
            correo: "test@test.com",
            cedula: "123",
            codigo_otp: "123456",
            codigo_copropiedad: "LP251234",
          });
        })
      ).rejects.toThrow("El código de acceso ya fue utilizado");
    });

    test("debe manejar código expirado", async () => {
      mockApoderadoService.loginApoderado.mockResolvedValue({
        success: false,
        error: "El código de acceso ha expirado",
      });

      const { result } = renderHook(() => useApoderado(), {
        wrapper: ApoderadoProvider,
      });

      await expect(
        act(async () => {
          await result.current.login({
            correo: "test@test.com",
            cedula: "123",
            codigo_otp: "123456",
            codigo_copropiedad: "LP251234",
          });
        })
      ).rejects.toThrow("El código de acceso ha expirado");
    });

    test("debe manejar error genérico", async () => {
      mockApoderadoService.loginApoderado.mockResolvedValue({
        success: false,
      });

      const { result } = renderHook(() => useApoderado(), {
        wrapper: ApoderadoProvider,
      });

      await expect(
        act(async () => {
          await result.current.login({
            correo: "test@test.com",
            cedula: "123",
            codigo_otp: "123456",
            codigo_copropiedad: "LP251234",
          });
        })
      ).rejects.toThrow("Error al iniciar sesión");
    });
  });

  describe("4. Logout", () => {
    test("debe hacer logout correctamente", async () => {
      const mockSession = {
        apoderado_id: 1,
        nombre: "Test",
        documento: "123",
        correo: "test@test.com",
        apartamentos: ["101"],
        proyecto_nombre: "Test",
        proyecto_nit: "900123456",
        copropiedad: "LP251234",
        puede_reingresar: true,
        asamblea: {} as any,
      };

      mockApoderadoService.loginApoderado.mockResolvedValue({
        success: true,
        data: mockSession,
      });

      const { result } = renderHook(() => useApoderado(), {
        wrapper: ApoderadoProvider,
      });

      await act(async () => {
        await result.current.login({
          correo: "test@test.com",
          cedula: "123",
          codigo_otp: "123456",
          codigo_copropiedad: "LP251234",
        });
      });

      expect(result.current.isAuthenticated).toBe(true);

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockSessionService.clearSession).toHaveBeenCalled();
    });
  });

  describe("5. Restaurar Sesión", () => {
    test("debe restaurar sesión guardada", async () => {
      const mockSession = {
        apoderado_id: 1,
        nombre: "Test",
        documento: "123",
        correo: "test@test.com",
        apartamentos: ["101"],
        proyecto_nombre: "Test",
        proyecto_nit: "900123456",
        copropiedad: "LP251234",
        puede_reingresar: true,
        asamblea: {
          id: 1,
          titulo: "Asamblea Test",
          descripcion: "Test",
          fecha: "2024-01-15",
          hora: "10:00",
          lugar: "Test",
          modalidad: "presencial" as const,
          enlace_virtual: "",
          estado: "en_curso" as const,
          tipo_asamblea: "ordinaria" as const,
          quorum_requerido: 50,
          quorum_alcanzado: 60,
        },
      };

      mockSessionService.getSession.mockResolvedValue(mockSession as any);

      const { result } = renderHook(() => useApoderado(), {
        wrapper: ApoderadoProvider,
      });

      let restored;
      await act(async () => {
        restored = await result.current.restoreSession();
      });

      expect(restored).toBe(true);
      expect(result.current.session).toEqual(mockSession);
      expect(result.current.isAuthenticated).toBe(true);
    });

    test("debe retornar false si no hay sesión guardada", async () => {
      mockSessionService.getSession.mockResolvedValue(null);

      const { result } = renderHook(() => useApoderado(), {
        wrapper: ApoderadoProvider,
      });

      let restored;
      await act(async () => {
        restored = await result.current.restoreSession();
      });

      expect(restored).toBe(false);
      expect(result.current.session).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    test("debe manejar error al restaurar sesión", async () => {
      mockSessionService.getSession.mockRejectedValue(new Error("Error"));

      const { result } = renderHook(() => useApoderado(), {
        wrapper: ApoderadoProvider,
      });

      let restored;
      await act(async () => {
        restored = await result.current.restoreSession();
      });

      expect(restored).toBe(false);
      expect(result.current.session).toBeNull();
    });
  });

  describe("6. Hook useApoderado", () => {
    test("debe lanzar error si se usa fuera del Provider", () => {
      const consoleError = jest.spyOn(console, "error").mockImplementation();

      expect(() => {
        renderHook(() => useApoderado());
      }).toThrow("useApoderado must be used within an ApoderadoProvider");

      consoleError.mockRestore();
    });
  });
});
