import AsyncStorage from "@react-native-async-storage/async-storage";
import { Apartamento } from "@/types/Apartamento";

interface CachedApartmentData {
  data: Apartamento[];
  timestamp: number;
}

interface ApartmentCache {
  [documento: string]: {
    [proyectoNIT: string]: CachedApartmentData;
  };
}

export const apartmentCacheService = {
  async getCachedApartments(
    documento: string,
    proyectoNIT: string
  ): Promise<Apartamento[] | null> {
    try {
      const cache = await AsyncStorage.getItem("apartment_cache");
      if (!cache) return null;

      const apartmentCache: ApartmentCache = JSON.parse(cache);
      const projectCache = apartmentCache[documento]?.[proyectoNIT];

      if (!projectCache) {
        return null;
      }

      return projectCache.data;
    } catch (error) {
      console.warn("Error leyendo caché de apartamentos:", error);
      return null;
    }
  },

  async setCachedApartments(
    documento: string,
    proyectoNIT: string,
    data: Apartamento[]
  ): Promise<void> {
    try {
      const cache = await AsyncStorage.getItem("apartment_cache");
      const apartmentCache: ApartmentCache = cache ? JSON.parse(cache) : {};

      if (!apartmentCache[documento]) {
        apartmentCache[documento] = {};
      }

      apartmentCache[documento][proyectoNIT] = {
        data,
        timestamp: Date.now(),
      };

      await AsyncStorage.setItem(
        "apartment_cache",
        JSON.stringify(apartmentCache)
      );
    } catch (error) {
      console.warn("Error guardando caché de apartamentos:", error);
    }
  },

  async clearAllCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem("apartment_cache");
    } catch (error) {
      console.warn("Error limpiando caché de apartamentos:", error);
    }
  },

  async invalidateProject(
    documento: string,
    proyectoNIT: string
  ): Promise<void> {
    try {
      const cache = await AsyncStorage.getItem("apartment_cache");
      if (!cache) return;

      const apartmentCache: ApartmentCache = JSON.parse(cache);
      if (apartmentCache[documento]?.[proyectoNIT]) {
        delete apartmentCache[documento][proyectoNIT];
        await AsyncStorage.setItem(
          "apartment_cache",
          JSON.stringify(apartmentCache)
        );
      }
    } catch (error) {
      console.warn("Error invalidando caché de apartamentos:", error);
    }
  },
};
