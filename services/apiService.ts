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
      if (tokenCache) {
        const timeUntilExpiry = tokenCache.expiry - Date.now();
        if (timeUntilExpiry > 300000) {
          return tokenCache.token;
        }
        const isExpired = timeUntilExpiry <= 0;
        const { fetchAuthSession } = await import("aws-amplify/auth");
        const session = await fetchAuthSession({ forceRefresh: isExpired });
        const token = session.tokens?.accessToken?.toString();
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            tokenCache = { token, expiry: payload.exp * 1000 };
          } catch {
            tokenCache = { token, expiry: Date.now() + 3600000 };
          }
        } else {
          tokenCache = null;
        }
        return token || null;
      }

      const { fetchAuthSession } = await import("aws-amplify/auth");
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          tokenCache = { token, expiry: payload.exp * 1000 };
        } catch {
          tokenCache = { token, expiry: Date.now() + 3600000 };
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
    const token = await this.getAuthToken();

    const headers: any = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    let requestBody = data;

    if (fields === "NONE") {
      requestBody = data;
    } else if (fields === "FULL" || fields === null) {
      requestBody = { ...data, user_context: fullContext };
    } else if (Array.isArray(fields) && fields.length > 0) {
      const minimalContext: Record<string, any> = {};
      fields.forEach((field: string) => {
        if (fullContext && fullContext[field] !== undefined) {
          minimalContext[field] = fullContext[field];
        }
      });
      requestBody = { ...data, user_context: minimalContext };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(`${BASE_URL}${endpoint}`, {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody),
          signal: controller.signal,
        });

        if (response.status === 401 || response.status === 403) {
          tokenCache = null;
          const crashlytics = getCrashlytics();
          log(crashlytics, `API Unauthorized: ${endpoint}`);
        }

        if (!response.ok) {
          const error = new Error(
            `API Error: ${response.status} - ${endpoint}`
          );
          const crashlytics = getCrashlytics();
          recordError(crashlytics, error);
        }

        const body = await response.json();
        return { ...body, statusCode: response.status };
      } finally {
        clearTimeout(timeoutId);
      }
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
