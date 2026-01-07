const BASE_URL = "https://kberc0s7n3.execute-api.us-east-1.amazonaws.com";

export interface ValidationResult {
  success: boolean;
  message?: string;
  error?: string;
  email?: string;
  proyecto_nit?: string;
}

// Helper para hacer requests HTTP con validación

const makeHttpRequest = async (url: string, body: any) => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const responseData = await response.json();

  if (!response.ok) {
    // Si hay error HTTP, pero tenemos JSON de respuesta, usar ese error
    if (responseData && responseData.error) {
      throw new Error(responseData.error);
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return responseData;
};

// Helper para manejo consistente de errores de red
const handleNetworkError = (error: any): ValidationResult => {
  if (error.name === "NetworkError" || error.message?.includes("Network")) {
    return {
      success: false,
      error: "Sin conexión a internet. Verifica tu conexión",
    };
  }

  if (error.name === "TimeoutError" || error.message?.includes("timeout")) {
    return {
      success: false,
      error: "La conexión está muy lenta. Inténtalo de nuevo",
    };
  }

  return {
    success: false,
    error: "Error de conexión al validar usuario",
  };
};

export const validationService = {
  //Validar y preparar usuario antes del registro en Cognito No requiere autenticación ni contexto (usuario aún no está logueado)

  async validateAndPrepareUser(
    documento: string,
    email: string,
    codigoInvitacion: string
  ): Promise<ValidationResult> {
    try {
      const requestBody = {
        documento,
        email,
        codigo_invitacion: codigoInvitacion,
      };

      const result = await makeHttpRequest(
        `${BASE_URL}/usuarios/crear`,
        requestBody
      );

      if (result.success) {
        return {
          success: true,
          message:
            result.message || "Usuario validado y preparado correctamente",
          email: result.email,
          proyecto_nit: result.proyecto_nit,
        };
      } else {
        return {
          success: false,
          error: result.error || "Error en validación",
        };
      }
    } catch (error: any) {
      console.error("ValidationService error:", error.message || error);

      // Si el error es específico de la lambda (como CODIGO_INVALIDO), devolverlo directamente
      if (
        error.message &&
        !error.message.includes("HTTP") &&
        !error.message.includes("Network")
      ) {
        return {
          success: false,
          error: error.message,
        };
      }

      // Solo usar handleNetworkError para errores de red reales
      return handleNetworkError(error);
    }
  },

  //  Obtiene email del usuario desde cognito

  async getUserEmail(documento: string) {
    try {
      return await makeHttpRequest(`${BASE_URL}/autenticacion/obtener-email`, {
        documento: String(documento),
      });
    } catch (error: any) {
      console.error(
        "Error obteniendo email del usuario:",
        error.message || error
      );
      throw error;
    }
  },

  //Cambia email de usuario no confirmado

  async changeEmailUnconfirmed(username: string, newEmail: string) {
    try {
      return await makeHttpRequest(
        `${BASE_URL}/autenticacion/actualizar-email`,
        {
          username: String(username),
          nuevo_email: String(newEmail),
        }
      );
    } catch (error: any) {
      console.error("Error cambiando email:", error.message || error);
      throw error;
    }
  },
};
