import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiService } from "./apiService";
import { ValidacionAsistenciaResponse } from "../types/Asistencia";

const BASE_URL = "https://kberc0s7n3.execute-api.us-east-1.amazonaws.com";

export const asistenciaService = {
  // SERVICIOS DE ASISTENCIA

  // Valida si el usuario puede registrar asistencia y obtiene apartamentos disponibles

  async validarAsistencia(
    asambleaId: number
  ): Promise<ValidacionAsistenciaResponse> {
    try {
      return await apiService.makeRequestWithContextType(
        "/asambleas/registrar-asistencia",
        {
          asamblea_id: asambleaId,
        },
        "VALIDATE_ATTENDANCE"
      );
    } catch (error) {
      console.error("Error validando asistencia:", error);
      throw error;
    }
  },

  // Registra la salida del usuario de la asamblea y descuenta del quórum

  async salirAsamblea(asambleaId: number): Promise<{ success: boolean }> {
    try {
      // Verificar si hay sesión de apoderado
      const apoderadoSession = await AsyncStorage.getItem("apoderado_session");

      if (apoderadoSession) {
        // Usar contexto de apoderado
        const sessionData = JSON.parse(apoderadoSession);
        const apoderadoContext = {
          documento: sessionData.documento,
          proyecto_nit: sessionData.proyecto_nit,
          copropiedad: sessionData.copropiedad,
        };

        const response = await fetch(`${BASE_URL}/asambleas/registrar-salida`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            asamblea_id: asambleaId,
            user_context: apoderadoContext,
          }),
        });

        return response.json();
      } else {
        // Usar contexto normal de usuario
        return await apiService.makeRequestWithContextType(
          "/asambleas/registrar-salida",
          {
            asamblea_id: asambleaId,
          },
          "VALIDATE_ATTENDANCE"
        );
      }
    } catch (error) {
      console.error("Error al salir de asamblea:", error);
      throw error;
    }
  },

  // Validar sesión existente usando login
  async validarSesion(
    correo: string,
    cedula: string,
    codigoOtp: string,
    codigoCopropiedad: string
  ) {
    try {
      const requestData = {
        correo,
        cedula,
        codigo_otp: codigoOtp,
        codigo_copropiedad: codigoCopropiedad,
        validacion_sesion: true,
      };

      const response = await fetch(`${BASE_URL}/apoderados/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestData),
      });

      const result = await response.json();

      if (response.status !== 200) {
        return {
          success: false,
          error: result.error || `Error ${response.status}`,
        };
      }

      return result;
    } catch (error) {
      console.error("VALIDAR_SESION: Error en request -", error);
      throw error;
    }
  },
};
