import * as SecureStore from "expo-secure-store";

const DEVICE_ID_KEY = "sisco_device_uuid";

// Generar UUID v4 sin dependencias externas
const generateUUID = (): string => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const getOrCreateDeviceId = async (): Promise<string> => {
  try {
    let deviceId = await SecureStore.getItemAsync(DEVICE_ID_KEY);

    if (!deviceId) {
      deviceId = generateUUID();
      await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
    }

    return deviceId;
  } catch (error) {
    console.error("Error gestionando device ID:", error);
    return generateUUID(); // Fallback temporal si SecureStore falla
  }
};
