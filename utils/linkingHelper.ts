// utils/linkingHelper.ts
import * as WebBrowser from "expo-web-browser";
import { THEME } from "@/constants/theme";

const isValidURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const openURL = async (
  url: string,
  onError?: (message: string) => void
): Promise<void> => {
  if (!isValidURL(url)) {
    onError?.("El enlace no es válido");
    return;
  }

  try {
    await WebBrowser.openBrowserAsync(url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      controlsColor: THEME.colors.primary,
      toolbarColor: THEME.colors.primary,
      showTitle: true,
    });
  } catch {
    onError?.("No se pudo abrir el enlace");
  }
};
