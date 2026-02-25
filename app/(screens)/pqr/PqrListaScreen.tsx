import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { router } from "expo-router";
import { eventBus, EVENTS } from "@/utils/eventBus";
import { PqrCard } from "@/components/pqr/PQRCard";
import { pqrService } from "@/services/pqrService";
import { useRole } from "@/hooks/useRole";
import ScreenHeader from "@/components/shared/ScreenHeader";
import { THEME } from "@/constants/theme";

type FilterType =
  | "Todos"
  | "Pendientes"
  | "En Proceso"
  | "Resueltas"
  | "Anuladas";

export default function PQRListScreen() {
  const { isAdmin } = useRole();
  const [activeFilter, setActiveFilter] = useState<FilterType>("Todos");
  const [pqrs, setPqrs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    pagina_actual: 1,
    total_paginas: 1,
    total_registros: 0,
    limite: 10,
  });
  const [loadingMore, setLoadingMore] = useState(false);

  const loadPQRsCallback = useCallback(() => {
    loadPQRs();
  }, []);

  // Cargar PQRs al montar el componente
  useEffect(() => {
    loadPQRsCallback();
  }, [loadPQRsCallback]);

  const loadPQRs = async (pagina: number = 1, append: boolean = false) => {
    try {
      if (pagina === 1) {
        setLoading(true);
        setPqrs([]);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const response = await pqrService.obtenerPQRs(pagina, 10);

      if (response.success) {
        if (append && pagina > 1) {
          setPqrs((prev) => [...prev, ...response.data]);
        } else {
          setPqrs(response.data);
        }
        if (response.pagination) {
          setPagination(response.pagination);
        }
      } else {
        setError(
          response.error ||
            "No pudimos cargar tus solicitudes. Inténtalo nuevamente."
        );
      }
    } catch (err) {
      setError(
        "Problema de conexión. Verifica tu internet e inténtalo nuevamente."
      );
      console.error("Error cargando PQRs:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMorePQRs = () => {
    if (pagination.pagina_actual < pagination.total_paginas && !loadingMore) {
      loadPQRs(pagination.pagina_actual + 1, true);
    }
  };

  const filteredPQRs = React.useMemo(() => {
    switch (activeFilter) {
      case "Pendientes":
        return pqrs.filter((pqr) => pqr.estado_pqr === "Pendiente");
      case "En Proceso":
        return pqrs.filter((pqr) => pqr.estado_pqr === "En Proceso");
      case "Resueltas":
        return pqrs.filter((pqr) => pqr.estado_pqr === "Resuelto");
      case "Anuladas":
        return pqrs.filter((pqr) => pqr.estado_pqr === "Anulado");
      default:
        return pqrs;
    }
  }, [activeFilter, pqrs]);

  const handleBackPress = useCallback(() => {
    router.back();
  }, []);

  // Escuchar eventos de actualización de PQR
  useEffect(() => {
    const handlePqrUpdate = (data: { id: number; estado: string }) => {
      setPqrs((prev) =>
        prev.map((p) =>
          p.id_pqr === data.id ? { ...p, estado_pqr: data.estado } : p
        )
      );
    };

    eventBus.on(EVENTS.PQR_UPDATED, handlePqrUpdate);

    return () => {
      eventBus.off(EVENTS.PQR_UPDATED, handlePqrUpdate);
    };
  }, []);

  const handlePQRPress = useCallback((item: any) => {
    router.push(`/(screens)/pqr/${item.id_pqr}`);
  }, []);

  const handleFilterPress = useCallback((filter: FilterType) => {
    setActiveFilter(filter);
  }, []);

  const handleRetryPress = useCallback(() => {
    loadPQRs();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title={isAdmin ? "Gestión de PQRs" : "Mis PQRs"}
        onBackPress={handleBackPress}
      />

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {(isAdmin
            ? ["Todos", "Pendientes", "En Proceso", "Resueltas", "Anuladas"]
            : ["Todos", "Pendientes", "En Proceso", "Resueltas"]
          ).map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                activeFilter === filter && styles.activeFilterButton,
              ]}
              onPress={() => handleFilterPress(filter as FilterType)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter && styles.activeFilterText,
                ]}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Contador */}
      {!loading && (
        <View style={styles.countContainer}>
          <Text style={styles.countText}>
            {activeFilter === "Todos"
              ? `${pqrs.length} de ${pagination.total_registros} ${pagination.total_registros === 1 ? "resultado" : "resultados"}`
              : `${filteredPQRs.length} ${filteredPQRs.length === 1 ? "resultado" : "resultados"} (filtrado de ${pqrs.length})`}
          </Text>
          {pagination.total_paginas > 1 && activeFilter === "Todos" && (
            <Text style={styles.paginationText}>
              Página {pagination.pagina_actual} de {pagination.total_paginas}
            </Text>
          )}
        </View>
      )}

      {/* Lista */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.centerContainer}>
            <LottieView
              source={require("@/assets/lottie/loader-purple.json")}
              autoPlay
              loop
              style={styles.lottieLoading}
            />
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons name="alert-circle" size={48} color="#EF4444" />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetryPress}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : filteredPQRs.length === 0 ? (
          <View style={styles.centerContainer}>
            <Image
              source={require("@/assets/images/Qqr.webp")}
              style={styles.emptyImage}
              resizeMode="contain"
            />
            <Text style={styles.emptyText}>No hay solicitudes</Text>
            <Text style={styles.emptySubtext}>
              {activeFilter === "Todos"
                ? isAdmin
                  ? "No hay solicitudes en el sistema"
                  : "Aún no has enviado ninguna solicitud. ¡Crea tu primera PQR!"
                : `No tienes solicitudes ${activeFilter.toLowerCase()}`}
            </Text>
          </View>
        ) : (
          <>
            {filteredPQRs.map((pqr) => (
              <PqrCard key={pqr.id_pqr} item={pqr} onPress={handlePQRPress} />
            ))}

            {/* Botón Cargar Más - Solo visible sin filtros */}
            {activeFilter === "Todos" &&
              pagination.pagina_actual < pagination.total_paginas && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={loadMorePQRs}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.loadMoreText}>Ver más solicitudes</Text>
                  )}
                </TouchableOpacity>
              )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  filtersContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  activeFilterButton: {
    backgroundColor: "#7C3AED",
    borderColor: "#7C3AED",
  },
  filterText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
  },
  activeFilterText: {
    color: "white",
  },
  countContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  countText: {
    fontSize: 14,
    color: "#64748B",
  },
  paginationText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 4,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  lottieLoading: {
    width: 200,
    height: 200,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
  },
  emptyImage: {
    width: 350,
    height: 350,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 16,
    backgroundColor: "#7C3AED",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
  },
  loadMoreButton: {
    backgroundColor: "#7C3AED",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 16,
  },
  loadMoreText: {
    color: "white",
    fontWeight: "600",
  },
});
