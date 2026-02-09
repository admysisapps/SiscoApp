import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { THEME } from "@/constants/theme";
import ScreenHeader from "@/components/shared/ScreenHeader";
import DocumentosSkeleton from "@/components/siscoweb/admin/Documentos/DocumentosSkeleton";
import ConfirmModal from "@/components/asambleas/ConfirmModal";
import { useProject } from "@/contexts/ProjectContext";
import { documentoService } from "@/services/documentoService";
import { documentoCacheService } from "@/services/cache/documentoCacheService";
import { eventBus, EVENTS } from "@/utils/eventBus";

interface Documento {
  id: string;
  nombre: string;
  fecha: string;
  enCache: boolean;
  nombre_archivo?: string;
}

export default function FinancieroIndex() {
  const insets = useSafeAreaInsets();
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
              fecha: new Date(doc.fecha_creacion).toLocaleDateString("es-ES"),
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
    <View style={styles.container}>
      <ScreenHeader title="Documentos" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + THEME.spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <DocumentosSkeleton />
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
              <View style={styles.info}>
                <Text style={styles.nombre} numberOfLines={2}>
                  {doc.nombre}
                </Text>
                <Text style={styles.fecha}>{doc.fecha}</Text>
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
    </View>
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
    justifyContent: "space-between",
    paddingVertical: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.lg,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  info: {
    flex: 1,
    paddingRight: THEME.spacing.md,
  },
  nombre: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: 4,
  },
  fecha: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
  },
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
