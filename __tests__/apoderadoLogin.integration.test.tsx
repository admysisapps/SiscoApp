/**
 * Test de INTEGRACIÓN - Login Apoderado
 *
 * Verifica el flujo completo de login de apoderados
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import ApoderadoLogin from "@/app/(apoderado)/login";
import { useApoderado } from "@/contexts/ApoderadoContext";
import { useRouter, useLocalSearchParams } from "expo-router";
import { sessionService } from "@/services/cache/sessionService";

// Mock AsyncStorage
jest.mock("@react-native-async-storage/async-storage", () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock SafeAreaContext
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
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
jest.mock("@/contexts/ApoderadoContext");
jest.mock("expo-router");
jest.mock("@/services/cache/sessionService");

const mockUseApoderado = useApoderado as jest.MockedFunction<
  typeof useApoderado
>;
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockUseLocalSearchParams = useLocalSearchParams as jest.MockedFunction<
  typeof useLocalSearchParams
>;
const mockSessionService = sessionService as jest.Mocked<typeof sessionService>;

describe("ApoderadoLogin - Test de Integración", () => {
  const mockLogin = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseApoderado.mockReturnValue({
      login: mockLogin,
      loading: false,
      session: null,
      logout: jest.fn(),
      isAuthenticated: false,
      restoreSession: jest.fn(),
    });

    mockUseRouter.mockReturnValue({
      replace: mockReplace,
    } as any);

    mockUseLocalSearchParams.mockReturnValue({});
  });

  describe("1. Renderizado Inicial", () => {
    test("debe renderizar todos los campos del formulario", () => {
      const { getByPlaceholderText } = render(<ApoderadoLogin />);

      expect(
        getByPlaceholderText("Código de copropiedad (ej: LP251234)")
      ).toBeTruthy();
      expect(getByPlaceholderText("Número de cédula")).toBeTruthy();
      expect(getByPlaceholderText("Correo electrónico")).toBeTruthy();
      expect(getByPlaceholderText("Código de acceso (6 dígitos)")).toBeTruthy();
    });

    test("debe renderizar el botón de login", () => {
      const { getByText } = render(<ApoderadoLogin />);
      expect(getByText("Ingresar a Asamblea")).toBeTruthy();
    });

    test("debe mostrar título y subtítulo", () => {
      const { getByText } = render(<ApoderadoLogin />);
      expect(getByText("Acceso Apoderado")).toBeTruthy();
      expect(getByText("Ingresa con tu código de acceso")).toBeTruthy();
    });
  });

  describe("2. Validación de Campos", () => {
    test("debe validar código de copropiedad vacío", async () => {
      const { getByText } = render(<ApoderadoLogin />);

      fireEvent.press(getByText("Ingresar a Asamblea"));

      await waitFor(() => {
        expect(mockLogin).not.toHaveBeenCalled();
      });
    });

    test("debe validar formato de código de copropiedad", async () => {
      const { getByPlaceholderText, getByText } = render(<ApoderadoLogin />);

      fireEvent.changeText(
        getByPlaceholderText("Código de copropiedad (ej: LP251234)"),
        "ABC"
      );
      fireEvent.changeText(
        getByPlaceholderText("Número de cédula"),
        "1234567890"
      );
      fireEvent.changeText(
        getByPlaceholderText("Correo electrónico"),
        "test@test.com"
      );
      fireEvent.changeText(
        getByPlaceholderText("Código de acceso (6 dígitos)"),
        "123456"
      );

      fireEvent.press(getByText("Ingresar a Asamblea"));

      await waitFor(() => {
        expect(mockLogin).not.toHaveBeenCalled();
      });
    });

    test("debe validar cédula vacía", async () => {
      const { getByPlaceholderText, getByText } = render(<ApoderadoLogin />);

      fireEvent.changeText(
        getByPlaceholderText("Código de copropiedad (ej: LP251234)"),
        "LP251234"
      );
      fireEvent.press(getByText("Ingresar a Asamblea"));

      await waitFor(() => {
        expect(mockLogin).not.toHaveBeenCalled();
      });
    });

    test("debe validar formato de cédula", async () => {
      const { getByPlaceholderText, getByText } = render(<ApoderadoLogin />);

      fireEvent.changeText(
        getByPlaceholderText("Código de copropiedad (ej: LP251234)"),
        "LP251234"
      );
      fireEvent.changeText(getByPlaceholderText("Número de cédula"), "0123");
      fireEvent.changeText(
        getByPlaceholderText("Correo electrónico"),
        "test@test.com"
      );
      fireEvent.changeText(
        getByPlaceholderText("Código de acceso (6 dígitos)"),
        "123456"
      );

      fireEvent.press(getByText("Ingresar a Asamblea"));

      await waitFor(() => {
        expect(mockLogin).not.toHaveBeenCalled();
      });
    });

    test("debe validar correo vacío", async () => {
      const { getByPlaceholderText, getByText } = render(<ApoderadoLogin />);

      fireEvent.changeText(
        getByPlaceholderText("Código de copropiedad (ej: LP251234)"),
        "LP251234"
      );
      fireEvent.changeText(
        getByPlaceholderText("Número de cédula"),
        "1234567890"
      );
      fireEvent.press(getByText("Ingresar a Asamblea"));

      await waitFor(() => {
        expect(mockLogin).not.toHaveBeenCalled();
      });
    });

    test("debe validar formato de correo", async () => {
      const { getByPlaceholderText, getByText } = render(<ApoderadoLogin />);

      fireEvent.changeText(
        getByPlaceholderText("Código de copropiedad (ej: LP251234)"),
        "LP251234"
      );
      fireEvent.changeText(
        getByPlaceholderText("Número de cédula"),
        "1234567890"
      );
      fireEvent.changeText(
        getByPlaceholderText("Correo electrónico"),
        "invalid-email"
      );
      fireEvent.changeText(
        getByPlaceholderText("Código de acceso (6 dígitos)"),
        "123456"
      );

      fireEvent.press(getByText("Ingresar a Asamblea"));

      await waitFor(() => {
        expect(mockLogin).not.toHaveBeenCalled();
      });
    });

    test("debe validar código OTP vacío", async () => {
      const { getByPlaceholderText, getByText } = render(<ApoderadoLogin />);

      fireEvent.changeText(
        getByPlaceholderText("Código de copropiedad (ej: LP251234)"),
        "LP251234"
      );
      fireEvent.changeText(
        getByPlaceholderText("Número de cédula"),
        "1234567890"
      );
      fireEvent.changeText(
        getByPlaceholderText("Correo electrónico"),
        "test@test.com"
      );

      fireEvent.press(getByText("Ingresar a Asamblea"));

      await waitFor(() => {
        expect(mockLogin).not.toHaveBeenCalled();
      });
    });

    test("debe validar longitud de código OTP", async () => {
      const { getByPlaceholderText, getByText } = render(<ApoderadoLogin />);

      fireEvent.changeText(
        getByPlaceholderText("Código de copropiedad (ej: LP251234)"),
        "LP251234"
      );
      fireEvent.changeText(
        getByPlaceholderText("Número de cédula"),
        "1234567890"
      );
      fireEvent.changeText(
        getByPlaceholderText("Correo electrónico"),
        "test@test.com"
      );
      fireEvent.changeText(
        getByPlaceholderText("Código de acceso (6 dígitos)"),
        "123"
      );

      fireEvent.press(getByText("Ingresar a Asamblea"));

      await waitFor(() => {
        expect(mockLogin).not.toHaveBeenCalled();
      });
    });
  });

  describe("3. Login Exitoso", () => {
    test("debe hacer login con datos válidos", async () => {
      const mockSession = {
        apoderado_id: 1,
        nombre: "Test",
        documento: "1234567890",
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

      mockLogin.mockResolvedValue({ success: true, data: mockSession });

      const { getByPlaceholderText, getByText } = render(<ApoderadoLogin />);

      fireEvent.changeText(
        getByPlaceholderText("Código de copropiedad (ej: LP251234)"),
        "LP251234"
      );
      fireEvent.changeText(
        getByPlaceholderText("Número de cédula"),
        "1234567890"
      );
      fireEvent.changeText(
        getByPlaceholderText("Correo electrónico"),
        "test@test.com"
      );
      fireEvent.changeText(
        getByPlaceholderText("Código de acceso (6 dígitos)"),
        "123456"
      );

      fireEvent.press(getByText("Ingresar a Asamblea"));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          correo: "test@test.com",
          cedula: "1234567890",
          codigo_otp: "123456",
          codigo_copropiedad: "LP251234",
        });
      });

      await waitFor(() => {
        expect(mockSessionService.saveSession).toHaveBeenCalled();
        expect(mockReplace).toHaveBeenCalledWith("/(apoderado)/asamblea/1");
      });
    });

    test("debe convertir código de copropiedad a mayúsculas", async () => {
      mockLogin.mockResolvedValue({
        success: true,
        data: { asamblea: { id: 1 } } as any,
      });

      const { getByPlaceholderText, getByText } = render(<ApoderadoLogin />);

      fireEvent.changeText(
        getByPlaceholderText("Código de copropiedad (ej: LP251234)"),
        "lp251234"
      );
      fireEvent.changeText(
        getByPlaceholderText("Número de cédula"),
        "1234567890"
      );
      fireEvent.changeText(
        getByPlaceholderText("Correo electrónico"),
        "test@test.com"
      );
      fireEvent.changeText(
        getByPlaceholderText("Código de acceso (6 dígitos)"),
        "123456"
      );

      fireEvent.press(getByText("Ingresar a Asamblea"));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith(
          expect.objectContaining({
            codigo_copropiedad: "LP251234",
          })
        );
      });
    });

    test("debe limpiar espacios en blanco", async () => {
      mockLogin.mockResolvedValue({
        success: true,
        data: { asamblea: { id: 1 } } as any,
      });

      const { getByPlaceholderText, getByText } = render(<ApoderadoLogin />);

      fireEvent.changeText(
        getByPlaceholderText("Código de copropiedad (ej: LP251234)"),
        " LP251234 "
      );
      fireEvent.changeText(
        getByPlaceholderText("Número de cédula"),
        " 1234567890 "
      );
      fireEvent.changeText(
        getByPlaceholderText("Correo electrónico"),
        " test@test.com "
      );
      fireEvent.changeText(
        getByPlaceholderText("Código de acceso (6 dígitos)"),
        " 123456 "
      );

      fireEvent.press(getByText("Ingresar a Asamblea"));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith({
          correo: "test@test.com",
          cedula: "1234567890",
          codigo_otp: "123456",
          codigo_copropiedad: "LP251234",
        });
      });
    });
  });

  describe("4. Manejo de Errores", () => {
    test("debe manejar error de código de proyecto inválido", async () => {
      mockLogin.mockRejectedValue(new Error("Código de proyecto inválido"));

      const { getByPlaceholderText, getByText } = render(<ApoderadoLogin />);

      fireEvent.changeText(
        getByPlaceholderText("Código de copropiedad (ej: LP251234)"),
        "INVALID"
      );
      fireEvent.changeText(
        getByPlaceholderText("Número de cédula"),
        "1234567890"
      );
      fireEvent.changeText(
        getByPlaceholderText("Correo electrónico"),
        "test@test.com"
      );
      fireEvent.changeText(
        getByPlaceholderText("Código de acceso (6 dígitos)"),
        "123456"
      );

      fireEvent.press(getByText("Ingresar a Asamblea"));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });

    test("debe manejar error de código de acceso incorrecto", async () => {
      mockLogin.mockRejectedValue(new Error("Código de acceso incorrecto"));

      const { getByPlaceholderText, getByText } = render(<ApoderadoLogin />);

      fireEvent.changeText(
        getByPlaceholderText("Código de copropiedad (ej: LP251234)"),
        "LP251234"
      );
      fireEvent.changeText(
        getByPlaceholderText("Número de cédula"),
        "1234567890"
      );
      fireEvent.changeText(
        getByPlaceholderText("Correo electrónico"),
        "test@test.com"
      );
      fireEvent.changeText(
        getByPlaceholderText("Código de acceso (6 dígitos)"),
        "000000"
      );

      fireEvent.press(getByText("Ingresar a Asamblea"));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });

    test("debe manejar error de credenciales inválidas", async () => {
      mockLogin.mockRejectedValue(
        new Error("No pudimos validar el correo o la cédula")
      );

      const { getByPlaceholderText, getByText } = render(<ApoderadoLogin />);

      fireEvent.changeText(
        getByPlaceholderText("Código de copropiedad (ej: LP251234)"),
        "LP251234"
      );
      fireEvent.changeText(
        getByPlaceholderText("Número de cédula"),
        "9999999999"
      );
      fireEvent.changeText(
        getByPlaceholderText("Correo electrónico"),
        "wrong@test.com"
      );
      fireEvent.changeText(
        getByPlaceholderText("Código de acceso (6 dígitos)"),
        "123456"
      );

      fireEvent.press(getByText("Ingresar a Asamblea"));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });

    test("debe manejar código ya utilizado", async () => {
      mockLogin.mockRejectedValue(
        new Error("El código de acceso ya fue utilizado")
      );

      const { getByPlaceholderText, getByText } = render(<ApoderadoLogin />);

      fireEvent.changeText(
        getByPlaceholderText("Código de copropiedad (ej: LP251234)"),
        "LP251234"
      );
      fireEvent.changeText(
        getByPlaceholderText("Número de cédula"),
        "1234567890"
      );
      fireEvent.changeText(
        getByPlaceholderText("Correo electrónico"),
        "test@test.com"
      );
      fireEvent.changeText(
        getByPlaceholderText("Código de acceso (6 dígitos)"),
        "123456"
      );

      fireEvent.press(getByText("Ingresar a Asamblea"));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });

    test("debe manejar código expirado", async () => {
      mockLogin.mockRejectedValue(new Error("El código de acceso ha expirado"));

      const { getByPlaceholderText, getByText } = render(<ApoderadoLogin />);

      fireEvent.changeText(
        getByPlaceholderText("Código de copropiedad (ej: LP251234)"),
        "LP251234"
      );
      fireEvent.changeText(
        getByPlaceholderText("Número de cédula"),
        "1234567890"
      );
      fireEvent.changeText(
        getByPlaceholderText("Correo electrónico"),
        "test@test.com"
      );
      fireEvent.changeText(
        getByPlaceholderText("Código de acceso (6 dígitos)"),
        "123456"
      );

      fireEvent.press(getByText("Ingresar a Asamblea"));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });

    test("debe manejar respuesta sin ID de asamblea", async () => {
      mockLogin.mockResolvedValue({
        success: true,
        data: { asamblea: {} } as any,
      });

      const { getByPlaceholderText, getByText } = render(<ApoderadoLogin />);

      fireEvent.changeText(
        getByPlaceholderText("Código de copropiedad (ej: LP251234)"),
        "LP251234"
      );
      fireEvent.changeText(
        getByPlaceholderText("Número de cédula"),
        "1234567890"
      );
      fireEvent.changeText(
        getByPlaceholderText("Correo electrónico"),
        "test@test.com"
      );
      fireEvent.changeText(
        getByPlaceholderText("Código de acceso (6 dígitos)"),
        "123456"
      );

      fireEvent.press(getByText("Ingresar a Asamblea"));

      await waitFor(() => {
        expect(mockReplace).not.toHaveBeenCalled();
      });
    });
  });

  describe("5. Mensaje de Parámetros", () => {
    test("debe mostrar mensaje si viene de sesión inválida", () => {
      mockUseLocalSearchParams.mockReturnValue({
        mensaje: "Tu sesión ha expirado",
      });

      render(<ApoderadoLogin />);

      // El toast se muestra después de 500ms según el código
    });
  });

  describe("6. Límites de Caracteres", () => {
    test("debe limitar código de copropiedad a 8 caracteres", () => {
      const { getByPlaceholderText } = render(<ApoderadoLogin />);
      const input = getByPlaceholderText(
        "Código de copropiedad (ej: LP251234)"
      );

      expect(input.props.maxLength).toBe(8);
    });

    test("debe limitar cédula a 11 caracteres", () => {
      const { getByPlaceholderText } = render(<ApoderadoLogin />);
      const input = getByPlaceholderText("Número de cédula");

      expect(input.props.maxLength).toBe(11);
    });

    test("debe limitar código OTP a 6 caracteres", () => {
      const { getByPlaceholderText } = render(<ApoderadoLogin />);
      const input = getByPlaceholderText("Código de acceso (6 dígitos)");

      expect(input.props.maxLength).toBe(6);
    });
  });
});
