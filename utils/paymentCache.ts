import AsyncStorage from "@react-native-async-storage/async-storage";
import { CuentaPago } from "@/types/CuentaPago";

interface PaymentCacheData {
  data: CuentaPago[];
  version: string;
  savedAt: number;
}

export const PaymentCache = {
  getCacheKey(copropiedad: string): string {
    return `paymentCache_${copropiedad}`;
  },

  async save(data: CuentaPago[], version: string, copropiedad: string) {
    const cache: PaymentCacheData = {
      data,
      version,
      savedAt: Date.now(),
    };
    await AsyncStorage.setItem(
      this.getCacheKey(copropiedad),
      JSON.stringify(cache)
    );
  },

  async get(copropiedad: string): Promise<CuentaPago[] | null> {
    const cached = await AsyncStorage.getItem(this.getCacheKey(copropiedad));
    if (!cached) return null;

    const cache: PaymentCacheData = JSON.parse(cached);
    return cache.data;
  },

  async getVersion(copropiedad: string): Promise<string | null> {
    const cached = await AsyncStorage.getItem(this.getCacheKey(copropiedad));
    if (!cached) return null;

    const cache: PaymentCacheData = JSON.parse(cached);
    return cache.version;
  },

  async needsUpdate(
    serverVersion: string,
    copropiedad: string
  ): Promise<boolean> {
    const cachedVersion = await this.getVersion(copropiedad);
    return !cachedVersion || cachedVersion !== serverVersion;
  },

  async clear(copropiedad: string) {
    await AsyncStorage.removeItem(this.getCacheKey(copropiedad));
  },

  async clearAll() {
    const keys = await AsyncStorage.getAllKeys();
    const paymentKeys = keys.filter((key) => key.startsWith("paymentCache_"));
    await AsyncStorage.multiRemove(paymentKeys);
  },
};
