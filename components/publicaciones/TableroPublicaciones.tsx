import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { router } from "expo-router";
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Dimensions,
} from "react-native";

import CrearPublicacionForm from "./CrearPublicacionForm";
import MisPublicaciones from "./MisPublicaciones";
import { publicacionesService } from "../../services/publicacionesService";
import { Publicacion, TipoPublicacion } from "../../types/publicaciones";
import { s3Service } from "../../services/s3Service";
import { useProject } from "../../contexts/ProjectContext";
import { THEME } from "../../constants/theme";
import ScreenHeader from "../shared/ScreenHeader";

function PublicacionImage({
  archivos,
  tipo,
  style,
}: {
  archivos: string[] | null;
  tipo: TipoPublicacion;
  style?: any;
}) {
  const { selectedProject } = useProject();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFirstImage = async () => {
      const nit = selectedProject?.nit;
      if (!archivos?.length || !nit) {
        setLoading(false);
        return;
      }

      try {
        const result = await s3Service.getPublicacionImageUrl(
          nit,
          tipo,
          archivos[0]
        );
        if (result.success && result.url) {
          setImageUrl(result.url);
        }
      } catch (error) {
        console.error("Error cargando imagen:", error);
      } finally {
        setLoading(false);
      }
    };

    loadFirstImage();
  }, [archivos, tipo, selectedProject]);

  if (loading) {
    return <View style={[style, { backgroundColor: "#E2E8F0" }]} />;
  }

  if (imageUrl) {
    return (
      <Image source={{ uri: imageUrl }} style={style} resizeMode="cover" />
    );
  }

  return null;
}

const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth >= 768;
const numColumns = isTablet ? 3 : 2;

export default function TableroPublicaciones() {
  const [tabActiva, setTabActiva] = useState<"inicio" | "mis-anuncios">(
    "inicio"
  );
  const [mostrarFormularioCrear, setMostrarFormularioCrear] = useState(false);

  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  // Cache para optimizar filtros
  const [cache, setCache] = useState<
    Record<
      string,
      {
        publicaciones: Publicacion[];
        page: number;
        hasMore: boolean;
      }
    >
  >({});

  // Ref para evitar dependencias circulares
  const cargarPublicacionesRef = useRef<
    ((nuevaPagina?: number, resetear?: boolean) => Promise<void>) | null
  >(null);

  const cargarPublicaciones = useCallback(
    async (nuevaPagina: number = 1, resetear: boolean = false) => {
      if (isLoading) return;

      const cacheKey = "todas";

      // Si es resetear y tenemos cache, usar cache
      if (resetear && cache[cacheKey]) {
        const cachedData = cache[cacheKey];
        setPublicaciones(cachedData.publicaciones);
        setPage(cachedData.page);
        setHasMore(cachedData.hasMore);
        return;
      }

      setIsLoading(true);
      try {
        const response = await publicacionesService.listarPublicaciones({
          pagina: nuevaPagina,
          limite: 12,
          filtros: {},
        });

        if (response.success && response.publicaciones) {
          let nuevasPublicaciones: Publicacion[];

          if (resetear || nuevaPagina === 1) {
            nuevasPublicaciones = response.publicaciones;
            setPublicaciones(nuevasPublicaciones);
          } else {
            setPublicaciones((prev) => {
              nuevasPublicaciones = [...prev, ...response.publicaciones];
              return nuevasPublicaciones;
            });
          }

          const newHasMore = response.hay_mas || false;
          setHasMore(newHasMore);
          setPage(nuevaPagina);

          // Actualizar cache
          setCache((prev) => ({
            ...prev,
            [cacheKey]: {
              publicaciones: nuevasPublicaciones!,
              page: nuevaPagina,
              hasMore: newHasMore,
            },
          }));
        }
      } catch (error) {
        console.error("Error cargando publicaciones:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, cache]
  );

  // Actualizar ref
  useEffect(() => {
    cargarPublicacionesRef.current = cargarPublicaciones;
  }, [cargarPublicaciones]);

  const loadMoreData = useCallback(() => {
    if (isLoading || !hasMore) return;
    cargarPublicaciones(page + 1, false);
  }, [page, isLoading, hasMore, cargarPublicaciones]);

  useEffect(() => {
    if (tabActiva === "inicio") {
      setPublicaciones([]);
      setPage(1);
      setHasMore(true);
      cargarPublicacionesRef.current?.(1, true);
    }
  }, [tabActiva]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setPublicaciones([]);
    setPage(1);
    setHasMore(true);

    const cacheKey = "todas";
    setCache((prev) => {
      const newCache = { ...prev };
      delete newCache[cacheKey];
      return newCache;
    });

    await cargarPublicaciones(1, false);
    setRefreshing(false);
  }, [cargarPublicaciones]);

  const handleEndReached = useCallback(() => {
    loadMoreData();
  }, [loadMoreData]);

  const abrirDetallePublicacion = (publicacion: Publicacion) => {
    router.push({
      pathname: "/(screens)/publicaciones/PublicacionDetalleScreen",
      params: { publicacion: JSON.stringify(publicacion) },
    });
  };

  const getCardHeight = (index: number) => {
    const heights = [280, 200, 240, 220, 260, 180];
    return heights[index % heights.length];
  };

  const renderPublicacionCard = (
    publicacion: Publicacion,
    keyId: number,
    columnId: string
  ) => {
    const cardHeight = getCardHeight(keyId);

    return (
      <TouchableOpacity
        key={`${columnId}-${publicacion.id}-${keyId}`}
        style={[styles.masonryCard, { height: cardHeight }]}
        onPress={() => abrirDetallePublicacion(publicacion)}
        activeOpacity={0.9}
      >
        {publicacion.archivos_nombres?.length ? (
          <PublicacionImage
            archivos={publicacion.archivos_nombres}
            tipo={publicacion.tipo}
            style={styles.masonryImage}
          />
        ) : (
          <View style={styles.masonryNoImage}>
            {publicacion.tipo === "productos" ? (
              <MaterialIcons name="emoji-objects" size={28} color="#9CA3AF" />
            ) : (
              <Ionicons
                name={publicacion.tipo === "servicios" ? "construct" : "home"}
                size={28}
                color="#9CA3AF"
              />
            )}
          </View>
        )}

        <View style={styles.masonryContent}>
          <Text style={styles.masonryTitle} numberOfLines={2}>
            {publicacion.titulo || "Sin título"}
          </Text>
          {publicacion.precio > 0 && (
            <Text style={styles.masonryPrice}>
              $
              {publicacion.precio
                .toString()
                .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
            </Text>
          )}
          {publicacion.negociable ? (
            <Text style={styles.masonryNegotiable}>Negociable</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  if (mostrarFormularioCrear) {
    return (
      <CrearPublicacionForm
        onClose={async () => {
          setMostrarFormularioCrear(false);
          setCache({});
          setPublicaciones([]);
          setPage(1);
          await cargarPublicaciones(1, false);
        }}
      />
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View style={styles.container}>
        <ScreenHeader title="Comunidad" onBackPress={() => router.back()} />

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, tabActiva === "inicio" && styles.tabActive]}
            onPress={() => setTabActiva("inicio")}
          >
            <Ionicons
              name="home"
              size={20}
              color={
                tabActiva === "inicio"
                  ? THEME.colors.primary
                  : THEME.colors.text.secondary
              }
            />
            <Text
              style={[
                styles.tabText,
                tabActiva === "inicio" && styles.tabTextActive,
              ]}
            >
              Inicio
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              tabActiva === "mis-anuncios" && styles.tabActive,
            ]}
            onPress={() => setTabActiva("mis-anuncios")}
          >
            <Ionicons
              name="list"
              size={20}
              color={
                tabActiva === "mis-anuncios"
                  ? THEME.colors.primary
                  : THEME.colors.text.secondary
              }
            />
            <Text
              style={[
                styles.tabText,
                tabActiva === "mis-anuncios" && styles.tabTextActive,
              ]}
            >
              Mis Anuncios
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contenido según tab activa */}
        {tabActiva === "inicio" ? (
          <ScrollView
            style={styles.mainScrollView}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#013973"
              />
            }
            showsVerticalScrollIndicator={false}
            onScroll={({ nativeEvent }) => {
              const { layoutMeasurement, contentOffset, contentSize } =
                nativeEvent;
              const paddingToBottom = 50;
              if (
                !isLoading &&
                hasMore &&
                layoutMeasurement.height + contentOffset.y >=
                  contentSize.height - paddingToBottom
              ) {
                handleEndReached();
              }
            }}
            scrollEventThrottle={16}
          >
            {/* Empty State */}
            {!isLoading && publicaciones.length === 0 && (
              <View style={styles.emptyContainer}>
                <Image
                  source={require("@/assets/images/Publicaciones.webp")}
                  style={styles.emptyImage}
                  resizeMode="contain"
                />
                <Text style={styles.emptyTitle}>No hay publicaciones</Text>
                <Text style={styles.emptyDescription}>
                  Sé el primero en publicar algo
                </Text>
              </View>
            )}

            {/* Feed */}
            <View style={styles.feedGrid}>
              {Array.from({ length: numColumns }, (_, columnIndex) => (
                <View key={columnIndex} style={styles.masonryColumn}>
                  {publicaciones
                    .filter((_, index) => index % numColumns === columnIndex)
                    .map((publicacion, mapIndex) =>
                      renderPublicacionCard(
                        publicacion,
                        mapIndex,
                        `column-${columnIndex}`
                      )
                    )}
                  {/* Loading skeletons */}
                  {isLoading && (
                    <View
                      style={[
                        styles.skeletonCard,
                        { height: 200 + columnIndex * 40 },
                      ]}
                    >
                      <View style={styles.skeletonImage} />
                      <View style={styles.skeletonContent}>
                        <View style={styles.skeletonTitle} />
                        <View style={styles.skeletonPrice} />
                      </View>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </ScrollView>
        ) : (
          <MisPublicaciones />
        )}

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setMostrarFormularioCrear(true)}
        >
          <Ionicons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  searchButton: {
    padding: 8,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {
    borderBottomColor: THEME.colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: "500",
    color: THEME.colors.text.secondary,
  },
  tabTextActive: {
    fontSize: 15,
    fontWeight: "600",
    color: THEME.colors.primary,
  },
  mainScrollView: {
    flex: 1,
  },
  feedGrid: {
    flexDirection: "row",
    paddingHorizontal: screenWidth * 0.02,
    paddingTop: 8,
    paddingBottom: 100,
  },
  masonryColumn: {
    flex: 1,
    paddingHorizontal: screenWidth * 0.01,
  },
  masonryCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  masonryImage: {
    width: "100%",
    flex: 1,
  },
  masonryNoImage: {
    width: "100%",
    flex: 1,
    backgroundColor: THEME.colors.input.background,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 100,
  },
  masonryContent: {
    padding: 12,
  },
  masonryTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.text.heading,
    marginBottom: 6,
    lineHeight: 18,
  },
  masonryPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.colors.primary,
    marginBottom: 4,
  },
  masonryNegotiable: {
    fontSize: 11,
    color: THEME.colors.success,
    fontWeight: "500",
  },

  skeletonCard: {
    backgroundColor: THEME.colors.surfaceLight,
    borderRadius: 12,
    marginBottom: 8,
    overflow: "hidden",
  },
  skeletonImage: {
    flex: 1,
    backgroundColor: THEME.colors.border,
  },
  skeletonContent: {
    padding: 12,
  },
  skeletonTitle: {
    height: 16,
    backgroundColor: THEME.colors.border,
    borderRadius: 4,
    marginBottom: 8,
    width: "80%",
  },
  skeletonPrice: {
    height: 14,
    backgroundColor: THEME.colors.border,
    borderRadius: 4,
    width: "60%",
  },

  fab: {
    position: "absolute",
    bottom: screenWidth * 0.25,
    right: screenWidth * 0.06,
    width: isTablet ? 64 : 56,
    height: isTablet ? 64 : 56,
    borderRadius: isTablet ? 32 : 28,
    backgroundColor: THEME.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 32,
  },
  emptyImage: {
    width: 400,
    height: 400,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
  },
  emptyDescription: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
  },
});
