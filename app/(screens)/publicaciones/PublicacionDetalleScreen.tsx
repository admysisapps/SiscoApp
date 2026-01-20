import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";
import { useProject } from "@/contexts/ProjectContext";
import { s3Service } from "@/services/s3Service";
import { publicacionesService } from "@/services/publicacionesService";
import { Publicacion } from "@/types/publicaciones";
import BloquearPublicacionModal from "@/components/publicaciones/BloquearPublicacionModal";
import PublicacionInfoSection from "@/components/publicaciones/PublicacionInfoSection";
import ConfirmModal from "@/components/asambleas/ConfirmModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function PublicacionDetalleScreen() {
  const params = useLocalSearchParams();
  const { selectedProject } = useProject();
  const [anuncio, setAnuncio] = useState<Publicacion | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (params.publicacion) {
      try {
        const publicacion = JSON.parse(params.publicacion as string);
        setAnuncio(publicacion);
      } catch {}
    }
  }, [params.publicacion]);

  useEffect(() => {
    if (!anuncio || !selectedProject?.nit) return;

    const archivos = anuncio.archivos_nombres;
    if (!Array.isArray(archivos) || !archivos.length) return;

    let active = true;
    const nit = selectedProject.nit;
    const tipo = anuncio.tipo;

    (async () => {
      // Descargar todas las URLs en paralelo con Promise.all
      const urlPromises = archivos.map((name) =>
        s3Service.getPublicacionImageUrl(nit, tipo, name)
      );

      try {
        const results = await Promise.all(urlPromises);
        const urls = results
          .filter((result) => result.success && result.url)
          .map((result) => result.url!);

        if (active) setImageUrls(urls);
      } catch (error) {
        console.error("Error cargando imágenes:", error);
      }
    })();

    return () => {
      active = false;
    };
  }, [anuncio, selectedProject?.nit]);

  const handleBlock = () => {
    setShowBlockModal(true);
  };

  const handleShowError = (message: string) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const handleConfirmBlock = async (razon: string) => {
    if (!anuncio) return;
    try {
      const response = await publicacionesService.bloquearPublicacion(
        anuncio.id,
        razon
      );

      if (response.success) {
        setSuccessMessage("Publicación bloqueada correctamente");
        setShowSuccessModal(true);
      } else {
        setErrorMessage(response.error || "No se pudo bloquear la publicación");
        setShowErrorModal(true);
      }
    } catch {
      setErrorMessage("No se pudo bloquear la publicación");
      setShowErrorModal(true);
    }
  };

  if (!anuncio) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <Text>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollContent}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {imageUrls.length > 0 ? (
          <View style={styles.imageGalleryContainer}>
            <TouchableOpacity
              style={styles.floatingBackButton}
              onPress={() => router.back()}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={THEME.colors.text.primary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mainImageContainer}
              onPress={() => setShowImageModal(true)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: imageUrls[selectedImageIndex] }}
                style={styles.mainImage}
                resizeMode="contain"
              />
            </TouchableOpacity>

            {imageUrls.length > 1 && (
              <View style={styles.thumbnailsContainer}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbnailsContent}
                >
                  {imageUrls.map((url, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setSelectedImageIndex(index)}
                      style={[
                        styles.thumbnail,
                        selectedImageIndex === index &&
                          styles.thumbnailSelected,
                      ]}
                    >
                      <Image
                        source={{ uri: url }}
                        style={styles.thumbnailImage}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.headerWithoutImages}>
            <TouchableOpacity
              style={styles.backButtonNoImages}
              onPress={() => router.back()}
            >
              <Ionicons
                name="arrow-back"
                size={24}
                color={THEME.colors.text.primary}
              />
            </TouchableOpacity>
          </View>
        )}

        <PublicacionInfoSection
          anuncio={anuncio}
          onBlock={handleBlock}
          onShowError={handleShowError}
        />
      </ScrollView>

      <BloquearPublicacionModal
        visible={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onConfirm={handleConfirmBlock}
        publicacionTitulo={anuncio.titulo}
      />

      {/* Modal de imagen en grande */}
      <Modal
        visible={showImageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
        statusBarTranslucent
      >
        <View style={styles.imageModalOverlay}>
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={() => setShowImageModal(false)}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>

          <Image
            source={{ uri: imageUrls[selectedImageIndex] }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
        </View>
      </Modal>

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

      <ConfirmModal
        visible={showSuccessModal}
        type="info"
        title="Éxito"
        message={successMessage}
        confirmText="Aceptar"
        onConfirm={() => {
          setShowSuccessModal(false);
          router.back();
        }}
        onCancel={() => {
          setShowSuccessModal(false);
          router.back();
        }}
        showCancel={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  floatingBackButton: {
    position: "absolute",
    top: THEME.spacing.md,
    left: THEME.spacing.md,
    width: 40,
    height: 40,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: THEME.spacing.lg,
  },
  imageGalleryContainer: {
    position: "relative",
    backgroundColor: THEME.colors.background,
  },
  mainImageContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 0.85,
    backgroundColor: THEME.colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  mainImage: {
    width: "100%",
    height: "100%",
  },
  thumbnailsContainer: {
    backgroundColor: THEME.colors.surface,
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
  },
  thumbnailsContent: {
    gap: THEME.spacing.sm,
    paddingRight: THEME.spacing.lg,
  },
  thumbnail: {
    width: 64,
    height: 64,
    borderRadius: THEME.borderRadius.md,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.background,
  },
  thumbnailSelected: {
    borderColor: THEME.colors.primary,
    borderWidth: 2.5,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  headerWithoutImages: {
    backgroundColor: THEME.colors.surface,
    paddingTop: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backButtonNoImages: {
    width: 44,
    height: 44,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
  },
});
