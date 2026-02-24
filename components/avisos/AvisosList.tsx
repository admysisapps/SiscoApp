import React, { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { avisosService } from "@/services/avisoService";
import { useFocusEffect } from "@react-navigation/native";
import AvisoItem from "./AvisoItem";
import { Aviso } from "@/types/Avisos";

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
    ({ item: aviso }: { item: Aviso }) => (
      <AvisoItem aviso={aviso} isVisible={visibleAvisos.has(aviso.id)} />
    ),
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
        keyExtractor={(item) => `${item.id}-${item.fecha_creacion}`}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        initialNumToRender={5}
        windowSize={10}
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
              <Image
                source={require("@/assets/images/Comunicados.webp")}
                style={styles.emptyImage}
                resizeMode="contain"
              />
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
    marginTop: 8,
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
});
