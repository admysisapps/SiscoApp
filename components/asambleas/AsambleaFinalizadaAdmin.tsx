import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { LinearGradient } from "expo-linear-gradient";
import { THEME } from "@/constants/theme";
import * as WebBrowser from "expo-web-browser";
import { Asamblea } from "@/types/Asamblea";
import { votacionesService } from "@/services/votacionesService";
import { ResultadosVotacion } from "@/components/votaciones/base/ResultadosVotacion";
import { s3Service } from "@/services/s3Service";
import { asambleaService } from "@/services/asambleaService";
import { useRouter } from "expo-router";
import { useProject } from "@/contexts/ProjectContext";

type IconName =
  | "checkmark-circle-outline"
  | "document-text-outline"
  | "download-outline"
  | "cloud-upload-outline"
  | "trash-outline";

interface AsambleaFinalizadaAdminProps {
  asamblea: Asamblea;
  onShowToast?: (
    message: string,
    type: "success" | "error" | "warning"
  ) => void;
}

const AsambleaFinalizadaAdmin: React.FC<AsambleaFinalizadaAdminProps> = ({
  asamblea,
  onShowToast,
}) => {
  const router = useRouter();
  const { selectedProject } = useProject();
  const [showResultados, setShowResultados] = useState(false);
  const [loadingResultados, setLoadingResultados] = useState(false);
  const [resultadosData, setResultadosData] = useState<any[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [archivosSubidos, setArchivosSubidos] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [archivoAEliminar, setArchivoAEliminar] = useState<{
    id: number;
    nombreS3: string;
    nombre: string;
  } | null>(null);
  const [generandoReporte, setGenerandoReporte] = useState(false);
  const spinValue = useRef(new Animated.Value(0)).current;

  const handleGenerarReporte = async () => {
    try {
      setGenerandoReporte(true);
      const response = await asambleaService.generarReporteAsistencia(
        asamblea.id
      );

      if (response.success) {
        onShowToast?.(response.mensaje, "success");

        // Si el reporte se generó correctamente (no existía antes), navegar a Documentos
        if (!response.mensaje.includes("ya existe")) {
          setTimeout(() => {
            router.push("/(admin)/(financiero-admin)/Documentos");
          }, 1500); // Esperar 1.5s para que el usuario vea el toast
        }
      } else {
        onShowToast?.(response.error || "Error al generar reporte", "error");
      }
    } catch (error) {
      console.error("Error generando reporte:", error);
      onShowToast?.("Error al generar reporte de asistencia", "error");
    } finally {
      setGenerandoReporte(false);
    }
  };

  // Cargar archivos existentes desde la BD
  useEffect(() => {
    if (asamblea.archivos_nombres && Array.isArray(asamblea.archivos_nombres)) {
      const archivosConId = asamblea.archivos_nombres.map(
        (archivo: any, index: number) => ({
          ...archivo,
          id: Date.now() + index,
          tipo: archivo.nombre.split(".").pop()?.toUpperCase() || "FILE",
        })
      );
      setArchivosSubidos(archivosConId);
    }
  }, [asamblea]);

  useEffect(() => {
    if (loadingResultados) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [loadingResultados, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handleSubirDocumentos = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setUploadingFiles(true);

      const files = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType,
      }));

      const response = await s3Service.uploadAsambleaFiles(
        selectedProject?.nit || "",
        files
      );

      if (response.success && response.fileNames) {
        const nuevosArchivos = response.fileNames.map((fileName, index) => ({
          nombre: result.assets[index].name,
          nombreS3: fileName,
          tamaño: `${(result.assets[index].size! / 1024 / 1024).toFixed(2)} MB`,
        }));

        // Guardar en BD
        const bdResponse = await asambleaService.guardarArchivosAsamblea(
          asamblea.id,
          nuevosArchivos
        );

        if (bdResponse.success) {
          // Agregar IDs temporales para la UI
          const archivosConId = nuevosArchivos.map((archivo, index) => ({
            ...archivo,
            id: Date.now() + index,
            tipo: archivo.nombre.split(".").pop()?.toUpperCase() || "FILE",
          }));

          setArchivosSubidos([...archivosSubidos, ...archivosConId]);
          onShowToast?.(
            `${files.length} archivo(s) subido(s) correctamente`,
            "success"
          );
        } else {
          onShowToast?.("Error al guardar archivos en BD", "error");
        }
      } else {
        onShowToast?.(response.error || "Error al subir archivos", "error");
      }
    } catch (error) {
      console.error("Error al seleccionar archivos:", error);
      onShowToast?.("Error al seleccionar archivos", "error");
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleDescargarDocumento = async (
    nombreS3: string,
    nombreOriginal: string
  ) => {
    try {
      const response = await s3Service.getAsambleaFileUrl(
        selectedProject?.nit || "",
        nombreS3
      );

      if (response.success && response.url) {
        await WebBrowser.openBrowserAsync(response.url, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
          controlsColor: THEME.colors.primary,
          toolbarColor: THEME.colors.primary,
        });
      } else {
        onShowToast?.("No se pudo obtener el archivo", "error");
      }
    } catch (error) {
      console.error("Error al descargar archivo:", error);
      onShowToast?.("Error al descargar archivo", "error");
    }
  };

  const handleEliminarDocumento = (
    docId: number,
    nombreS3: string,
    nombreOriginal: string
  ) => {
    setArchivoAEliminar({ id: docId, nombreS3, nombre: nombreOriginal });
    setShowDeleteModal(true);
  };

  const confirmarEliminacion = async () => {
    if (!archivoAEliminar) return;

    setShowDeleteModal(false);

    try {
      const response = await asambleaService.eliminarArchivoAsamblea(
        asamblea.id,
        archivoAEliminar.nombreS3
      );

      if (response.success) {
        setArchivosSubidos(
          archivosSubidos.filter((a) => a.id !== archivoAEliminar.id)
        );
        onShowToast?.("Archivo eliminado correctamente", "success");
      } else {
        onShowToast?.("No se pudo eliminar el archivo", "error");
      }
    } catch (error) {
      console.error("Error al eliminar archivo:", error);
      onShowToast?.("Error al eliminar archivo", "error");
    } finally {
      setArchivoAEliminar(null);
    }
  };

  // Usar archivos subidos (en memoria por ahora, sin BD)
  const documentos = archivosSubidos;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons
          name={"checkmark-circle-outline" as IconName}
          size={24}
          color={THEME.colors.text.muted}
        />
        <Text style={[styles.titulo, { color: THEME.colors.text.muted }]}>
          Asamblea Finalizada
        </Text>
      </View>

      <Text style={styles.descripcion}>
        Esta asamblea se realizó el{" "}
        {new Date(asamblea.fecha).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
        .
      </Text>

      {/* Botón para subir documentos (ADMIN) */}
      <TouchableOpacity
        onPress={handleSubirDocumentos}
        disabled={uploadingFiles}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={["#2563EB", "#1D4ED8", "#1E40AF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.uploadButton}
        >
          <Ionicons
            name={"cloud-upload-outline" as IconName}
            size={20}
            color="white"
          />
          <Text style={styles.uploadButtonText}>
            {uploadingFiles ? "Subiendo..." : "Subir Documentos"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Botón para generar reporte de asistencia */}
      <TouchableOpacity
        onPress={handleGenerarReporte}
        disabled={generandoReporte}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={["#059669", "#047857", "#065F46"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.reportButton}
        >
          <Ionicons
            name={"document-text-outline" as IconName}
            size={20}
            color="white"
          />
          <Text style={styles.reportButtonText}>
            {generandoReporte
              ? "Generando..."
              : "Generar Reporte de Asistencia"}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Sección de documentos */}
      <View style={styles.documentosContainer}>
        <Text style={styles.documentosTitulo}>
          Documentos ({documentos.length})
        </Text>
        {documentos.map((doc) => (
          <View key={doc.id} style={styles.documentoItem}>
            <Ionicons
              name={"document-text-outline" as IconName}
              size={24}
              color={THEME.colors.primary}
            />
            <View style={styles.documentoInfo}>
              <Text
                style={styles.documentoNombre}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {doc.nombre}
              </Text>
              <Text style={styles.documentoMeta}>
                {doc.tipo} • {doc.tamaño}
              </Text>
            </View>

            {/* Botones de acción (ADMIN) */}
            <View style={styles.documentoActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() =>
                  handleDescargarDocumento(doc.nombreS3, doc.nombre)
                }
              >
                <Ionicons
                  name={"download-outline" as IconName}
                  size={20}
                  color={THEME.colors.primary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() =>
                  handleEliminarDocumento(doc.id, doc.nombreS3, doc.nombre)
                }
              >
                <Ionicons
                  name={"trash-outline" as IconName}
                  size={20}
                  color={THEME.colors.error}
                />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {documentos.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons
              name={"document-text-outline" as IconName}
              size={48}
              color={THEME.colors.text.muted}
            />
            <Text style={styles.emptyText}>No hay documentos subidos aún</Text>
          </View>
        )}
      </View>

      {/* Botón de Resultados */}
      <TouchableOpacity
        style={styles.resultadosButton}
        onPress={async () => {
          if (!showResultados) {
            setLoadingResultados(true);
            try {
              const response = await votacionesService.obtenerResultados(
                asamblea.id
              );
              if (response.success && response.preguntas) {
                setResultadosData(response.preguntas);
              }
            } catch (error) {
              console.error("Error obteniendo resultados:", error);
            } finally {
              setLoadingResultados(false);
            }
          }
          setShowResultados(!showResultados);
        }}
      >
        <Ionicons name="stats-chart" size={20} color={THEME.colors.primary} />
        <Text style={styles.resultadosButtonText}>Resultados</Text>
        {loadingResultados ? (
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Ionicons name="sync" size={20} color={THEME.colors.primary} />
          </Animated.View>
        ) : (
          <Ionicons
            name={showResultados ? "chevron-up" : "chevron-down"}
            size={20}
            color={THEME.colors.primary}
          />
        )}
      </TouchableOpacity>

      {/* Resultados de votación */}
      {showResultados &&
        (loadingResultados ? (
          <View style={styles.loadingContainer}>
            <Text>Cargando resultados...</Text>
          </View>
        ) : resultadosData.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text>No hay resultados disponibles</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            style={styles.resultadosScroll}
          >
            {resultadosData.map((pregunta) => (
              <View key={pregunta.pregunta_id} style={styles.resultadoItem}>
                <ResultadosVotacion
                  preguntaTexto={pregunta.pregunta_texto}
                  resultados={pregunta.resultados}
                  preguntaId={pregunta.pregunta_id}
                />
              </View>
            ))}
          </ScrollView>
        ))}

      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="trash-outline" size={48} color="#EF4444" />
            <Text style={styles.modalTitle}>Eliminar archivo</Text>
            <Text style={styles.modalMessage}>
              ¿Estás seguro de eliminar &quot;{archivoAEliminar?.nombre}&quot;?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => {
                  setShowDeleteModal(false);
                  setArchivoAEliminar(null);
                }}
              >
                <Text style={styles.modalButtonTextSecondary}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonDanger]}
                onPress={confirmarEliminacion}
              >
                <Text style={styles.modalButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: THEME.spacing.sm,
  },
  titulo: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    marginLeft: THEME.spacing.sm,
  },
  descripcion: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.md,
  },

  // Botón de subir (ADMIN)
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  uploadButtonText: {
    color: "white",
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },

  // Botón de reporte
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  reportButtonText: {
    color: "white",
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },

  documentosContainer: {
    marginTop: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  documentosTitulo: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: THEME.spacing.sm,
  },
  documentoItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.sm,
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

  // Acciones de documento (ADMIN)
  documentoActions: {
    flexDirection: "row",
    gap: THEME.spacing.sm,
  },
  actionButton: {
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.sm,
    backgroundColor: THEME.colors.primaryLight + "20",
  },
  deleteButton: {
    backgroundColor: THEME.colors.error + "15",
  },

  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: THEME.spacing.xl,
  },
  emptyText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.muted,
    marginTop: THEME.spacing.sm,
  },

  resultadosButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.borderRadius.md,
    marginTop: THEME.spacing.md,
  },
  resultadosButtonText: {
    flex: 1,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.primary,
    marginLeft: THEME.spacing.sm,
  },
  loadingContainer: {
    padding: THEME.spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  resultadosScroll: {
    marginTop: THEME.spacing.md,
  },
  resultadoItem: {
    width: Dimensions.get("window").width - THEME.spacing.lg * 4,
    marginRight: THEME.spacing.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    width: "80%",
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 16,
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalButtonSecondary: {
    backgroundColor: "#E2E8F0",
  },
  modalButtonDanger: {
    backgroundColor: "#EF4444",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  modalButtonTextSecondary: {
    color: "#64748B",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AsambleaFinalizadaAdmin;
