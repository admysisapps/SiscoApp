import React, { useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { Button } from "@/components/reacticx/button";
import AvisoItem from "./AvisoItem";
import { Aviso } from "@/types/Avisos";
import { useAvisos } from "@/hooks/useAvisos";

interface AvisosListProps {
  showToast?: (message: string, type: "success" | "error" | "warning") => void;
  isAdmin?: boolean;
}

export default function AvisosList({
  showToast,
  isAdmin = false,
}: AvisosListProps) {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useAvisos(10);
  const [visibleAvisos, setVisibleAvisos] = React.useState<Set<number>>(
    new Set()
  );

  const avisos = data?.pages.flatMap((page) => page.avisos) || [];

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
    if (!hasNextPage) return null;

    return (
      <View style={styles.footerContainer}>
        <Button
          onPress={() => fetchNextPage()}
          isLoading={isFetchingNextPage}
          loadingText="Cargando..."
          gradientColors={["#013973", "#0095ff", "#0080e6"]}
          loadingTextBackgroundColor="transparent"
          fullWidth
          height={48}
          disabled={isFetchingNextPage}
        >
          <Text style={styles.loadMoreText}>Ver más comunicados</Text>
          <Ionicons name="chevron-down" size={20} color="white" />
        </Button>
      </View>
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
          <RefreshControl refreshing={false} onRefresh={refetch} />
        }
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          isLoading ? styles.loadingContent : styles.flatListContent
        }
        ListEmptyComponent={
          isLoading ? (
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
  footerContainer: {
    marginVertical: 20,
    paddingHorizontal: 16,
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
