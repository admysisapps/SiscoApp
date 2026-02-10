import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";
import ScreenHeader from "@/components/shared/ScreenHeader";
import ConfirmModal from "@/components/asambleas/ConfirmModal";
import { useProject } from "@/contexts/ProjectContext";
import { documentoService } from "@/services/documentoService";
import { documentoCacheService } from "@/services/cache/documentoCacheService";
import { eventBus, EVENTS } from "@/utils/eventBus";
import { Documento } from "@/types/Documento";

export default function DocumentosScreen() {
  const { selectedProject } = useProject();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const cargarDocumentos = useCallback(async () => {
    try {
      setLoading(true);
      const result = await documentoService.listarDocumentos();

      if (result.success && result.documentos) {
        const docs: Documento[] = await Promise.all(
          result.documentos.map(async (doc) => {
            const enCache = selectedProject?.nit
              ? await documentoCacheService.existeLocal(
                  selectedProject.nit,
                  doc.nombre_original
                )
              : false;

            return {
              id: doc.id.toString(),
              nombre: doc.nombre_original,
              tipo:
                doc.nombre_original.split(".").pop()?.toUpperCase() || "FILE",
              tamaño: `${(doc.tamaño / 1024 / 1024).toFixed(2)} MB`,
              fecha: new Date(doc.fecha_creacion).toLocaleDateString("es-ES"),
              categoria: "General",
              nombre_archivo: doc.nombre_archivo,
              enCache,
            };
          })
        );

        setDocumentos(docs);
      }
    } catch (error) {
      console.error("Error cargando documentos:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedProject?.nit]);

  useEffect(() => {
    cargarDocumentos();
  }, [cargarDocumentos]);

  useEffect(() => {
    const handleDocumentoCached = () => {
      cargarDocumentos();
    };

    eventBus.on(EVENTS.DOCUMENTO_CACHED, handleDocumentoCached);

    return () => {
      eventBus.off(EVENTS.DOCUMENTO_CACHED, handleDocumentoCached);
    };
  }, [cargarDocumentos]);

  const handleDescargarDocumento = async (doc: Documento) => {
    if (!selectedProject?.nit || !doc.nombre_archivo) return;

    try {
      setDownloadingId(doc.id);

      if (doc.enCache) {
        await documentoCacheService.abrirDocumentoLocal(
          selectedProject.nit,
          doc.nombre
        );
      } else {
        const result = await documentoService.obtenerUrlDocumento(
          selectedProject.nit,
          doc.nombre_archivo
        );

        if (result.success && result.url) {
          await documentoCacheService.abrirDocumento(
            selectedProject.nit,
            doc.nombre,
            result.url
          );
          eventBus.emit(EVENTS.DOCUMENTO_CACHED);
        }
      }
    } catch (error: any) {
      console.error("Error abriendo documento:", error);
      setErrorMessage(
        error.message || "No se pudo abrir el documento. Intenta nuevamente."
      );
      setShowErrorModal(true);
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <ScreenHeader title="Documentos" showBackButton />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={THEME.colors.primary} />
            <Text style={styles.emptyText}>Cargando documentos...</Text>
          </View>
        ) : documentos.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons
              name="document-text-outline"
              size={64}
              color={THEME.colors.text.muted}
            />
            <Text style={styles.emptyText}>No hay documentos</Text>
          </View>
        ) : (
          <View style={styles.documentosContainer}>
            <Text style={styles.documentosTitulo}>
              Documentos ({documentos.length})
            </Text>
            {documentos.map((doc) => (
              <TouchableOpacity
                key={doc.id}
                style={styles.documentoItem}
                onPress={() => handleDescargarDocumento(doc)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name="document-text-outline"
                  size={24}
                  color={THEME.colors.primary}
                />
                <View style={styles.documentoInfo}>
                  <Text style={styles.documentoNombre} numberOfLines={2}>
                    {doc.nombre}
                  </Text>
                  <Text style={styles.documentoMeta}>
                    {doc.tipo} • {doc.tamaño}
                  </Text>
                </View>
                <View style={styles.iconContainer}>
                  {downloadingId === doc.id ? (
                    <ActivityIndicator
                      size="small"
                      color={THEME.colors.primary}
                    />
                  ) : !doc.enCache ? (
                    <Ionicons
                      name="download-outline"
                      size={20}
                      color={THEME.colors.primary}
                    />
                  ) : (
                    <View style={styles.iconPlaceholder} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <ConfirmModal
        visible={showErrorModal}
        type="error"
        title="Error"
        message={errorMessage}
        confirmText="Aceptar"
        onConfirm={() => setShowErrorModal(false)}
        onCancel={() => setShowErrorModal(false)}
      />
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
  scrollContent: {
    padding: THEME.spacing.md,
    paddingBottom: THEME.spacing.xl * 3,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: THEME.spacing.xl * 2,
  },
  emptyText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.muted,
    marginTop: THEME.spacing.md,
  },
  documentosContainer: {
    marginTop: THEME.spacing.sm,
  },
  documentosTitulo: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.xs,
  },
  documentoItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  documentoInfo: {
    flex: 1,
    marginLeft: THEME.spacing.sm,
    marginRight: THEME.spacing.sm,
  },
  documentoNombre: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.primary,
  },
  documentoMeta: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPlaceholder: {
    width: 20,
    height: 20,
  },
});
