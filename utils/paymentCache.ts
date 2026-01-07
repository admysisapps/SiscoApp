import AsyncStorage from "@react-native-async-storage/async-storage";
import { CuentaPago } from "@/types/CuentaPago";

interface PaymentCacheData {
  data: CuentaPago[];
  version: string;
  savedAt: number;
}

export const PaymentCache = {
  async save(data: CuentaPago[], version: string) {
    const cache: PaymentCacheData = {
      data,
      version,
      savedAt: Date.now(),
    };
    await AsyncStorage.setItem("paymentCache", JSON.stringify(cache));
  },

  async get(): Promise<CuentaPago[] | null> {
    const cached = await AsyncStorage.getItem("paymentCache");
    if (!cached) return null;

    const cache: PaymentCacheData = JSON.parse(cached);
    return cache.data;
  },

  async getVersion(): Promise<string | null> {
    const cached = await AsyncStorage.getItem("paymentCache");
    if (!cached) return null;

    const cache: PaymentCacheData = JSON.parse(cached);
    return cache.version;
  },

  async needsUpdate(serverVersion: string): Promise<boolean> {
    const cachedVersion = await this.getVersion();
    return !cachedVersion || cachedVersion !== serverVersion;
  },

  async clear() {
    await AsyncStorage.removeItem("paymentCache");
  },
};
