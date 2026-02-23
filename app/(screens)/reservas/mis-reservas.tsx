import React, {
  useState,
  useMemo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Animated,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { eventBus, EVENTS } from "@/utils/eventBus";
import { reservaService } from "@/services/reservaService";
import { EstadoReserva } from "@/types/Reserva";
import { useRole } from "@/hooks/useRole";
import { THEME } from "@/constants/theme";
import CancelReservationModal from "@/components/reservas/CancelReservationModal";
import ReservaCardPropietario from "@/components/reservas/ReservaCardPropietario";
import ReservaCardAdmin from "@/components/reservas/ReservaCardAdmin";

// Constantes
const PAGINATION_LIMIT = 10;

type FilterType = "Todas" | EstadoReserva;

const FILTERS: FilterType[] = [
  "Todas",
  "Pendiente",
  "Confirmada",
  "Cancelada",
  "Rechazada",
];

interface ReservaItem {
  id: number;
  fecha_reserva: string;
  hora_inicio: string;
  hora_fin: string;
  estado: EstadoReserva;
  precio_total: number;
  motivo?: string;
  espacio_nombre: string;
  usuario_nombre?: string;
  apartamento_codigo?: string;
}

const MESES_NOMBRES = [
  "",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default function MisReservasScreen() {
  const { isAdmin } = useRole();
  const insets = useSafeAreaInsets();

  // Estados de mes/año

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [activeFilter, setActiveFilter] = useState<FilterType>("Todas");
  const [reservas, setReservas] = useState<ReservaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    pagina_actual: 1,
    total_paginas: 1,
    total_registros: 0,
    limite: PAGINATION_LIMIT,
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedReserva, setSelectedReserva] = useState<ReservaItem | null>(
    null
  );
  const [cancelando, setCancelando] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;

  const cargarReservasCallback = useCallback(
    async (
      pagina: number = 1,
      append: boolean = false,
      isRefresh: boolean = false
    ) => {
      try {
        if (pagina === 1) {
          if (isRefresh) {
            setRefreshing(true);
          } else {
            setLoading(true);
          }
          setReservas([]);
        } else {
          setLoadingMore(true);
        }
        setError(null);

        const response = await reservaService.listarReservas({
          mes: selectedMonth,
          anio: selectedYear,
          pagina,
          limite: PAGINATION_LIMIT,
        });

        if (response?.success) {
          const nuevasReservas = response.reservas || [];

          if (append && pagina > 1) {
            setReservas((prev) => [...prev, ...nuevasReservas]);
          } else {
            setReservas(nuevasReservas);
          }

          setPagination({
            pagina_actual: response.pagina_actual || 1,
            total_paginas: response.total_paginas || 1,
            total_registros: response.total_registros || 0,
            limite: PAGINATION_LIMIT,
          });
        } else {
          setError("No pudimos cargar tus reservas. Inténtalo nuevamente.");
        }
      } catch (err) {
        setError(
          "Problema de conexión. Verifica tu internet e inténtalo nuevamente."
        );
        console.error("Error cargando reservas:", err);
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    [selectedMonth, selectedYear]
  );

  useEffect(() => {
    cargarReservasCallback();
  }, [cargarReservasCallback]);

  const cargarMasReservas = useCallback(() => {
    if (pagination.pagina_actual < pagination.total_paginas && !loadingMore) {
      cargarReservasCallback(pagination.pagina_actual + 1, true);
    }
  }, [
    pagination.pagina_actual,
    pagination.total_paginas,
    loadingMore,
    cargarReservasCallback,
  ]);

  const onRefresh = useCallback(async () => {
    await cargarReservasCallback(1, false, true);
  }, [cargarReservasCallback]);

  const handleFilterPress = useCallback((filter: FilterType) => {
    setActiveFilter(filter);
  }, []);

  const filteredReservas = useMemo(() => {
    if (activeFilter === "Todas") return reservas;
    return reservas.filter((reserva) => reserva.estado === activeFilter);
  }, [activeFilter, reservas]);

  useEffect(() => {
    const handleReservaUpdate = (data: { id: number; estado: string }) => {
      setReservas((prev) =>
        prev.map((r) =>
          r.id === data.id ? { ...r, estado: data.estado as EstadoReserva } : r
        )
      );
    };

    eventBus.on(EVENTS.RESERVA_UPDATED, handleReservaUpdate);

    return () => {
      eventBus.off(EVENTS.RESERVA_UPDATED, handleReservaUpdate);
    };
  }, []);

  const handleReservaPress = useCallback(
    (reserva: ReservaItem) => {
      if (isAdmin) {
        router.push(`/(screens)/reservas/admin/${reserva.id}`);
      } else {
        router.push(`/(screens)/reservas/${reserva.id}`);
      }
    },
    [isAdmin]
  );

  const handleCancelarReserva = useCallback(
    (reserva: ReservaItem, event: any) => {
      event.stopPropagation();

      if (reserva.estado === "Pendiente" || reserva.estado === "Confirmada") {
        setSelectedReserva(reserva);
        setShowCancelModal(true);
      }
    },
    []
  );

  const handleConfirmarCancelacion = async (motivoCancelacion: string) => {
    if (!selectedReserva) return;

    try {
      setCancelando(true);
      const response = await reservaService.cancelarReserva(
        selectedReserva.id,
        motivoCancelacion
      );

      if (response?.success) {
        setReservas((prev) =>
          prev.map((r) =>
            r.id === selectedReserva.id ? { ...r, estado: "Cancelada" } : r
          )
        );
        setShowCancelModal(false);
        setSelectedReserva(null);
      }
    } catch (error) {
      console.error("Error cancelando reserva:", error);
    } finally {
      setCancelando(false);
    }
  };

  // Navegación de meses
  const previousMonth = useCallback(() => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  }, [selectedMonth, selectedYear]);

  const nextMonth = useCallback(() => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  }, [selectedMonth, selectedYear]);

  const handleBackPress = useCallback(() => {
    router.back();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={THEME.colors.header.title}
          />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isAdmin ? "Gestión de Reservas" : "Mis Reservas"}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Selector de Mes y Filtros Unificados */}
      <Animated.View
        style={[
          styles.controlsContainer,
          {
            top: 76 + insets.top,
            opacity: scrollY.interpolate({
              inputRange: [0, 100],
              outputRange: [1, 0],
              extrapolate: "clamp",
            }),
            transform: [
              {
                translateY: scrollY.interpolate({
                  inputRange: [0, 100],
                  outputRange: [0, -50],
                  extrapolate: "clamp",
                }),
              },
            ],
          },
        ]}
      >
        {/* Selector de Mes */}
        <View style={styles.monthSelector}>
          <TouchableOpacity style={styles.monthButton} onPress={previousMonth}>
            <Ionicons
              name="chevron-back"
              size={20}
              color={THEME.colors.success}
            />
          </TouchableOpacity>

          <View style={styles.monthInfo}>
            <Text style={styles.monthTitle}>
              {MESES_NOMBRES[selectedMonth]} {selectedYear}
            </Text>
          </View>

          <TouchableOpacity style={styles.monthButton} onPress={nextMonth}>
            <Ionicons
              name="chevron-forward"
              size={20}
              color={THEME.colors.success}
            />
          </TouchableOpacity>
        </View>

        {/* Filtros */}
        <View style={styles.filtersSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterButton,
                  activeFilter === filter && styles.activeFilterButton,
                ]}
                onPress={() => handleFilterPress(filter)}
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
      </Animated.View>

      {/* Lista de Reservas */}
      <Animated.ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 150 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[THEME.colors.success]}
            tintColor={THEME.colors.success}
          />
        }
      >
        {loading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={THEME.colors.success} />
            <Text style={styles.loadingText}>Cargando reservas...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Ionicons
              name="alert-circle"
              size={48}
              color={THEME.colors.error}
            />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => cargarReservasCallback()}
            >
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : filteredReservas.length === 0 && !refreshing ? (
          <View style={styles.centerContainer}>
            <Ionicons
              name="calendar-outline"
              size={48}
              color={THEME.colors.text.secondary}
            />
            <Text style={styles.emptyText}>No hay reservas</Text>
            <Text style={styles.emptySubtext}>
              {activeFilter === "Todas"
                ? isAdmin
                  ? "No hay reservas en el sistema"
                  : "Aún no has hecho ninguna reserva. ¡Crea tu primera reserva!"
                : `No tienes reservas ${activeFilter.toLowerCase()}`}
            </Text>
          </View>
        ) : (
          <>
            {filteredReservas.map((reserva) =>
              isAdmin ? (
                <ReservaCardAdmin
                  key={reserva.id}
                  reserva={reserva}
                  onPress={handleReservaPress}
                  styles={styles}
                />
              ) : (
                <ReservaCardPropietario
                  key={reserva.id}
                  reserva={reserva}
                  onPress={handleReservaPress}
                  onCancel={handleCancelarReserva}
                  styles={styles}
                />
              )
            )}

            {/* Botón Cargar Más - Solo visible sin filtros */}
            {activeFilter === "Todas" &&
              pagination.pagina_actual < pagination.total_paginas &&
              !refreshing && (
                <TouchableOpacity
                  style={styles.loadMoreButton}
                  onPress={cargarMasReservas}
                  disabled={loadingMore}
                >
                  {loadingMore ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.loadMoreText}>Ver más reservas</Text>
                  )}
                </TouchableOpacity>
              )}
          </>
        )}
      </Animated.ScrollView>

      <CancelReservationModal
        visible={showCancelModal}
        onClose={() => {
          setShowCancelModal(false);
          setSelectedReserva(null);
        }}
        onConfirm={handleConfirmarCancelacion}
        reservationId={selectedReserva?.id || 0}
        loading={cancelando}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.colors.surfaceLight,
    borderRadius: THEME.borderRadius.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.header.title,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  controlsContainer: {
    position: "absolute",
    top: 108,
    left: 0,
    right: 0,
    backgroundColor: THEME.colors.surface,
    marginHorizontal: 16,
    borderRadius: 16,
    paddingVertical: 20,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  monthSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  monthButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: THEME.colors.success + "10",
    alignItems: "center",
    justifyContent: "center",
  },
  monthInfo: {
    flex: 1,
    alignItems: "center",
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.header.title,
  },
  filtersSection: {
    paddingTop: 4,
    paddingLeft: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: THEME.colors.surfaceLight,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  activeFilterButton: {
    backgroundColor: THEME.colors.success,
    borderColor: THEME.colors.success,
  },
  filterText: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
  },
  activeFilterText: {
    color: THEME.colors.text.inverse,
  },
  content: {
    flex: 1,
    paddingTop: 160,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: THEME.colors.text.secondary,
    marginTop: 12,
  },
  errorText: {
    fontSize: 16,
    color: THEME.colors.error,
    marginTop: 12,
    textAlign: "center",
  },
  retryButton: {
    backgroundColor: THEME.colors.success,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: THEME.colors.text.inverse,
    fontSize: 14,
    fontWeight: "600",
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.header.title,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 40,
  },
  loadMoreButton: {
    backgroundColor: THEME.colors.success,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 20,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  loadMoreText: {
    color: THEME.colors.text.inverse,
    fontSize: 15,
    fontWeight: "600",
  },
  // Estilos para las cards de reserva
  reservaCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceLight,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
    paddingBottom: 12,
  },
  espacioInfo: {
    flex: 1,
    marginRight: 12,
  },
  espacioTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  espacioNombre: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.header.title,
    flex: 1,
  },
  fechaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  fechaReserva: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
  },
  estadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    justifyContent: "center",
  },
  estadoText: {
    color: THEME.colors.text.inverse,
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  cardDetails: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  detailsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  detailCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.background,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  detailIconContainer: {
    marginRight: 8,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    color: THEME.colors.header.title,
    fontWeight: "600",
    marginTop: 2,
  },
  motivoSection: {
    backgroundColor: THEME.colors.background,
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  motivoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  motivoLabel: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
    marginLeft: 6,
  },
  motivoText: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceLight,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: THEME.colors.error + "10",
    borderWidth: 1,
    borderColor: THEME.colors.error + "40",
  },
  cancelButtonText: {
    color: THEME.colors.error,
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  adminSection: {
    backgroundColor: THEME.colors.success + "10",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    padding: 12,
  },
  adminHeader: {
    marginBottom: 8,
  },
  adminLabel: {
    fontSize: 12,
    color: THEME.colors.success,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  adminContent: {
    gap: 6,
  },
  adminDetailRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  adminText: {
    fontSize: 14,
    color: THEME.colors.success,
    fontWeight: "500",
    marginLeft: 8,
  },
  scrollContent: {
    // paddingBottom se aplica dinámicamente con insets
  },
});
