import { Ionicons } from "@expo/vector-icons";
import React, { useState, useEffect, useCallback, memo } from "react";
import {
  Image,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { publicacionesService } from "@/services/publicacionesService";
import { Publicacion, EstadoPublicacion } from "@/types/publicaciones";
import { s3Service } from "@/services/s3Service";
import { useProject } from "@/contexts/ProjectContext";
import Toast from "@/components/Toast";
import { THEME } from "@/constants/theme";
import { eventBus, EVENTS } from "@/utils/eventBus";

const PublicacionImage = memo(function PublicacionImage({
  archivos,
  tipo,
  style,
}: {
  archivos: string[] | null;
  tipo: string;
  style?: any;
}) {
  const { selectedProject } = useProject();
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadFirstImage = async () => {
      const nit = selectedProject?.NIT;
      if (!archivos?.length || !nit) return;

      try {
        const result = await s3Service.getPublicacionImageUrl(
          nit,
          tipo as any,
          archivos[0]
        );
        if (result.success && result.url) {
          setImageUrl(result.url);
        }
      } catch {
        console.error("Error cargando imagen");
      }
    };

    loadFirstImage();
  }, [archivos, tipo, selectedProject]);

  if (imageUrl) {
    return (
      <Image source={{ uri: imageUrl }} style={style} resizeMode="cover" />
    );
  }

  return (
    <View style={[style, styles.placeholderImage]}>
      <Ionicons
        name="image-outline"
        size={40}
        color={THEME.colors.text.secondary}
      />
    </View>
  );
});

export default function MisPublicaciones() {
  const [publicaciones, setPublicaciones] = useState<Publicacion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });

  const cargarMisPublicaciones = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await publicacionesService.listarMisPublicaciones();
      if (response.success && response.publicaciones) {
        setPublicaciones(response.publicaciones);
      }
    } catch {
      console.error("Error cargando mis publicaciones");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarMisPublicaciones();

    const handlePublicacionCreated = (publicacion: Publicacion) => {
      setPublicaciones((prev) => [publicacion, ...prev]);
    };

    const handlePublicacionUpdated = (publicacion: Publicacion) => {
      setPublicaciones((prev) =>
        prev.map((p) => (p.id === publicacion.id ? publicacion : p))
      );
    };

    eventBus.on(EVENTS.PUBLICACION_CREATED, handlePublicacionCreated);
    eventBus.on(EVENTS.PUBLICACION_UPDATED, handlePublicacionUpdated);

    return () => {
      eventBus.off(EVENTS.PUBLICACION_CREATED, handlePublicacionCreated);
      eventBus.off(EVENTS.PUBLICACION_UPDATED, handlePublicacionUpdated);
    };
  }, [cargarMisPublicaciones]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarMisPublicaciones();
    setRefreshing(false);
  }, [cargarMisPublicaciones]);

  const cambiarEstado = useCallback(
    async (publicacionId: number, nuevoEstado: EstadoPublicacion) => {
      try {
        const response = await publicacionesService.cambiarEstadoPublicacion(
          publicacionId,
          nuevoEstado
        );
        if (response.success) {
          setPublicaciones((prev) =>
            prev.map((p) =>
              p.id === publicacionId ? { ...p, estado: nuevoEstado } : p
            )
          );
          setToast({
            visible: true,
            message: "Estado actualizado correctamente",
            type: "success",
          });
        }
      } catch {
        setToast({
          visible: true,
          message: "No se pudo cambiar el estado",
          type: "error",
        });
      }
    },
    []
  );

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case "activa":
        return THEME.colors.success;
      case "pausada":
        return THEME.colors.warning;
      case "finalizada":
        return THEME.colors.text.secondary;
      case "bloqueada":
        return THEME.colors.error;
      case "expirada":
        return THEME.colors.text.muted;
      default:
        return THEME.colors.error;
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case "activa":
        return "Activa";
      case "pausada":
        return "Pausada";
      case "finalizada":
        return "Finalizada";
      case "bloqueada":
        return "Bloqueada";
      case "expirada":
        return "Expirada";
      default:
        return estado;
    }
  };

  const renderSkeletonItem = () => (
    <View style={styles.publicacionCard}>
      <View style={styles.cardRow}>
        <View style={styles.imageContainer}>
          <View style={styles.skeletonThumbnail} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.topRow}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonBadge} />
          </View>
          <View style={styles.metaRow}>
            <View style={styles.skeletonTipo} />
            <View style={styles.skeletonPrice} />
          </View>
          <View style={styles.dateRow}>
            <View style={styles.skeletonDate} />
            <View style={styles.skeletonDate} />
          </View>
        </View>
      </View>
      <View style={styles.actionsRow}>
        <View style={styles.skeletonButton} />
        <View style={styles.skeletonButton} />
      </View>
    </View>
  );

  const renderPublicacionItem = useCallback(
    ({ item: publicacion }: { item: Publicacion }) => (
      <View style={styles.publicacionCard}>
        <View style={styles.cardRow}>
          {/* Imagen lateral */}
          <View style={styles.imageContainer}>
            {publicacion.archivos_nombres?.length ? (
              <PublicacionImage
                archivos={publicacion.archivos_nombres}
                tipo={publicacion.tipo}
                style={styles.thumbnail}
              />
            ) : (
              <View style={styles.thumbnailPlaceholder}>
                <Ionicons
                  name="image-outline"
                  size={24}
                  color={THEME.colors.text.muted}
                />
              </View>
            )}
          </View>

          {/* Contenido principal */}
          <View style={styles.cardContent}>
            <View style={styles.topRow}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {publicacion.titulo}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getEstadoColor(publicacion.estado) },
                ]}
              >
                <Text style={styles.statusText}>
                  {getEstadoTexto(publicacion.estado)}
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.tipoText}>{publicacion.tipo}</Text>
              {publicacion.precio > 0 && (
                <Text style={styles.priceText}>
                  $
                  {publicacion.precio
                    .toString()
                    .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}
                </Text>
              )}
            </View>

            <View style={styles.dateRow}>
              <Text style={styles.dateText}>
                {new Date(publicacion.fecha_creacion).toLocaleDateString()}
              </Text>
              <Text style={styles.dateText}>
                Exp:{" "}
                {new Date(publicacion.fecha_expiracion).toLocaleDateString()}
              </Text>
            </View>

            {publicacion.estado === "bloqueada" && (
              <View style={styles.blockedBanner}>
                <Ionicons name="ban" size={14} color={THEME.colors.error} />
                <Text style={styles.blockedMainText}>
                  Bloqueada por administración
                </Text>
              </View>
            )}

            {publicacion.estado === "bloqueada" &&
              publicacion.razon_bloqueo && (
                <View style={styles.reasonRow}>
                  <Ionicons
                    name="information-circle"
                    size={12}
                    color={THEME.colors.error}
                  />
                  <Text style={styles.reasonText} numberOfLines={2}>
                    {publicacion.razon_bloqueo}
                  </Text>
                </View>
              )}
          </View>
        </View>

        {/* Acciones en la parte inferior - solo si no está bloqueada */}
        {publicacion.estado !== "bloqueada" && (
          <View style={styles.actionsRow}>
            {publicacion.estado === "activa" && (
              <TouchableOpacity
                style={[styles.compactButton, styles.pauseButton]}
                onPress={() => cambiarEstado(publicacion.id, "pausada")}
              >
                <Ionicons name="pause" size={14} color="white" />
                <Text style={styles.compactButtonText}>Pausar</Text>
              </TouchableOpacity>
            )}

            {publicacion.estado === "pausada" && (
              <TouchableOpacity
                style={[styles.compactButton, styles.activateButton]}
                onPress={() => cambiarEstado(publicacion.id, "activa")}
              >
                <Ionicons name="play" size={14} color="white" />
                <Text style={styles.compactButtonText}>Activar</Text>
              </TouchableOpacity>
            )}

            {(publicacion.estado === "activa" ||
              publicacion.estado === "pausada") && (
              <TouchableOpacity
                style={[styles.compactButton, styles.finalizeButton]}
                onPress={() => cambiarEstado(publicacion.id, "finalizada")}
              >
                <Ionicons name="checkmark-done" size={14} color="white" />
                <Text style={styles.compactButtonText}>Finalizar</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    ),
    [cambiarEstado]
  );

  const keyExtractor = useCallback(
    (item: Publicacion) => item.id.toString(),
    []
  );

  return (
    <>
      <FlatList
        data={isLoading ? [] : publicaciones}
        renderItem={renderPublicacionItem}
        keyExtractor={keyExtractor}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          isLoading ? styles.loadingContent : styles.listContainer
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.skeletonContainer}>
              {[1, 2, 3].map((i) => (
                <View key={i}>{renderSkeletonItem()}</View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="document-text-outline"
                size={64}
                color={THEME.colors.text.muted}
              />
              <Text style={styles.emptyText}>No tienes publicaciones</Text>
            </View>
          )
        }
        removeClippedSubviews
        maxToRenderPerBatch={5}
        windowSize={5}
      />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  publicacionCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  cardRow: {
    flexDirection: "row",
    padding: 12,
  },
  imageContainer: {
    marginRight: 12,
  },
  thumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  thumbnailPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: THEME.colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 6,
  },
  cardTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.text.heading,
    marginRight: 8,
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: THEME.colors.text.inverse,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  tipoText: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  priceText: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.colors.success,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  dateText: {
    fontSize: 11,
    color: THEME.colors.text.muted,
  },
  blockedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.error + "10",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginTop: 6,
  },
  blockedMainText: {
    fontSize: 12,
    color: THEME.colors.error,
    fontWeight: "600",
  },
  reasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
    marginTop: 4,
    paddingLeft: 4,
  },
  reasonText: {
    flex: 1,
    fontSize: 11,
    color: THEME.colors.error,
    fontWeight: "400",
    lineHeight: 14,
  },
  actionsRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  compactButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  compactButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.text.inverse,
  },
  pauseButton: {
    backgroundColor: THEME.colors.warning,
  },
  activateButton: {
    backgroundColor: THEME.colors.success,
  },
  finalizeButton: {
    backgroundColor: THEME.colors.text.secondary,
  },

  placeholderImage: {
    backgroundColor: THEME.colors.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: THEME.colors.text.secondary,
    marginTop: 16,
  },
  loadingContent: {
    flex: 1,
  },
  skeletonContainer: {
    padding: 16,
  },
  skeletonThumbnail: {
    width: 70,
    height: 70,
    borderRadius: 8,
    backgroundColor: THEME.colors.border,
  },
  skeletonTitle: {
    width: "70%",
    height: 16,
    backgroundColor: THEME.colors.border,
    borderRadius: 4,
  },
  skeletonBadge: {
    width: 60,
    height: 20,
    backgroundColor: THEME.colors.border,
    borderRadius: 12,
  },
  skeletonTipo: {
    width: 80,
    height: 12,
    backgroundColor: THEME.colors.border,
    borderRadius: 4,
  },
  skeletonPrice: {
    width: 70,
    height: 16,
    backgroundColor: THEME.colors.border,
    borderRadius: 4,
  },
  skeletonDate: {
    width: 80,
    height: 11,
    backgroundColor: THEME.colors.border,
    borderRadius: 4,
  },
  skeletonButton: {
    flex: 1,
    height: 36,
    backgroundColor: THEME.colors.border,
    borderRadius: 8,
  },
});
