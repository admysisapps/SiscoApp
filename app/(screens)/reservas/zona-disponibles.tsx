import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { EspacioCard } from "@/components/reservas/EspacioCard";
import { THEME } from "@/constants/theme";
import { reservaService } from "@/services/reservaService";
import { useLoading } from "@/contexts/LoadingContext";

export default function EspaciosDisponiblesScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [espacios, setEspacios] = useState<any[]>([]);
  const [inicializado, setInicializado] = useState(false);
  const { showLoading, hideLoading } = useLoading();

  // Usar refs para estabilizar las referencias
  const showLoadingRef = useRef(showLoading);
  const hideLoadingRef = useRef(hideLoading);

  useEffect(() => {
    showLoadingRef.current = showLoading;
    hideLoadingRef.current = hideLoading;
  }, [showLoading, hideLoading]);

  const cargarEspacios = React.useCallback(async (mostrarLoading = false) => {
    try {
      if (mostrarLoading) {
        showLoadingRef.current("Cargando zonas comunes...");
      }

      const response = await reservaService.listarEspaciosFresh({
        solo_activos: false,
      });

      if (response?.success) {
        const espaciosFiltrados = (response.espacios || []).filter(
          (espacio: any) => espacio.estado !== "inactiva"
        );
        setEspacios(espaciosFiltrados);
      }
    } catch (error) {
      console.error("Error cargando espacios:", error);
    } finally {
      if (mostrarLoading) {
        hideLoadingRef.current();
      }
      setInicializado(true);
    }
  }, []);

  useEffect(() => {
    cargarEspacios(true);
  }, [cargarEspacios]);

  useFocusEffect(
    React.useCallback(() => {
      if (inicializado) {
        cargarEspacios(false);
      }
    }, [cargarEspacios, inicializado])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarEspacios(false);
    setRefreshing(false);
  };

  const handleEspacioPress = (espacio: any) => {
    const params = new URLSearchParams({
      id: espacio.id.toString(),
      ...(espacio.imagen_nombre && { imagen_nombre: espacio.imagen_nombre }),
    });
    router.push(`/(screens)/reservas/detalle-zona?${params}`);
  };

  const handleBackPress = () => {
    router.back();
  };

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
        <Text style={styles.title}>Zonas Comunes</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.section}>
          {espacios.length > 0
            ? espacios.map((espacio) => (
                <EspacioCard
                  key={espacio.id}
                  item={espacio}
                  onPress={handleEspacioPress}
                />
              ))
            : inicializado && (
                <View style={styles.emptyContainer}>
                  <Image
                    source={require("@/assets/images/ZonasComunes.webp")}
                    style={styles.emptyImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.emptyTitle}>No hay zonas comunes</Text>
                  <Text style={styles.emptySubtitle}>
                    Actualmente no hay zonas comunes disponibles para reservar
                  </Text>
                </View>
              )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
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
  content: {
    flex: 1,
  },
  section: {
    padding: THEME.spacing.md,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
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
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 8,
    textAlign: "center",
  },
});
