import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
  memo,
} from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { THEME, COLORS } from "@/constants/theme";
import { useRouter, useLocalSearchParams } from "expo-router";
import { propietarioService } from "@/services/propietarioService";
import { useLoading } from "@/contexts/LoadingContext";
import Toast from "@/components/Toast";
import ScreenHeader from "@/components/shared/ScreenHeader";

const AnimatedFlatList = Animated.createAnimatedComponent(
  FlatList<ApartamentoProcesado>
);

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const SEARCH_TOP = SCREEN_HEIGHT < 700 ? 200 : 220;

interface Apartamento {
  id: number;
  codigo_apt: string;
  numero: string;
  bloque: string;
  coeficiente: number;
  propietario_nombre?: string | null;
  propietario_documento?: string | null;
}

interface ApartamentoProcesado extends Apartamento {
  ui: {
    statusText: string;
    statusColor: string;
    statusIcon: string;
    actionLabel: string;
  };
}

export default function SeleccionarApartamentoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showLoading, hideLoading } = useLoading();

  // Parsear datos del usuario destino
  const usuario = params.usuario ? JSON.parse(params.usuario as string) : null;
  const esUsuarioNuevo = params.esUsuarioNuevo === "true";

  const [apartamentos, setApartamentos] = useState<Apartamento[]>([]);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });

  const [filtro, setFiltro] = useState("");
  const [ordenPor, setOrdenPor] = useState<"codigo" | "bloque" | "propietario">(
    "codigo"
  );

  const scrollY = useRef(new Animated.Value(0)).current;

  // Cargar apartamentos al montar
  useEffect(() => {
    const cargarApartamentos = async () => {
      try {
        showLoading("Cargando inmuebles...");
        const resultado = await propietarioService.listarApartamentos();

        if (resultado.success && resultado.data) {
          setApartamentos(resultado.data);
        } else {
          setToast({
            visible: true,
            message: resultado.error || "No se pudieron cargar los inmuebles",
            type: "error",
          });
        }
      } catch {
        setToast({
          visible: true,
          message: "Error de conexión al cargar inmuebles",
          type: "error",
        });
      } finally {
        hideLoading();
      }
    };

    cargarApartamentos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtrar y ordenar apartamentos con useMemo para optimización
  const apartamentosFiltrados = useMemo(() => {
    let filtrados = [...apartamentos];

    // Filtro por texto
    if (filtro.trim()) {
      const textoFiltro = filtro.toLowerCase();
      filtrados = filtrados.filter(
        (apt) =>
          apt.codigo_apt.toLowerCase().includes(textoFiltro) ||
          apt.numero.includes(filtro) ||
          apt.bloque.toLowerCase().includes(textoFiltro) ||
          apt.propietario_nombre?.toLowerCase().includes(textoFiltro) ||
          apt.coeficiente.toString().includes(filtro)
      );
    }

    // Ordenar
    filtrados.sort((a, b) => {
      switch (ordenPor) {
        case "bloque":
          return (
            a.bloque.localeCompare(b.bloque) || a.numero.localeCompare(b.numero)
          );
        case "propietario":
          const nombreA = a.propietario_nombre || "";
          const nombreB = b.propietario_nombre || "";
          return nombreA.localeCompare(nombreB);
        default:
          return a.codigo_apt.localeCompare(b.codigo_apt);
      }
    });

    // "Cocinar" los datos para la UI
    return filtrados.map((apt) => ({
      ...apt,
      ui: {
        statusText: apt.propietario_nombre || "Disponible",
        statusColor: apt.propietario_nombre
          ? COLORS.text.secondary
          : COLORS.success,
        statusIcon: apt.propietario_nombre ? "person" : "checkmark-circle",
        actionLabel: apt.propietario_nombre ? "Transferir" : "Asignar",
      },
    }));
  }, [filtro, apartamentos, ordenPor]);

  const seleccionarApartamento = useCallback(
    (apartamento: Apartamento) => {
      router.push({
        pathname: "/(screens)/propietarios/confirmar-transferencia",
        params: {
          apartamento: JSON.stringify(apartamento),
          usuario: JSON.stringify(usuario),
          esUsuarioNuevo: esUsuarioNuevo.toString(),
        },
      });
    },
    [router, usuario, esUsuarioNuevo]
  );

  // Componente de item optimizado
  const ApartmentItem = memo(function ApartmentItem({
    item,
  }: {
    item: ApartamentoProcesado;
  }) {
    return (
      <TouchableOpacity
        style={styles.apartmentCard}
        onPress={() => seleccionarApartamento(item)}
      >
        <View style={styles.apartmentHeader}>
          <View style={styles.apartmentInfo}>
            <Text style={styles.apartmentCode}>{item.codigo_apt}</Text>
            <Text style={styles.apartmentDetails}>
              Bloque {item.bloque} • Coef: {item.coeficiente}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              { backgroundColor: item.ui.statusColor + "20" },
            ]}
          >
            <Ionicons
              name={item.ui.statusIcon as any}
              size={16}
              color={item.ui.statusColor}
            />
            <Text style={[styles.statusText, { color: item.ui.statusColor }]}>
              {item.ui.statusText}
            </Text>
          </View>
        </View>

        <View style={styles.transferAction}>
          <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          <Text style={styles.transferText}>{item.ui.actionLabel}</Text>
        </View>
      </TouchableOpacity>
    );
  });

  const renderItem = useCallback(
    ({ item }: { item: ApartamentoProcesado }) => <ApartmentItem item={item} />,
    [ApartmentItem]
  );

  const keyExtractor = useCallback(
    (item: ApartamentoProcesado) => item.id.toString(),
    []
  );

  const ListHeaderComponent = useCallback(
    () => (
      <Text style={styles.sectionTitle}>
        Inmuebles ({apartamentosFiltrados.length})
      </Text>
    ),
    [apartamentosFiltrados.length]
  );

  const ListEmptyComponent = useCallback(
    () => (
      <View style={styles.emptyState}>
        <Ionicons name="home-outline" size={48} color={COLORS.text.muted} />
        <Text style={styles.emptyTitle}>No se encontraron inmuebles</Text>
        <Text style={styles.emptyText}>
          Intenta con otro término de búsqueda
        </Text>
      </View>
    ),
    []
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Seleccionar Inmueble"
        onBackPress={() => router.back()}
      />

      {/* Usuario destino */}
      <View style={[styles.userCard, esUsuarioNuevo && styles.userCardNew]}>
        <Ionicons
          name="person-circle"
          size={32}
          color={esUsuarioNuevo ? COLORS.success : COLORS.primary}
        />
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {usuario?.nombre} {usuario?.apellido}
          </Text>
          <Text style={styles.userDocument}>Cédula: {usuario?.documento}</Text>
        </View>
      </View>

      {/* Buscador y filtros */}
      <Animated.View
        style={[
          styles.searchSection,
          {
            opacity: scrollY.interpolate({
              inputRange: [0, 100],
              outputRange: [1, 0],
              extrapolate: "clamp",
            }),
            transform: [
              {
                translateY: scrollY.interpolate({
                  inputRange: [0, 500],
                  outputRange: [0, -50],
                  extrapolate: "clamp",
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={22} color={COLORS.primary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar inmueble..."
            placeholderTextColor={COLORS.text.muted}
            value={filtro}
            onChangeText={setFiltro}
          />
          {filtro.length > 0 && (
            <TouchableOpacity onPress={() => setFiltro("")}>
              <Ionicons name="close-circle" size={22} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Ordenar por */}
        <View style={styles.sortContainer}>
          <View style={styles.sortRow}>
            <TouchableOpacity
              style={[
                styles.sortButton,
                ordenPor === "codigo" && styles.sortButtonActive,
              ]}
              onPress={() => setOrdenPor("codigo")}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  ordenPor === "codigo" && styles.sortButtonTextActive,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Código
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortButton,
                ordenPor === "bloque" && styles.sortButtonActive,
              ]}
              onPress={() => setOrdenPor("bloque")}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  ordenPor === "bloque" && styles.sortButtonTextActive,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Bloque
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.sortButton,
                ordenPor === "propietario" && styles.sortButtonActive,
              ]}
              onPress={() => setOrdenPor("propietario")}
            >
              <Text
                style={[
                  styles.sortButtonText,
                  ordenPor === "propietario" && styles.sortButtonTextActive,
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                Propietario
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Lista de inmuebles virtualizada */}
      <AnimatedFlatList
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 190 }}
        data={apartamentosFiltrados}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        initialNumToRender={15}
        windowSize={10}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    marginHorizontal: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  userCardNew: {
    borderColor: COLORS.success,
    backgroundColor: COLORS.success + "08",
  },
  userInfo: {
    marginLeft: THEME.spacing.md,
    flex: 1,
  },
  userName: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  userDocument: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  newUserBadge: {
    backgroundColor: COLORS.success + "20",
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.sm,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  newUserText: {
    fontSize: THEME.fontSize.xs,
    color: COLORS.success,
    fontWeight: "600",
  },
  searchSection: {
    position: "absolute",
    top: SEARCH_TOP,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    marginHorizontal: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    paddingVertical: THEME.spacing.lg,
    paddingBottom: THEME.spacing.md,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary + "10",
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    marginHorizontal: THEME.spacing.md,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  searchInput: {
    flex: 1,
    height: 50,
    marginLeft: THEME.spacing.sm,
    color: COLORS.text.primary,
    fontSize: THEME.fontSize.md,
  },
  sortContainer: {
    paddingHorizontal: THEME.spacing.md,
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: THEME.borderRadius.md,
    marginRight: THEME.spacing.sm,
    flex: 1,
    alignItems: "center",
    backgroundColor: THEME.colors.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sortButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  sortButtonText: {
    fontSize: 14,
    color: COLORS.text.secondary,
    fontWeight: "500",
    textAlign: "center",
  },
  sortButtonTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: 200,
  },
  sectionTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  apartmentCard: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  apartmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME.spacing.sm,
  },
  apartmentInfo: {
    flex: 1,
  },
  apartmentCode: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: COLORS.primary,
  },
  apartmentDetails: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.sm,
    gap: 4,
  },
  statusText: {
    fontSize: THEME.fontSize.xs,
    fontWeight: "600",
    marginLeft: 4,
  },
  transferAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 4,
  },
  transferText: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.primary,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: THEME.spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginTop: THEME.spacing.md,
  },
  emptyText: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.text.secondary,
    textAlign: "center",
    marginTop: THEME.spacing.xs,
  },
});
