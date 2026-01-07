import { User } from "@/types/User";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { CONTEXT_TYPES } from "./contextTypes";
import {
  getCrashlytics,
  recordError,
  log,
} from "@react-native-firebase/crashlytics";

// URL nueva (cuenta actual)
const BASE_URL = "https://kberc0s7n3.execute-api.us-east-1.amazonaws.com";

let tokenCache: { token: string; expiry: number } | null = null;

export const apiService = {
  // Obtiene el contexto del usuario desde AsyncStorage
  async getUserContext() {
    try {
      const context = await AsyncStorage.getItem("user_context");
      return context ? JSON.parse(context) : null;
    } catch (error) {
      console.error("Error obteniendo contexto:", error);
      return null;
    }
  },

  async getAuthToken() {
    try {
      // Validar si el token en cache aún es válido
      if (tokenCache) {
        const now = Date.now();
        const timeUntilExpiry = tokenCache.expiry - now;

        // Si el token expira en más de 5 minutos, usarlo
        if (timeUntilExpiry > 300000) {
          return tokenCache.token;
        }
      }

      // Obtener nuevo token
      const { fetchAuthSession } = await import("aws-amplify/auth");
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();

      if (token) {
        // Decodificar token para obtener tiempo de expiración real
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const expiry = payload.exp * 1000; // Convertir a milisegundos

          // Cachear token con tiempo de expiración real del JWT
          tokenCache = {
            token,
            expiry: expiry,
          };
        } catch {
          console.warn(
            "[AUTH] No se pudo decodificar token, usando expiry por defecto"
          );
          // Fallback: asumir 1 hora de expiración
          tokenCache = {
            token,
            expiry: Date.now() + 3600000,
          };
        }
      } else {
        console.warn("[AUTH] No se pudo obtener token");
        tokenCache = null;
      }

      return token || null;
    } catch (error) {
      console.error("[AUTH] Error obteniendo token:", error);
      const crashlytics = getCrashlytics();
      recordError(crashlytics, error as Error);
      tokenCache = null;
      return null;
    }
  },

  clearTokenCache() {
    tokenCache = null;
  },

  //Realiza una petición con contexto optimizado por categorías

  async makeRequestWithContextType(
    endpoint: string,
    data: any = {},
    contextType: string = "FULL"
  ) {
    const fields = (CONTEXT_TYPES as any)[contextType];
    const fullContext = await this.getUserContext();

    // Obtener token JWT de Cognito
    const token = await this.getAuthToken();
    const headers: any = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Preparar body según el tipo de contexto
    let requestBody = data;

    if (fields === "NONE") {
      // Sin contexto
      requestBody = data;
    } else if (fields === "FULL" || fields === null) {
      // Contexto completo
      requestBody = { ...data, user_context: fullContext };
    } else if (Array.isArray(fields) && fields.length > 0) {
      // Contexto mínimo
      const minimalContext: Record<string, any> = {};
      fields.forEach((field: string) => {
        if (fullContext && fullContext[field] !== undefined) {
          minimalContext[field] = fullContext[field];
        }
      });
      requestBody = { ...data, user_context: minimalContext };
    }

    // Una sola llamada fetch
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      if (response.status === 401 || response.status === 403) {
        console.error(`[API] Unauthorized en ${endpoint}`);
        const crashlytics = getCrashlytics();
        log(crashlytics, `API Unauthorized: ${endpoint}`);
      }

      if (!response.ok) {
        const error = new Error(`API Error: ${response.status} - ${endpoint}`);
        const crashlytics = getCrashlytics();
        recordError(crashlytics, error);
      }

      return response.json();
    } catch (error) {
      console.error(`[API] Error en ${endpoint}:`, error);
      const crashlytics = getCrashlytics();
      log(crashlytics, `API Request Failed: ${endpoint}`);
      recordError(crashlytics, error as Error);
      throw error;
    }
  },

  // SERVICIOS DE USUARIO

  async getUserInfo(username: string, useContext: boolean = true) {
    try {
      return await this.makeRequestWithContextType(
        "/obtener-usuario",
        {
          username: String(username),
        },
        useContext ? "USER_INFO" : "NONE"
      );
    } catch (error) {
      console.error("Error getting user info:", error);
      const crashlytics = getCrashlytics();
      log(crashlytics, "Error al cargar información del usuario");
      recordError(crashlytics, error as Error);
      throw error;
    }
  },

  //Actualiza información del usuario

  async updateUserInfo(username: string, data: Partial<User>) {
    try {
      return await this.makeRequestWithContextType(
        "/usuarios/actualizar",
        {
          username,
          ...data,
        },
        "USER_UPDATE"
      );
    } catch (error) {
      console.error("Error actualizando usuario:", error);
      throw error;
    }
  },

  //Obtiene apartamentos del usuario actual (requiere contexto)

  async getApartamentosUsuario() {
    try {
      return await this.makeRequestWithContextType(
        "/listar-inmuebles",
        {},
        "APARTMENTS"
      );
    } catch (error) {
      console.error("Error obteniendo inmueble del usuario:", error);
      throw error;
    }
  },

  // SERVICIOS DE PROYECTOS

  async getProyectosUsuario(username: string) {
    try {
      const usernameStr = String(username);

      return await this.makeRequestWithContextType(
        "/listar-proyectos",
        {
          username: usernameStr,
        },
        "PROJECTS_NONE"
      );
    } catch (error) {
      console.error("Error obteniendo proyectos del usuario:", error);
      const crashlytics = getCrashlytics();
      log(crashlytics, "Error al cargar proyectos del usuario");
      recordError(crashlytics, error as Error);
      throw error;
    }
  },
};
