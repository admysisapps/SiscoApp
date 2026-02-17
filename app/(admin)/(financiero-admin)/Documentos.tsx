import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
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
  const [deleting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Estados para modal de visibilidad
  const [showVisibilityModal, setShowVisibilityModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [visibleCopropietarios, setVisibleCopropietarios] = useState(true);

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
              tamaño: `${(doc.tamano / 1024 / 1024).toFixed(2)} MB`,
              fecha: new Date(doc.fecha_creacion).toLocaleDateString("es-ES"),
              categoria: "General",
              nombre_archivo: doc.nombre_archivo,
              enCache,
              visibleCop: doc.visible_cop === 1,
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
        // Guardar archivo y mostrar modal
        setSelectedFile(file);
        setVisibleCopropietarios(true); // Por defecto visible
        setShowVisibilityModal(true);
      }
    } catch (error) {
      console.error("Error seleccionando documento:", error);
    }
  };

  const confirmarSubida = async () => {
    if (!selectedProject?.nit || !selectedFile) return;

    try {
      setShowVisibilityModal(false);
      setUploading(true);

      // Subir a S3 y guardar en DB con visibilidad
      const uploadResult = await documentoService.subirDocumento(
        selectedProject.nit,
        {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType,
        },
        visibleCopropietarios
      );

      setUploading(false);

      if (uploadResult.success && uploadResult.documento) {
        // Recargar lista desde DB
        cargarDocumentos();
      }
    } catch (error) {
      console.error("Error subiendo documento:", error);
      setUploading(false);
    } finally {
      setSelectedFile(null);
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

    setShowDeleteModal(false);
    setDeletingId(documentoToDelete);

    // Esperar solo la animación (250ms)
    setTimeout(() => {
      // Quitar de la lista inmediatamente después de la animación
      setDocumentos((prev) => prev.filter((d) => d.id !== documentoToDelete));
      setDeletingId(null);
    }, 250);

    // Eliminar del servidor en segundo plano
    try {
      const doc = documentos.find((d) => d.id === documentoToDelete);
      if (!doc || !doc.nombre_archivo) return;

      await documentoService.eliminarDocumento(
        selectedProject.nit,
        doc.id,
        doc.nombre_archivo,
        doc.nombre
      );
    } catch (error) {
      console.error("Error eliminando documento:", error);
      // Si falla, recargar la lista
      cargarDocumentos();
      setErrorMessage("Error al eliminar documento");
      setShowErrorModal(true);
    } finally {
      setDocumentoToDelete(null);
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

  const handleToggleVisibilidad = async (doc: Documento) => {
    try {
      // Actualizar UI optimísticamente
      setDocumentos((prev) =>
        prev.map((d) =>
          d.id === doc.id ? { ...d, visibleCop: !d.visibleCop } : d
        )
      );

      // Llamar al servicio para actualizar en BD
      const result = await documentoService.actualizarVisibilidad(
        doc.id,
        !doc.visibleCop
      );

      if (!result.success) {
        // Revertir cambio si falla la actualización
        setDocumentos((prev) =>
          prev.map((d) =>
            d.id === doc.id ? { ...d, visibleCop: doc.visibleCop } : d
          )
        );
        setErrorMessage(
          result.error || "Error al cambiar visibilidad del documento"
        );
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error cambiando visibilidad:", error);
      // Revertir cambio en caso de error
      setDocumentos((prev) =>
        prev.map((d) =>
          d.id === doc.id ? { ...d, visibleCop: doc.visibleCop } : d
        )
      );
      setErrorMessage("Error al cambiar visibilidad del documento");
      setShowErrorModal(true);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Documentos"
        showBackButton
        onBackPress={() => router.push("/(admin)/(financiero-admin)/")}
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
              {/* Documentos Públicos */}
              {documentos.filter((d) => d.visibleCop).length > 0 && (
                <>
                  <Text style={styles.documentosTitulo}>
                    Documentos Públicos (
                    {documentos.filter((d) => d.visibleCop).length})
                  </Text>
                  {documentos
                    .filter((d) => d.visibleCop)
                    .map((doc) => (
                      <DocumentoItem
                        key={doc.id}
                        documento={doc}
                        onDescargar={() => handleDescargarDocumento(doc)}
                        onEliminar={() => handleEliminarDocumento(doc.id)}
                        onToggleVisibilidad={() => handleToggleVisibilidad(doc)}
                        openItemId={openItemId}
                        isDownloading={downloadingId === doc.id}
                        shouldDelete={deletingId === doc.id}
                      />
                    ))}
                </>
              )}

              {/* Documentos Privados (Solo Administración) */}
              {documentos.filter((d) => !d.visibleCop).length > 0 && (
                <>
                  <Text
                    style={[
                      styles.documentosTitulo,
                      styles.documentosTituloPrivado,
                    ]}
                  >
                    Solo Administración (
                    {documentos.filter((d) => !d.visibleCop).length})
                  </Text>
                  {documentos
                    .filter((d) => !d.visibleCop)
                    .map((doc) => (
                      <DocumentoItem
                        key={doc.id}
                        documento={doc}
                        onDescargar={() => handleDescargarDocumento(doc)}
                        onEliminar={() => handleEliminarDocumento(doc.id)}
                        onToggleVisibilidad={() => handleToggleVisibilidad(doc)}
                        openItemId={openItemId}
                        isDownloading={downloadingId === doc.id}
                        shouldDelete={deletingId === doc.id}
                      />
                    ))}
                </>
              )}
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
              <MaterialCommunityIcons
                name="file-document-plus-outline"
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
          confirmText={deleting ? "Eliminando..." : "Eliminar"}
          cancelText="Cancelar"
          onConfirm={confirmDelete}
          onCancel={() => setShowDeleteModal(false)}
          loading={deleting}
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

        {/* Modal de visibilidad */}
        <Modal
          visible={showVisibilityModal}
          transparent
          animationType="fade"
          statusBarTranslucent
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Ionicons
                name="document-text"
                size={48}
                color={THEME.colors.primary}
              />
              <Text style={styles.modalTitle}>Subir Documento</Text>
              <Text style={styles.modalFileName}>{selectedFile?.name}</Text>
              <Text style={styles.modalFileSize}>
                {selectedFile?.size
                  ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
                  : ""}
              </Text>

              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => setVisibleCopropietarios(!visibleCopropietarios)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={visibleCopropietarios ? "checkbox" : "square-outline"}
                  size={24}
                  color={THEME.colors.primary}
                />
                <Text style={styles.checkboxLabel}>
                  Visible para copropietarios
                </Text>
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSecondary]}
                  onPress={() => {
                    setShowVisibilityModal(false);
                    setSelectedFile(null);
                  }}
                >
                  <Text style={styles.modalButtonTextSecondary}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={confirmarSubida}
                >
                  <Text style={styles.modalButtonText}>Subir</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  documentosTituloPrivado: {
    marginTop: THEME.spacing.lg,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: THEME.colors.modalOverlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.xl,
    padding: THEME.spacing.lg,
    alignItems: "center",
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: THEME.fontSize.xl,
    fontWeight: "700",
    color: THEME.colors.text.heading,
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  modalFileName: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.primary,
    textAlign: "center",
    marginBottom: THEME.spacing.xs,
    fontWeight: "600",
  },
  modalFileSize: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.lg,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.lg,
    paddingVertical: THEME.spacing.sm,
  },
  checkboxLabel: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.primary,
    fontWeight: "500",
  },
  modalButtons: {
    flexDirection: "row",
    gap: THEME.spacing.sm,
    width: "100%",
  },
  modalButton: {
    paddingVertical: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonSecondary: {
    backgroundColor: THEME.colors.surfaceLight,
  },
  modalButtonPrimary: {
    backgroundColor: THEME.colors.primary,
  },
  modalButtonText: {
    color: THEME.colors.text.inverse,
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },
  modalButtonTextSecondary: {
    color: THEME.colors.text.secondary,
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },
});
