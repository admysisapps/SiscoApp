import React, { useState, useCallback, useRef, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
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
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, THEME } from "@/constants/theme";
import { reservaService } from "@/services/reservaService";
import { useLoading } from "@/contexts/LoadingContext";
import ScreenHeader from "@/components/shared/ScreenHeader";
interface EspacioAdmin {
  id: number;
  nombre: string;
  descripcion: string;
  estado: "activa" | "inactiva" | "mantenimiento";
  tipo_reserva: string;
  costo: number;
  capacidad_maxima: number;
  imagen_nombre?: string;
}

export default function GestionarEspaciosScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [espacios, setEspacios] = useState<EspacioAdmin[]>([]);
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
        solo_activos: false, // Admin ve todos los espacios
      });

      if (response?.success) {
        setEspacios(response.espacios || []);
      }
    } catch {
      // Error silencioso
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

  const handleCrearEspacio = useCallback(() => {
    router.push("/(screens)/reservas/admin/crear-espacio");
  }, []);

  const handleEditarEspacio = useCallback((espacio: EspacioAdmin) => {
    router.push(`/(screens)/reservas/admin/crear-espacio?id=${espacio.id}`);
  }, []);

  const handleBackPress = useCallback(() => {
    router.back();
  }, []);

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "activa":
        return THEME.colors.success;
      case "inactiva":
        return THEME.colors.text.secondary;
      case "mantenimiento":
        return THEME.colors.warning;
      default:
        return THEME.colors.text.secondary;
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case "activa":
        return "Activa";
      case "inactiva":
        return "Inactiva";
      case "mantenimiento":
        return "Mantenimiento";
      default:
        return estado;
    }
  };

  const formatCosto = (costo: number, tipo: string) => {
    if (tipo === "gratuito") return "Gratis";
    return `$${costo.toLocaleString()}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Gestionar Zonas Comunes"
        onBackPress={handleBackPress}
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Botón crear centrado */}
        <View style={styles.createButtonContainer}>
          <TouchableOpacity
            style={styles.createButtonMain}
            onPress={handleCrearEspacio}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={["#059669", "#10B981", "#34D399"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              <Ionicons name="add" size={20} color={COLORS.text.inverse} />
              <Text style={styles.createButtonText}>Crear Zona Común</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          {espacios.length > 0
            ? espacios.map((espacio) => (
                <View key={espacio.id} style={styles.espacioCard}>
                  <View style={styles.espacioHeader}>
                    <View style={styles.espacioInfo}>
                      <Text style={styles.espacioNombre}>{espacio.nombre}</Text>
                      <Text style={styles.espacioDescripcion} numberOfLines={2}>
                        {espacio.descripcion}
                      </Text>

                      <View style={styles.espacioDetalles}>
                        <View style={styles.detalle}>
                          <Ionicons
                            name="people"
                            size={16}
                            color={THEME.colors.text.secondary}
                          />
                          <Text style={styles.detalleTexto}>
                            Máx. {espacio.capacidad_maxima}
                          </Text>
                        </View>
                        <View style={styles.detalle}>
                          <Ionicons
                            name="cash"
                            size={16}
                            color={THEME.colors.text.secondary}
                          />
                          <Text style={styles.detalleTexto}>
                            {formatCosto(espacio.costo, espacio.tipo_reserva)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.estadoBadge,
                        { backgroundColor: getEstadoColor(espacio.estado) },
                      ]}
                    >
                      <Text style={styles.estadoTexto}>
                        {getEstadoTexto(espacio.estado)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.espacioAcciones}>
                    <TouchableOpacity
                      style={styles.botonEditar}
                      onPress={() => handleEditarEspacio(espacio)}
                    >
                      <Ionicons
                        name="create"
                        size={16}
                        color={THEME.colors.success}
                      />
                      <Text style={styles.botonEditarTexto}>Editar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            : inicializado && (
                <View style={styles.emptyContainer}>
                  <Image
                    source={require("@/assets/images/ZonasComunes.webp")}
                    style={styles.emptyImage}
                    resizeMode="contain"
                  />
                  <Text style={styles.emptyTitle}>No hay zonas comunes</Text>
                  <Text style={styles.emptyText}>
                    Crea tu primera zona común usando el botón de arriba
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
  content: {
    flex: 1,
  },
  section: {
    padding: THEME.spacing.md,
  },
  espacioCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  espacioHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: THEME.spacing.sm,
  },
  espacioInfo: {
    flex: 1,
    marginRight: THEME.spacing.sm,
  },
  espacioNombre: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: THEME.colors.text.heading,
    marginBottom: 4,
  },
  espacioDescripcion: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    lineHeight: 18,
    marginBottom: THEME.spacing.xs,
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoTexto: {
    color: THEME.colors.text.inverse,
    fontSize: THEME.fontSize.xs,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  espacioDetalles: {
    flexDirection: "row",
    gap: THEME.spacing.md,
  },
  detalle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detalleTexto: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
  },
  espacioAcciones: {
    flexDirection: "row",
    gap: THEME.spacing.sm,
    paddingTop: THEME.spacing.sm,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.surfaceLight,
  },
  botonEditar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.successLight,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: 8,
    gap: 4,
    justifyContent: "center",
  },
  botonEditarTexto: {
    color: THEME.colors.success,
    fontSize: THEME.fontSize.sm,
    fontWeight: "600",
  },

  emptyContainer: {
    alignItems: "center",
    paddingVertical: THEME.spacing.xl * 2,
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
  emptyText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 8,
  },
  createButtonContainer: {
    paddingHorizontal: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    alignItems: "center",
  },
  createButtonMain: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  gradientButton: {
    flexDirection: "row",
    paddingHorizontal: THEME.spacing.xl,
    paddingVertical: 14,
    alignItems: "center",
    gap: THEME.spacing.xs,
  },
  createButtonText: {
    color: COLORS.text.inverse,
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },
});
