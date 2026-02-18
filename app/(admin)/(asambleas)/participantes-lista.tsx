import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import { THEME } from "@/constants/theme";
import { quorumService } from "@/services/quorumService";
import { Participante } from "@/services/cache/quorumCacheService";
import { AsistenciaChart } from "@/components/votaciones/AsistenciaChart";
import { PoderVotoChart } from "@/components/votaciones/PoderVotoChart";
import ScreenHeader from "@/components/shared/ScreenHeader";

const ParticipantesListaScreen: React.FC = () => {
  const params = useLocalSearchParams();
  const asambleaId = parseInt(params.asambleaId as string);

  const [participantes, setParticipantes] = useState<Participante[]>([]);
  const [filteredParticipantes, setFilteredParticipantes] = useState<
    Participante[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const stats = {
    presentes: participantes.filter((p) => p.presente).length,
    ausentes: participantes.filter((p) => !p.presente).length,
  };

  const loadParticipantes = useCallback(async () => {
    try {
      setLoading(true);
      const data = await quorumService.getParticipantesConCache(asambleaId);
      setParticipantes(data);
    } catch (error) {
      console.error("Error cargando participantes:", error);
    } finally {
      setLoading(false);
    }
  }, [asambleaId]);

  const applyFilters = useCallback(() => {
    let filtered = participantes;

    // Filtro por búsqueda
    if (searchText.trim()) {
      const search = searchText.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.nombre.toLowerCase().includes(search) ||
          p.documento.includes(search)
      );
    }

    setFilteredParticipantes(filtered);
  }, [participantes, searchText]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadParticipantes();
    setRefreshing(false);
  }, [loadParticipantes]);

  useEffect(() => {
    loadParticipantes();

    const pollingInterval = setInterval(() => {
      loadParticipantes();
    }, 20000);

    return () => clearInterval(pollingInterval);
  }, [loadParticipantes]);

  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      () => {
        setKeyboardVisible(true);
        flatListRef.current?.scrollToOffset({ offset: 300, animated: true });
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const renderParticipante = ({ item }: { item: Participante }) => (
    <View style={styles.participanteCard}>
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: item.presente
              ? THEME.colors.primary
              : THEME.colors.text.secondary,
          },
        ]}
      >
        <Text style={styles.avatarText}>
          {item.nombre
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase()}
        </Text>
      </View>

      <View style={styles.participanteInfo}>
        <Text style={styles.participanteNombre} numberOfLines={1}>
          {item.nombre}
        </Text>
        <Text style={styles.participanteDocumento}>CC: {item.documento}</Text>

        <View style={styles.detalleContainer}>
          <View style={styles.detalleBadge}>
            <Ionicons
              name="pie-chart-outline"
              size={14}
              color={THEME.colors.primary}
            />
            <Text style={styles.detalleText}>
              {(item.coeficiente * 100).toFixed(2)}%
            </Text>
          </View>
          <View style={styles.detalleBadge}>
            <Ionicons
              name="home-outline"
              size={14}
              color={THEME.colors.primary}
            />
            <Text style={styles.detalleText}>
              {item.apartamentos} inmueble{item.apartamentos !== 1 ? "s" : ""}
            </Text>
          </View>
          <View
            style={[
              styles.statusChip,
              {
                backgroundColor: item.presente
                  ? THEME.colors.success + "15"
                  : THEME.colors.error + "15",
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor: item.presente
                    ? THEME.colors.success
                    : THEME.colors.error,
                },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                {
                  color: item.presente
                    ? THEME.colors.success
                    : THEME.colors.error,
                },
              ]}
            >
              {item.presente ? "Presente" : "Ausente"}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <ScreenHeader title="Participantes" />

      {/* Search Bar Fijo */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={THEME.colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o documento..."
          value={searchText}
          onChangeText={setSearchText}
          placeholderTextColor={THEME.colors.text.secondary}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText("")}>
            <Ionicons
              name="close-circle"
              size={20}
              color={THEME.colors.text.secondary}
            />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <FlatList
          ref={flatListRef}
          data={filteredParticipantes}
          renderItem={renderParticipante}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.listContainer,
            keyboardVisible && { paddingBottom: THEME.spacing.xl * 4 },
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <>
              <AsistenciaChart
                presentes={stats.presentes}
                ausentes={stats.ausentes}
              />
              {participantes.length > 0 && (
                <PoderVotoChart participantes={participantes} />
              )}
            </>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {loading
                  ? "Cargando participantes..."
                  : "No se encontraron participantes"}
              </Text>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
  },
  flex: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surface,
    marginHorizontal: THEME.spacing.md,
    marginVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: THEME.spacing.sm,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.primary,
  },
  listContainer: {
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.xl * 2,
  },
  participanteCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginRight: THEME.spacing.md,
  },
  avatarText: {
    color: THEME.colors.text.inverse,
    fontSize: THEME.fontSize.lg,
    fontWeight: "700",
  },
  participanteInfo: {
    flex: 1,
  },
  participanteNombre: {
    fontSize: THEME.fontSize.md,
    fontWeight: "700",
    color: THEME.colors.text.primary,
    marginBottom: 2,
  },
  participanteDocumento: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
    fontWeight: "400",
  },
  detalleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME.spacing.xs,
    flexWrap: "wrap",
  },
  detalleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.primary + "10",
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.sm,
    gap: 4,
  },
  detalleText: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.primary,
    fontWeight: "600",
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.sm,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: THEME.fontSize.xs,
    fontWeight: "600",
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: THEME.spacing.xl,
  },
  emptyText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.secondary,
  },
});

export default ParticipantesListaScreen;
