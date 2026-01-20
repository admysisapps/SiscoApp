import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";
import * as WebBrowser from "expo-web-browser";
import { Asamblea } from "@/types/Asamblea";
import { votacionesService } from "@/services/votacionesService";
import { ResultadosVotacion } from "@/components/votaciones/base/ResultadosVotacion";
import { s3Service } from "@/services/s3Service";
import { useProject } from "@/contexts/ProjectContext";
import ConfirmModal from "@/components/asambleas/ConfirmModal";

// Definir un tipo para los nombres de iconos
type IconName =
  | "checkmark-circle-outline"
  | "document-text-outline"
  | "download-outline"
  | "people-outline";

interface AsambleaFinalizadaProps {
  asamblea: Asamblea;
}

const AsambleaFinalizada: React.FC<AsambleaFinalizadaProps> = ({
  asamblea,
}) => {
  const { selectedProject } = useProject();
  const [showResultados, setShowResultados] = useState(false);
  const [loadingResultados, setLoadingResultados] = useState(false);
  const [resultadosData, setResultadosData] = useState<any[]>([]);
  const [archivos, setArchivos] = useState<any[]>([]);
  const spinValue = useRef(new Animated.Value(0)).current;
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Cargar archivos desde BD
  useEffect(() => {
    if (asamblea.archivos_nombres && Array.isArray(asamblea.archivos_nombres)) {
      const archivosConId = asamblea.archivos_nombres.map(
        (archivo: any, index: number) => ({
          ...archivo,
          id: Date.now() + index,
          tipo: archivo.nombre.split(".").pop()?.toUpperCase() || "FILE",
        })
      );
      setArchivos(archivosConId);
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
        setErrorMessage("No se pudo obtener el archivo");
        setShowErrorModal(true);
      }
    } catch (error) {
      console.error("Error al descargar archivo:", error);
      setErrorMessage("Error al descargar archivo");
      setShowErrorModal(true);
    }
  };

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

      {/* Sección de documentos */}
      <View style={styles.documentosContainer}>
        <Text style={styles.documentosTitulo}>
          Documentos ({archivos.length})
        </Text>
        {archivos.map((doc) => (
          <TouchableOpacity
            key={doc.id}
            style={styles.documentoItem}
            onPress={() => handleDescargarDocumento(doc.nombreS3, doc.nombre)}
          >
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
            <Ionicons
              name={"download-outline" as IconName}
              size={20}
              color={THEME.colors.primary}
            />
          </TouchableOpacity>
        ))}

        {archivos.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons
              name={"document-text-outline" as IconName}
              size={48}
              color={THEME.colors.text.muted}
            />
            <Text style={styles.emptyText}>No hay documentos disponibles</Text>
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

      <ConfirmModal
        visible={showErrorModal}
        type="error"
        title="Error"
        message={errorMessage}
        confirmText="Entendido"
        onConfirm={() => setShowErrorModal(false)}
        onCancel={() => setShowErrorModal(false)}
        showCancel={false}
      />
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
});

export default AsambleaFinalizada;
