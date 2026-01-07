import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "@/types/User";

interface CachedUserData {
  data: User;
  timestamp: number;
  ttl: number;
}

interface UserCache {
  [documento: string]: {
    [proyectoNIT: string]: CachedUserData;
  };
}

export const userCacheService = {
  async getCachedData(
    documento: string,
    proyectoNIT: string
  ): Promise<User | null> {
    try {
      const cache = await AsyncStorage.getItem("user_data_cache");
      if (!cache) return null;

      const userCache: UserCache = JSON.parse(cache);
      const projectCache = userCache[documento]?.[proyectoNIT];

      if (!projectCache || userCacheService.isExpired(projectCache)) {
        return null;
      }

      return projectCache.data;
    } catch (error) {
      console.warn("Error leyendo caché:", error);
      return null;
    }
  },

  async setCachedData(
    documento: string,
    proyectoNIT: string,
    data: User
  ): Promise<void> {
    try {
      // Usar mergeItem para operación atómica más eficiente
      await AsyncStorage.mergeItem(
        "user_data_cache",
        JSON.stringify({
          [documento]: {
            [proyectoNIT]: {
              data,
              timestamp: Date.now(),
              ttl: 604800000, // 1 semana (7 días)
            },
          },
        })
      );
    } catch (error) {
      console.warn("Error guardando caché:", error);
    }
  },

  async invalidateProject(
    documento: string,
    proyectoNIT: string
  ): Promise<void> {
    try {
      // Usar mergeItem con null para eliminar la entrada específica
      await AsyncStorage.mergeItem(
        "user_data_cache",
        JSON.stringify({
          [documento]: {
            [proyectoNIT]: null,
          },
        })
      );
    } catch (error) {
      console.warn("Error invalidando caché:", error);
    }
  },

  async clearAllCache(): Promise<void> {
    try {
      // Usar operación batch para mejor rendimiento
      const allKeys = await AsyncStorage.getAllKeys();
      const keysToRemove = allKeys.filter(
        (key) =>
          key === "user_data_cache" ||
          key.startsWith("apoderado_") ||
          key === "user_context"
      );

      if (keysToRemove.length > 0) {
        await AsyncStorage.multiRemove(keysToRemove);
      }
    } catch (error) {
      console.warn("Error limpiando caché:", error);
    }
  },

  isExpired(cached: CachedUserData): boolean {
    return Date.now() > cached.timestamp + cached.ttl;
  },
};
