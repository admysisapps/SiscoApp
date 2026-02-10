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

  const getFileIcon = (tipo: string) => {
    const tipoLower = tipo.toLowerCase();
    if (tipoLower === "pdf") return "document-text";
    if (["doc", "docx"].includes(tipoLower)) return "document";
    if (["xls", "xlsx"].includes(tipoLower)) return "grid";
    if (["jpg", "jpeg", "png"].includes(tipoLower)) return "image";
    return "document-outline";
  };

  const getFileColor = (tipo: string) => {
    const tipoLower = tipo.toLowerCase();
    if (tipoLower === "pdf") return "#EF4444";
    if (["doc", "docx"].includes(tipoLower)) return "#3B82F6";
    if (["xls", "xlsx"].includes(tipoLower)) return "#10B981";
    if (["jpg", "jpeg", "png"].includes(tipoLower)) return "#F59E0B";
    return THEME.colors.primary;
  };

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
          documentos.map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={styles.documentoItem}
              onPress={() => handleDescargarDocumento(doc)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.fileIcon,
                  { backgroundColor: `${getFileColor(doc.tipo)}15` },
                ]}
              >
                <Ionicons
                  name={getFileIcon(doc.tipo) as any}
                  size={24}
                  color={getFileColor(doc.tipo)}
                />
              </View>
              <View style={styles.info}>
                <Text style={styles.nombre} numberOfLines={2}>
                  {doc.nombre}
                </Text>
                <View style={styles.metadata}>
                  <Text style={styles.metadataText}>{doc.tipo}</Text>
                  <Text style={styles.metadataDot}>•</Text>
                  <Text style={styles.metadataText}>{doc.tamaño}</Text>
                  <Text style={styles.metadataDot}>•</Text>
                  <Text style={styles.metadataText}>{doc.fecha}</Text>
                </View>
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
                    size={24}
                    color={THEME.colors.primary}
                  />
                ) : null}
              </View>
            </TouchableOpacity>
          ))
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
  documentoItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: THEME.borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: THEME.spacing.md,
  },
  info: {
    flex: 1,
    paddingRight: THEME.spacing.md,
  },
  nombre: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: 6,
  },
  metadata: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metadataText: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.text.secondary,
  },
  metadataDot: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.text.muted,
  },
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
