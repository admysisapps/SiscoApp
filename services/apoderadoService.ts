import { ApoderadoLoginData, ApoderadoSession } from "@/types/Apoderado";
import { apiService } from "./apiService";
import {
  getCrashlytics,
  recordError,
  log,
} from "@react-native-firebase/crashlytics";

const BASE_URL = "https://kberc0s7n3.execute-api.us-east-1.amazonaws.com";

//Genera un poder para una asamblea
export const apoderadoService = {
  async generarPoder(asambleaId: number, data: any) {
    try {
      // Validar campos requeridos
      if (!data.nombre || !data.cedula || !data.correo || !data.apartamentos) {
        console.error("GENERARPODER: Faltan campos requeridos");
        throw new Error("Faltan campos requeridos para generar poder");
      }

      const requestBody = {
        asamblea_id: asambleaId,
        nombre: data.nombre,
        cedula: data.cedula,
        correo: data.correo,
        telefono: data.telefono || "",
        apartamentos: data.apartamentos,
      };

      // Usar contexto multi-tenant
      const response = await apiService.makeRequestWithContextType(
        "/apoderados/crear",
        requestBody,
        "GENERATE_POWER"
      );

      if (!response.success) {
        console.error("GENERARPODER: Error de lambda");

        // Retornar error específico de la lambda
        return {
          success: false,
          isUserError: true,
          error: response.error || "Error al generar poder",
        };
      }

      // Problema con correo electrónico
      if (response.success && response.warning && response.error_email) {
        console.error("GENERARPODER: Error de email detectado");
        return {
          success: false,
          isUserError: true,
          error:
            "El correo electrónico proporcionado no es válido o no se pudo enviar el código. Por favor, verifica la dirección de correo.",
          error_email: response.error_email,
        };
      }

      return {
        success: true,
        data: response,
      };
    } catch (error) {
      console.error("GENERARPODER: Error en generación de poder");
      const crashlytics = getCrashlytics();
      log(crashlytics, `Error generando poder para asamblea ${asambleaId}`);
      recordError(crashlytics, error as Error);

      // Error relacionado con correo
      const errorStr = String(error);
      if (
        errorStr.includes("correo") ||
        errorStr.includes("email") ||
        errorStr.includes("MessageRejected")
      ) {
        console.error("GENERARPODER: Error de correo detectado");
        return {
          success: false,
          isUserError: true,
          error:
            "El correo electrónico proporcionado no es válido o no se pudo enviar el código. Por favor, verifica la dirección de correo.",
          error_email: true,
        };
      }

      console.error("GENERARPODER: Error capturado");
      return {
        success: false,
        isUserError: true,
        error:
          String(error).replace("Error: ", "") ||
          "No se pudo generar el poder. Por favor, inténtalo de nuevo.",
      };
    }
  },

  // Obtiene apoderados de una asamblea

  async obtenerApoderadosAsamblea(asambleaId: number) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/apoderados/listar",
        {
          asamblea_id: asambleaId,
        },
        "GET_ASSEMBLY"
      );

      return response;
    } catch (error) {
      console.error("APODERADOS: Error al obtener lista");
      return {
        success: false,
        error:
          String(error).replace("Error: ", "") || "Error al obtener apoderados",
      };
    }
  },

  // Elimina un apoderado

  async eliminarApoderado(apoderadoId: number) {
    try {
      const response = await apiService.makeRequestWithContextType(
        "/apoderados/eliminar",
        {
          apoderado_id: apoderadoId,
        },
        "DELETE_POWER"
      );

      if (response.success) {
        return {
          success: true,
          message: "Apoderado eliminado exitosamente",
        };
      } else {
        return {
          success: false,
          error: "Error al eliminar apoderado",
        };
      }
    } catch (error) {
      console.error(" ELIMINAR: Error:", error);
      return {
        success: false,
        error:
          String(error).replace("Error: ", "") || "Error al eliminar apoderado",
      };
    }
  },

  // Login de apoderado

  async loginApoderado(loginData: ApoderadoLoginData): Promise<{
    success: boolean;
    data?: ApoderadoSession;
    error?: string;
  }> {
    try {
      const result = await apiService.makeRequestWithContextType(
        "/apoderados/login",
        loginData,
        "PROJECTS_NONE"
      );

      if (result.success) {
        return {
          success: true,
          data: result.data,
        };
      } else {
        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      console.error(" Error en loginApoderado:", error);
      console.error(" Error details:", {
        message: (error as Error).message,
        stack: (error as Error).stack,
      });
      const crashlytics = getCrashlytics();
      log(crashlytics, "Error en inicio de sesión de apoderado");
      recordError(crashlytics, error as Error);
      return {
        success: false,
        error: "Error de conexión",
      };
    }
  },

  // Validar asistencia de apoderado
  async validarAsistenciaApoderado(
    asambleaId: number,
    apoderadoSession: ApoderadoSession
  ) {
    try {
      // Construir user_context desde la sesión del apoderado
      const user_context = {
        proyecto_nit: apoderadoSession.proyecto_nit,
        copropiedad: apoderadoSession.copropiedad,
        documento: apoderadoSession.documento,
      };

      const requestBody = {
        asamblea_id: asambleaId,
        user_context,
      };

      const response = await fetch(
        `${BASE_URL}/asambleas/registrar-asistencia`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      const result = await response.json();

      return result;
    } catch (error) {
      console.error(" Error validando asistencia apoderado:", error);
      const crashlytics = getCrashlytics();
      log(
        crashlytics,
        `Error validando asistencia apoderado asamblea ${asambleaId}`
      );
      recordError(crashlytics, error as Error);
      return {
        success: false,
        error: "Error de conexión",
      };
    }
  },
};
