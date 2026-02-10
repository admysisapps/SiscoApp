import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { useSharedValue } from "react-native-reanimated";
import { THEME } from "@/constants/theme";
import ScreenHeader from "@/components/shared/ScreenHeader";
import { DocumentoItem } from "@/components/siscoweb/admin/Documentos/DocumentoItem";
import DocumentosSkeleton from "@/components/siscoweb/admin/Documentos/DocumentosSkeleton";
import ConfirmModal from "@/components/asambleas/ConfirmModal";
import { useProject } from "@/contexts/ProjectContext";
import { documentoService } from "@/services/documentoService";
import { documentoCacheService } from "@/services/cache/documentoCacheService";
import { Documento } from "@/types/Documento";
import { eventBus, EVENTS } from "@/utils/eventBus";

export default function Documentos() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedProject } = useProject();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const openItemId = useSharedValue<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [documentoToDelete, setDocumentoToDelete] = useState<string | null>(
    null
  );
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const cargarDocumentos = useCallback(async () => {
    try {
      setLoading(true);
      const result = await documentoService.listarDocumentos();

      if (result.success && result.documentos) {
        // Mapear documentos de DB a formato UI
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

  // Cargar documentos al montar el componente
  useEffect(() => {
    cargarDocumentos();
  }, [cargarDocumentos]);

  // Escuchar evento de documento cacheado
  useEffect(() => {
    const handleDocumentoCached = () => {
      cargarDocumentos();
    };

    eventBus.on(EVENTS.DOCUMENTO_CACHED, handleDocumentoCached);

    return () => {
      eventBus.off(EVENTS.DOCUMENTO_CACHED, handleDocumentoCached);
    };
  }, [cargarDocumentos]);

  const handleSubirDocumento = async () => {
    if (!selectedProject?.nit) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setUploading(true);

        // Subir a S3 y guardar en DB
        const uploadResult = await documentoService.subirDocumento(
          selectedProject.nit,
          {
            uri: file.uri,
            name: file.name,
            type: file.mimeType,
          }
        );

        setUploading(false);

        if (uploadResult.success && uploadResult.documento) {
          // Recargar lista desde DB
          cargarDocumentos();
        }
      }
    } catch (error) {
      console.error("Error subiendo documento:", error);
      setUploading(false);
    }
  };

  const handleEliminarDocumento = (id: string) => {
    setDocumentoToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!documentoToDelete || !selectedProject?.nit) {
      setShowDeleteModal(false);
      return;
    }

    try {
      const doc = documentos.find((d) => d.id === documentoToDelete);
      if (!doc || !doc.nombre_archivo) return;

      const result = await documentoService.eliminarDocumento(
        selectedProject.nit,
        doc.id,
        doc.nombre_archivo,
        doc.nombre
      );

      if (result.success) {
        setDocumentos(documentos.filter((d) => d.id !== documentoToDelete));
      } else {
        setErrorMessage(result.error || "Error al eliminar documento");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error eliminando documento:", error);
      setErrorMessage("Error al eliminar documento");
      setShowErrorModal(true);
    } finally {
      setDocumentoToDelete(null);
      setShowDeleteModal(false);
    }
  };

  const handleDescargarDocumento = async (doc: Documento) => {
    if (!selectedProject?.nit || !doc.nombre_archivo) return;

    try {
      setDownloadingId(doc.id);

      // Si está en cache, abrir directamente sin pedir URL
      if (doc.enCache) {
        await documentoCacheService.abrirDocumentoLocal(
          selectedProject.nit,
          doc.nombre
        );
      } else {
        // Si no está en cache, obtener URL y descargar
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
      <ScreenHeader
        title="Documentos"
        showBackButton
        onBackPress={() => router.back()}
      />

      <View style={styles.content}>
        <ScrollView
          style={styles.documentosList}
          contentContainerStyle={[
            styles.documentosContent,
            { paddingBottom: 120 + insets.bottom },
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
            <View style={styles.documentosContainer}>
              <Text style={styles.documentosTitulo}>
                Documentos ({documentos.length})
              </Text>
              {documentos.map((doc) => (
                <DocumentoItem
                  key={doc.id}
                  documento={doc}
                  onDescargar={() => handleDescargarDocumento(doc)}
                  onEliminar={() => handleEliminarDocumento(doc.id)}
                  openItemId={openItemId}
                  isDownloading={downloadingId === doc.id}
                />
              ))}
            </View>
          )}
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.uploadButton,
            { bottom: THEME.spacing.lg + insets.bottom },
            uploading && styles.uploadButtonDisabled,
          ]}
          onPress={handleSubirDocumento}
          activeOpacity={0.7}
          disabled={uploading}
        >
          <View style={styles.uploadIconContainer}>
            {uploading ? (
              <ActivityIndicator size="small" color={THEME.colors.primary} />
            ) : (
              <Ionicons
                name="cloud-upload-outline"
                size={22}
                color={THEME.colors.primary}
              />
            )}
          </View>
          <Text style={styles.uploadButtonText}>
            {uploading ? "Subiendo..." : "Subir Documento"}
          </Text>
        </TouchableOpacity>

        <ConfirmModal
          visible={showDeleteModal}
          type="confirm"
          title="Eliminar Documento"
          message="¿Estás seguro de eliminar este documento? Esta acción no se puede deshacer."
          confirmText="Eliminar"
          cancelText="Cancelar"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
        />

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
  uploadButton: {
    position: "absolute",
    bottom: THEME.spacing.lg,
    left: THEME.spacing.lg,
    right: THEME.spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadIconContainer: {
    width: 40,
    height: 40,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: `${THEME.colors.primary}15`,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadButtonText: {
    color: THEME.colors.text.primary,
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },
  uploadButtonDisabled: {
    opacity: 0.5,
  },
  documentosList: {
    flex: 1,
  },
  documentosContent: {
    paddingBottom: THEME.spacing.xl,
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
    paddingHorizontal: THEME.spacing.lg,
  },
});
