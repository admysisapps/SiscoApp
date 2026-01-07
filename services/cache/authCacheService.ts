import AsyncStorage from "@react-native-async-storage/async-storage";

const AUTH_CACHE_KEY = "auth_status_cache";
const CACHE_EXPIRY_KEY = "auth_cache_expiry";
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

interface AuthCacheData {
  isAuthenticated: boolean;
  username?: string;
  timestamp: number;
}

export const authCacheService = {
  /**
   * Guardar estado de autenticación en cache
   */
  async setAuthStatus(
    isAuthenticated: boolean,
    username?: string
  ): Promise<void> {
    try {
      const cacheData: AuthCacheData = {
        isAuthenticated,
        username,
        timestamp: Date.now(),
      };

      await AsyncStorage.multiSet([
        [AUTH_CACHE_KEY, JSON.stringify(cacheData)],
        [CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString()],
      ]);
    } catch (error) {
      console.warn("Error saving auth cache:", error);
    }
  },

  /**
   * Obtener estado de autenticación desde cache
   */
  async getAuthStatus(): Promise<{
    isAuthenticated: boolean;
    username?: string;
  } | null> {
    try {
      const [cacheData, expiryTime] = await AsyncStorage.multiGet([
        AUTH_CACHE_KEY,
        CACHE_EXPIRY_KEY,
      ]);

      if (!cacheData[1] || !expiryTime[1]) {
        return null;
      }

      const expiry = parseInt(expiryTime[1], 10);
      if (Date.now() > expiry) {
        // Cache expirado
        await this.clearAuthCache();
        return null;
      }

      const parsedData: AuthCacheData = JSON.parse(cacheData[1]);
      return {
        isAuthenticated: parsedData.isAuthenticated,
        username: parsedData.username,
      };
    } catch (error) {
      console.warn("Error reading auth cache:", error);
      return null;
    }
  },

  /**
   * Limpiar cache de autenticación
   */
  async clearAuthCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([AUTH_CACHE_KEY, CACHE_EXPIRY_KEY]);
    } catch (error) {
      console.warn("Error clearing auth cache:", error);
    }
  },

  /**
   * Verificar si el cache es válido
   */
  async isCacheValid(): Promise<boolean> {
    try {
      const expiryTime = await AsyncStorage.getItem(CACHE_EXPIRY_KEY);
      if (!expiryTime) return false;

      return Date.now() < parseInt(expiryTime, 10);
    } catch {
      return false;
    }
  },
};
