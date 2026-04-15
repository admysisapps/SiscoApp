import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect, useCallback, useRef, memo } from "react";
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
import type { StyleProp, ImageStyle, ViewStyle } from "react-native";

import CrearPublicacionForm from "./CrearPublicacionForm";
import MisPublicaciones from "./MisPublicaciones";
import { publicacionesService } from "@/services/publicacionesService";
import { Publicacion, TipoPublicacion } from "@/types/publicaciones";
import { s3Service } from "@/services/s3Service";
import { useProject } from "@/contexts/ProjectContext";
import { THEME } from "@/constants/theme";
import ScreenHeader from "@/components/shared/ScreenHeader";
import { eventBus, EVENTS } from "@/utils/eventBus";

const PublicacionImage = memo(function PublicacionImage({
  archivos,
  tipo,
  style,
}: {
  archivos: string[] | null;
  tipo: TipoPublicacion;
  style?: StyleProp<ImageStyle> & StyleProp<ViewStyle>;
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
});

interface PublicacionCardProps {
  publicacion: Publicacion;
  cardHeight: number;
  onPress: (publicacion: Publicacion) => void;
}

const PublicacionCard = memo(function PublicacionCard({
  publicacion,
  cardHeight,
  onPress,
}: PublicacionCardProps) {
  return (
    <TouchableOpacity
      style={[styles.masonryCard, { height: cardHeight }]}
      onPress={() => onPress(publicacion)}
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
          <Ionicons
            name={
              publicacion.tipo === "productos"
                ? "bag-handle"
                : publicacion.tipo === "servicios"
                  ? "construct"
                  : "home"
            }
            size={28}
            color="#9CA3AF"
          />
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
});

const { width: screenWidth } = Dimensions.get("window");
const isTablet = screenWidth >= 768;
const numColumns = isTablet ? 3 : 2;

export default function TableroPublicaciones() {
  const [tabActiva, setTabActiva] = useState<"anuncios" | "mis-anuncios">(
    "anuncios"
  );
  const [mostrarFormularioCrear, setMostrarFormularioCrear] = useState(false);

  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const isLoadingRef = useRef(false);

  const cargarPublicaciones = useCallback(async (nuevaPagina: number = 1) => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      const response = await publicacionesService.listarPublicaciones({
        pagina: nuevaPagina,
        limite: 12,
        filtros: {},
      });

      const incoming = response.publicaciones;
      if (nuevaPagina === 1) {
        setPublicaciones(incoming);
      } else {
        setPublicaciones((prev) => [...prev, ...incoming]);
      }
      setHasMore(response.hay_mas);
      setPage(nuevaPagina);
    } catch (error) {
      console.error("[TableroPublicaciones] error en fetch:", error);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const handlePublicacionUpdated = ({ id }: { id: number }) => {
      setPublicaciones((prev) => prev.filter((p) => p.id !== id));
    };

    eventBus.on(EVENTS.PUBLICACION_REMOVED_FROM_FEED, handlePublicacionUpdated);
    return () => {
      eventBus.off(
        EVENTS.PUBLICACION_REMOVED_FROM_FEED,
        handlePublicacionUpdated
      );
    };
  }, []);

  const loadMoreData = useCallback(() => {
    if (isLoadingRef.current || !hasMore) return;
    cargarPublicaciones(page + 1);
  }, [page, hasMore, cargarPublicaciones]);

  useEffect(() => {
    cargarPublicaciones(1);
  }, [cargarPublicaciones]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setPublicaciones([]);
    setPage(1);
    setHasMore(true);
    await cargarPublicaciones(1);
    setRefreshing(false);
  }, [cargarPublicaciones]);

  const abrirDetallePublicacion = useCallback((publicacion: Publicacion) => {
    router.push({
      pathname: "/(screens)/publicaciones/PublicacionDetalleScreen",
      params: { publicacion: JSON.stringify(publicacion) },
    });
  }, []);

  const getCardHeight = useCallback((index: number) => {
    const heights = [280, 200, 240, 220, 260, 180];
    return heights[index % heights.length];
  }, []);

  if (mostrarFormularioCrear) {
    return (
      <CrearPublicacionForm
        onClose={async () => {
          setMostrarFormularioCrear(false);
          setPublicaciones([]);
          setPage(1);
          await cargarPublicaciones(1);
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
            style={[styles.tab, tabActiva === "anuncios" && styles.tabActive]}
            onPress={() => setTabActiva("anuncios")}
          >
            <Ionicons
              name="storefront-outline"
              size={20}
              color={
                tabActiva === "anuncios"
                  ? THEME.colors.primary
                  : THEME.colors.text.secondary
              }
            />
            <Text
              style={[
                styles.tabText,
                tabActiva === "anuncios" && styles.tabTextActive,
              ]}
            >
              Anuncios
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
              name="receipt-outline"
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
        {tabActiva === "anuncios" ? (
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
                loadMoreData();
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
                    .map((publicacion, mapIndex) => (
                      <PublicacionCard
                        key={`col-${columnIndex}-${publicacion.id}`}
                        publicacion={publicacion}
                        cardHeight={getCardHeight(mapIndex)}
                        onPress={abrirDetallePublicacion}
                      />
                    ))}
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
