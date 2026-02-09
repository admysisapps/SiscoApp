/**
 * Test UNITARIO - apoderadoService
 *
 * Verifica las funciones del servicio de apoderados
 */

import { apoderadoService } from "@/services/apoderadoService";
import { apiService } from "@/services/apiService";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mocks
jest.mock("@/services/apiService");
jest.mock("@react-native-firebase/crashlytics", () => ({
  getCrashlytics: jest.fn(() => ({})),
  recordError: jest.fn(),
  log: jest.fn(),
}));

const mockApiService = apiService as jest.Mocked<typeof apiService>;

describe("apoderadoService - Test Unitario", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("1. loginApoderado", () => {
    test("debe hacer login exitoso", async () => {
      const mockResponse = {
        success: true,
        data: {
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
        },
      };

      mockApiService.makeRequestWithContextType.mockResolvedValue(mockResponse);

      const result = await apoderadoService.loginApoderado({
        correo: "test@test.com",
        cedula: "123",
        codigo_otp: "123456",
        codigo_copropiedad: "LP251234",
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
      expect(mockApiService.makeRequestWithContextType).toHaveBeenCalledWith(
        "/apoderados/login",
        expect.any(Object),
        "PROJECTS_NONE"
      );
    });

    test("debe manejar error de login", async () => {
      mockApiService.makeRequestWithContextType.mockResolvedValue({
        success: false,
        error: "Código de acceso incorrecto",
      });

      const result = await apoderadoService.loginApoderado({
        correo: "test@test.com",
        cedula: "123",
        codigo_otp: "000000",
        codigo_copropiedad: "LP251234",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Código de acceso incorrecto");
    });

    test("debe manejar error de conexión", async () => {
      mockApiService.makeRequestWithContextType.mockRejectedValue(
        new Error("Network error")
      );

      const result = await apoderadoService.loginApoderado({
        correo: "test@test.com",
        cedula: "123",
        codigo_otp: "123456",
        codigo_copropiedad: "LP251234",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error de conexión");
    });
  });

  describe("2. generarPoder", () => {
    test("debe generar poder exitosamente", async () => {
      const mockResponse = {
        success: true,
        data: { apoderado_id: 1 },
      };

      mockApiService.makeRequestWithContextType.mockResolvedValue(mockResponse);

      const result = await apoderadoService.generarPoder(1, {
        nombre: "Test",
        cedula: "123",
        correo: "test@test.com",
        apartamentos: "101",
      });

      expect(result.success).toBe(true);
      expect(mockApiService.makeRequestWithContextType).toHaveBeenCalledWith(
        "/apoderados/crear",
        expect.objectContaining({
          asamblea_id: 1,
          nombre: "Test",
          cedula: "123",
          correo: "test@test.com",
          apartamentos: "101",
        }),
        "GENERATE_POWER"
      );
    });

    test("debe validar campos requeridos", async () => {
      const result = await apoderadoService.generarPoder(1, {
        nombre: "",
        cedula: "123",
        correo: "test@test.com",
        apartamentos: "101",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("campos requeridos");
    });

    test("debe manejar error de email", async () => {
      mockApiService.makeRequestWithContextType.mockResolvedValue({
        success: true,
        warning: true,
        error_email: true,
      });

      const result = await apoderadoService.generarPoder(1, {
        nombre: "Test",
        cedula: "123",
        correo: "invalid@test.com",
        apartamentos: "101",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("correo");
    });
  });

  describe("3. obtenerApoderadosAsamblea", () => {
    test("debe obtener lista de apoderados", async () => {
      const mockResponse = {
        success: true,
        data: [
          { id: 1, nombre: "Test 1" },
          { id: 2, nombre: "Test 2" },
        ],
      };

      mockApiService.makeRequestWithContextType.mockResolvedValue(mockResponse);

      const result = await apoderadoService.obtenerApoderadosAsamblea(1);

      expect(result.success).toBe(true);
      expect(mockApiService.makeRequestWithContextType).toHaveBeenCalledWith(
        "/apoderados/listar",
        { asamblea_id: 1 },
        "GET_ASSEMBLY"
      );
    });

    test("debe manejar error al obtener apoderados", async () => {
      mockApiService.makeRequestWithContextType.mockRejectedValue(
        new Error("Error")
      );

      const result = await apoderadoService.obtenerApoderadosAsamblea(1);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe("4. eliminarApoderado", () => {
    test("debe eliminar apoderado exitosamente", async () => {
      mockApiService.makeRequestWithContextType.mockResolvedValue({
        success: true,
      });

      const result = await apoderadoService.eliminarApoderado(1);

      expect(result.success).toBe(true);
      expect(result.message).toBe("Apoderado eliminado exitosamente");
      expect(mockApiService.makeRequestWithContextType).toHaveBeenCalledWith(
        "/apoderados/eliminar",
        { apoderado_id: 1 },
        "DELETE_POWER"
      );
    });

    test("debe manejar error al eliminar", async () => {
      mockApiService.makeRequestWithContextType.mockResolvedValue({
        success: false,
      });

      const result = await apoderadoService.eliminarApoderado(1);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error al eliminar apoderado");
    });
  });

  describe("5. validarAsistenciaApoderado", () => {
    test("debe validar asistencia exitosamente", async () => {
      global.fetch = jest.fn().mockResolvedValue({
        json: async () => ({ success: true }),
      });

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

      const result = await apoderadoService.validarAsistenciaApoderado(
        1,
        mockSession
      );

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalled();
    });

    test("debe manejar error de validación", async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));

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

      const result = await apoderadoService.validarAsistenciaApoderado(
        1,
        mockSession
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe("Error de conexión");
    });
  });
});
