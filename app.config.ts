import { ExpoConfig, ConfigContext } from "expo/config";

const IS_PREVIEW = process.env.APP_VARIANT === "preview";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: IS_PREVIEW ? "SiscoApp (Preview)" : "siscoapp",
  slug: "SiscoApp",
  owner: "admysis",
  version: "1.0.0",
  orientation: "portrait",
  icon: IS_PREVIEW
    ? "./assets/images/iconAzul.png"
    : "./assets/images/iconBlanco.png",
  scheme: "siscoapp",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  jsEngine: "hermes",
  runtimeVersion: "1.0.0",

  updates: {
    url: "https://u.expo.dev/84930e65-58b2-4fcc-8c42-4b1f9346598e",
  },

  ios: {
    supportsTablet: true,
    bundleIdentifier: IS_PREVIEW
      ? "com.Admysis.SiscoApp.preview"
      : "com.Admysis.SiscoApp",
    googleServicesFile: IS_PREVIEW
      ? "./GoogleService-Info.preview.plist"
      : "./GoogleService-Info.plist",
    config: {
      usesNonExemptEncryption: false,
    },
  },

  android: {
    adaptiveIcon: {
      foregroundImage: IS_PREVIEW
        ? "./assets/images/adaptive-iconAzul.png"
        : "./assets/images/adaptive-iconBlanco.png",
      backgroundColor: IS_PREVIEW ? "#ffffff" : "#0d6cf7",
    },
    edgeToEdgeEnabled: true,
    googleServicesFile: IS_PREVIEW
      ? "./google-services.preview.json"
      : "./google-services.json",
    package: IS_PREVIEW
      ? "com.Admysis.SiscoApp.preview"
      : "com.Admysis.SiscoApp",
  },

  // web: {
  //   bundler: "metro",
  //   output: "static",
  //   favicon: "./assets/images/favicon.png",
  // },

  plugins: [
    "expo-router",
    "expo-web-browser",
    [
      "expo-notifications",
      {
        icon: "./assets/images/notification.png",
      },
    ],
    "@react-native-firebase/app",
    "@react-native-firebase/crashlytics",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        resizeMode: "contain",
        imageWidth: 190,
        backgroundColor: "#ffffff",
      },
    ],
    "./plugins/withPodfile",
    [
      "expo-build-properties",
      {
        android: {
          enableMinifyInReleaseBuilds: true,
          enableShrinkResourcesInReleaseBuilds: true,
        },
      },
    ],
  ],

  experiments: {
    typedRoutes: true,
  },

  extra: {
    router: {},
    eas: {
      projectId: "84930e65-58b2-4fcc-8c42-4b1f9346598e",
    },
  },
});
