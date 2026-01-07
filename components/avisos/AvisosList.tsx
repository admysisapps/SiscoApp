import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { THEME } from "@/constants/theme";
import { avisosService } from "@/services/avisoService";
import { useFocusEffect } from "@react-navigation/native";
import { AvisoFiles } from "./AvisoFiles";
import { Aviso } from "@/types/Avisos";
import {
  getAvisoIcon,
  getAvisoColor,
  formatEventDate,
  formatRelativeTime,
} from "@/utils/avisoUtils";

interface AvisosListProps {
  showToast?: (message: string, type: "success" | "error" | "warning") => void;
  isAdmin?: boolean;
}

export default function AvisosList({
  showToast,
  isAdmin = false,
}: AvisosListProps) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [visibleAvisos, setVisibleAvisos] = useState<Set<number>>(new Set());

  const cargarAvisos = useCallback(
    async (paginaActual = 1, esRefresh = false) => {
      try {
        if (esRefresh) {
          setRefreshing(true);
        } else if (paginaActual === 1) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const response = await avisosService.obtenerAvisos(paginaActual, 10);

        if (response.success) {
          const nuevosAvisos = response.avisos || [];

          if (esRefresh || paginaActual === 1) {
            setAvisos(nuevosAvisos);
          } else {
            setAvisos((prev) => [...prev, ...nuevosAvisos]);
          }

          setPagina(paginaActual);
          setHasMore(paginaActual < (response.total_paginas || 1));
        }
      } catch (error) {
        console.error("Error cargando comunicados:", error);
        if (showToast) {
          showToast("Error al cargar comunicados", "error");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    },
    [showToast]
  );

  useFocusEffect(
    useCallback(() => {
      cargarAvisos();
    }, [cargarAvisos])
  );

  const onRefresh = () => {
    setPagina(1);
    setHasMore(true);
    cargarAvisos(1, true);
  };

  const cargarMas = () => {
    if (hasMore && !loadingMore) {
      cargarAvisos(pagina + 1);
    }
  };

  // Lazy loading real - detectar avisos visibles
  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    const newVisibleIds = new Set<number>();
    viewableItems.forEach((item: any) => {
      newVisibleIds.add(item.item.id);
    });
    setVisibleAvisos(newVisibleIds);
  }).current;

  const viewabilityConfig = {
    itemVisiblePercentThreshold: 30,
  };

  const renderAvisoItem = useCallback(
    ({ item: aviso }: { item: Aviso }) => {
      const isVisible = visibleAvisos.has(aviso.id);

      return (
        <View style={styles.avisoPost}>
          {/* Header del post estilo social media */}
          <View style={styles.postHeader}>
            <View
              style={[
                styles.avatarContainer,
                { backgroundColor: `${getAvisoColor(aviso.prioridad)}15` },
              ]}
            >
              <Ionicons
                name={
                  getAvisoIcon(aviso.tipo) as keyof typeof Ionicons.glyphMap
                }
                size={20}
                color={getAvisoColor(aviso.prioridad)}
              />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.publisherName}>Administración</Text>
              <Text style={styles.timestamp}>
                {formatRelativeTime(aviso.fecha_creacion)}
              </Text>
            </View>
          </View>

          {/* Archivos e imágenes - aparecen primero si hay solo una imagen */}
          {(() => {
            let fileNames: string[] = [];
            try {
              fileNames = aviso.archivos_nombres
                ? JSON.parse(aviso.archivos_nombres)
                : [];
              if (!Array.isArray(fileNames)) fileNames = [];
            } catch {
              fileNames = [];
            }

            const imageFiles = fileNames.filter(
              (fileName: string) =>
                typeof fileName === "string" &&
                fileName.match(/\.(jpg|jpeg|png|gif)$/i)
            );

            // Si hay solo una imagen, mostrarla arriba del texto
            if (imageFiles.length === 1 && fileNames.length === 1) {
              return (
                <AvisoFiles
                  avisoId={aviso.id}
                  archivos_nombres={aviso.archivos_nombres}
                  isVisible={isVisible}
                />
              );
            }

            return null;
          })()}

          {/* Contenido del post */}
          <View style={styles.postContent}>
            <Text style={styles.postTitle}>{aviso.titulo}</Text>
            <Text style={styles.postDescription}>{aviso.descripcion}</Text>
          </View>

          {/* Archivos e imágenes - aparecen abajo si hay múltiples archivos O 1 documento */}
          {(() => {
            let fileNames: string[] = [];
            try {
              fileNames = aviso.archivos_nombres
                ? JSON.parse(aviso.archivos_nombres)
                : [];
              if (!Array.isArray(fileNames)) fileNames = [];
            } catch {
              fileNames = [];
            }

            const imageFiles = fileNames.filter(
              (fileName: string) =>
                typeof fileName === "string" &&
                fileName.match(/\.(jpg|jpeg|png|gif)$/i)
            );

            // Mostrar si: hay múltiples archivos O hay 1 archivo que NO es imagen
            if (
              fileNames.length > 1 ||
              (fileNames.length === 1 && imageFiles.length === 0)
            ) {
              return (
                <AvisoFiles
                  avisoId={aviso.id}
                  archivos_nombres={aviso.archivos_nombres}
                  isVisible={isVisible}
                />
              );
            }

            return null;
          })()}

          {/* Información de evento programado */}
          {aviso.fecha_evento && (
            <View style={styles.eventInfo}>
              <Ionicons
                name="calendar"
                size={16}
                color={THEME.colors.primary}
              />
              <Text style={styles.eventText}>
                Programado para: {formatEventDate(aviso.fecha_evento)}
              </Text>
            </View>
          )}
        </View>
      );
    },
    [visibleAvisos]
  );

  const renderFooter = () => {
    if (loading || loadingMore || refreshing || !hasMore) return null;

    return (
      <TouchableOpacity onPress={cargarMas} disabled={loadingMore}>
        <LinearGradient
          colors={["#013973", "#0095ff", "#0080e6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.loadMoreButton}
        >
          {loadingMore ? (
            <>
              <ActivityIndicator size="small" color="white" />
              <Text style={styles.loadMoreText}>Cargando...</Text>
            </>
          ) : (
            <>
              <Text style={styles.loadMoreText}>Ver más comunicados</Text>
              <Ionicons name="chevron-down" size={20} color="white" />
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={avisos}
        renderItem={renderAvisoItem}
        keyExtractor={(item) => item.id.toString()}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          loading ? styles.loadingContent : styles.flatListContent
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.centerContainer}>
              <LottieView
                source={require("@/assets/lottie/loader-info.json")}
                autoPlay
                loop
                style={styles.lottieLoading}
              />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="megaphone-outline" size={80} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No hay comunicados</Text>
              <Text style={styles.emptyDescription}>
                Aún no se han publicado comunicados
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  loadingContent: {
    flex: 1,
  },
  centerContainer: {
    alignItems: "center",
    padding: 32,
  },
  lottieLoading: {
    width: 200,
    height: 200,
  },
  flatListContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  avisoPost: {
    backgroundColor: "white",
    borderRadius: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  publisherName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: "#64748B",
  },
  postContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
    lineHeight: 24,
  },
  postDescription: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  eventInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    gap: 8,
  },
  eventText: {
    fontSize: 13,
    color: THEME.colors.primary,
    fontWeight: "500",
  },
  loadMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginVertical: 20,
    gap: 8,
  },
  loadMoreText: {
    color: "white",
    fontSize: 15,
    fontWeight: "600",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 15,
    color: "#94A3B8",
    textAlign: "center",
  },
});
