import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";
import * as WebBrowser from "expo-web-browser";
import { s3Service } from "@/services/s3Service";
import { useProject } from "@/contexts/ProjectContext";
import { ImageGallery } from "../shared/ImageGallery";

interface AvisoFilesProps {
  avisoId: number;
  archivos_nombres?: string;
  isVisible: boolean;
}

const ImageSkeleton = ({ height }: { height: number }) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(1, { duration: 1000, easing: Easing.ease }),
      -1,
      true
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.imageSkeleton, { height }, animatedStyle]} />
  );
};

export const AvisoFiles = ({
  avisoId,
  archivos_nombres,
  isVisible,
}: AvisoFilesProps) => {
  const [fileUrls, setFileUrls] = useState<{ [key: string]: string }>({});
  const [loadingFiles, setLoadingFiles] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const { selectedProject } = useProject();

  const handleImageLoad = useCallback((url: string) => {
    setLoadedImages((prev) => new Set([...prev, url]));
  }, []);

  const loadFileUrl = useCallback(
    async (fileName: string): Promise<string | null> => {
      if (!selectedProject?.nit) return null;

      // Si ya está cargado, retornarlo
      if (fileUrls[fileName]) return fileUrls[fileName];

      // Si ya está cargando, esperar
      if (loadingFiles[fileName]) return null;

      setLoadingFiles((prev) => ({ ...prev, [fileName]: true }));

      try {
        const result = await s3Service.getAvisoFileUrl(
          selectedProject.nit,
          fileName
        );
        if (result.success && result.url) {
          setFileUrls((prev) => ({ ...prev, [fileName]: result.url }));
          return result.url;
        }
      } catch (error) {
        console.error(
          `AvisoFiles ${avisoId}: Error loading file ${fileName}:`,
          error
        );
      } finally {
        setLoadingFiles((prev) => ({ ...prev, [fileName]: false }));
      }

      return null;
    },
    [selectedProject?.nit, fileUrls, loadingFiles, avisoId]
  );

  // Auto-cargar imágenes cuando el componente se hace visible REALMENTE
  useEffect(() => {
    if (isVisible && archivos_nombres && selectedProject?.nit) {
      let fileNames: string[] = [];
      try {
        fileNames = JSON.parse(archivos_nombres);
        if (!Array.isArray(fileNames)) fileNames = [];
      } catch {
        fileNames = [];
      }

      // Solo cargar imágenes automáticamente
      fileNames.forEach((fileName: string) => {
        if (typeof fileName === "string") {
          const isImage = fileName.match(/\.(jpg|jpeg|png|gif)$/i);
          if (isImage) {
            loadFileUrl(fileName);
          }
        }
      });
    }
  }, [isVisible, archivos_nombres, selectedProject?.nit, loadFileUrl, avisoId]);

  if (!archivos_nombres) return null;

  // Manejo seguro de JSON.parse
  let fileNames: string[] = [];
  try {
    fileNames = JSON.parse(archivos_nombres);
    if (!Array.isArray(fileNames)) fileNames = [];
  } catch {
    fileNames = [];
  }

  const imageUrls: string[] = [];
  const documents: { fileName: string; url?: string; isLoading: boolean }[] =
    [];

  // Separar imágenes y documentos con validación de tipo
  fileNames.forEach((fileName: string) => {
    if (typeof fileName === "string") {
      const isImage = fileName.match(/\.(jpg|jpeg|png|gif)$/i);
      const url = fileUrls[fileName];
      const isLoading = loadingFiles[fileName];

      if (isImage) {
        if (url) {
          imageUrls.push(url);
        }
      } else {
        documents.push({ fileName, url, isLoading });
      }
    }
  });

  // Contar cuántas imágenes hay en total
  const totalImages = fileNames.filter(
    (fileName: string) =>
      typeof fileName === "string" && fileName.match(/\.(jpg|jpeg|png|gif)$/i)
  ).length;

  const loadingImages = totalImages - loadedImages.size;

  const getSkeletonHeight = () => {
    return totalImages === 1 ? 250 : 200;
  };

  return (
    <View style={styles.filesContainer}>
      {/* Skeleton mientras cargan imágenes */}
      {loadingImages > 0 && (
        <View
          style={[
            styles.skeletonContainer,
            { height: getSkeletonHeight() + 20 },
          ]}
        >
          {totalImages === 2 ? (
            <View style={{ flexDirection: "row", gap: 3 }}>
              {Array.from({ length: loadingImages }).map((_, index) => (
                <View key={`skeleton-${index}`} style={{ flex: 1 }}>
                  <ImageSkeleton height={getSkeletonHeight()} />
                </View>
              ))}
            </View>
          ) : (
            <ImageSkeleton height={getSkeletonHeight()} />
          )}
        </View>
      )}

      {/* Galería de imágenes adaptable - se superpone al skeleton */}
      {imageUrls.length > 0 && (
        <View style={loadingImages > 0 ? styles.imageOverlay : undefined}>
          <ImageGallery images={imageUrls} onImageLoad={handleImageLoad} />
        </View>
      )}

      {/* Documentos */}
      {documents.map((doc, index) => (
        <TouchableOpacity
          key={index}
          style={styles.documentContainer}
          onPress={async () => {
            if (doc.url) {
              await WebBrowser.openBrowserAsync(doc.url, {
                presentationStyle:
                  WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
                controlsColor: THEME.colors.primary,
                toolbarColor: THEME.colors.primary,
              });
            } else {
              const loadedUrl = await loadFileUrl(doc.fileName);
              if (loadedUrl) {
                await WebBrowser.openBrowserAsync(loadedUrl, {
                  presentationStyle:
                    WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
                  controlsColor: THEME.colors.primary,
                  toolbarColor: THEME.colors.primary,
                });
              }
            }
          }}
        >
          <Ionicons name="document" size={20} color="#6B7280" />
          <Text style={styles.documentName} numberOfLines={1}>
            {doc.fileName.split("_")[1] || doc.fileName}
          </Text>
          {doc.isLoading && (
            <ActivityIndicator size="small" color={THEME.colors.primary} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  filesContainer: {
    marginTop: 0,
  },
  skeletonContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
    marginTop: 8,
  },
  imageSkeleton: {
    width: "100%",
    backgroundColor: "#E2E8F0",
    borderRadius: 10,
  },
  imageOverlay: {
    position: "absolute",
    top: 8,
    left: 0,
    right: 0,
  },
  documentContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    padding: 14,
    borderRadius: 10,
    marginHorizontal: 16,
    marginBottom: 8,
    marginTop: 8,
  },
  documentName: {
    marginLeft: 10,
    fontSize: 14,
    color: "#374151",
    flex: 1,
  },
});
