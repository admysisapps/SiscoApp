import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Image,
  Dimensions,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { Publicacion } from "../../../types/publicaciones";
import { s3Service } from "../../../services/s3Service";
import { publicacionesService } from "../../../services/publicacionesService";
import { useProject } from "../../../contexts/ProjectContext";
import { useRole } from "../../../hooks/useRole";
import { THEME } from "../../../constants/theme";
import BloquearPublicacionModal from "../../../components/publicaciones/BloquearPublicacionModal";
import ConfirmModal from "../../../components/asambleas/ConfirmModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface InfoSectionProps {
  anuncio: Publicacion;
  onBlock?: () => void;
  onShowError: (message: string) => void;
}

function InfoSection({ anuncio, onBlock, onShowError }: InfoSectionProps) {
  const { isAdmin } = useRole();

  const handleCall = async () => {
    const phoneNumber = anuncio.contacto.replace(/[^0-9]/g, "");
    if (!phoneNumber || phoneNumber.length < 7) {
      onShowError("Número de teléfono inválido");
      return;
    }
    try {
      const canOpen = await Linking.canOpenURL(`tel:${phoneNumber}`);
      if (canOpen) {
        await Linking.openURL(`tel:${phoneNumber}`);
      } else {
        onShowError("No se pudo abrir la aplicación de teléfono");
      }
    } catch (error) {
      console.error("Error opening phone:", error);
      onShowError("No se pudo realizar la llamada");
    }
  };

  const handleWhatsApp = async () => {
    const phoneNumber = anuncio.contacto.replace(/[^0-9]/g, "");
    if (!phoneNumber || phoneNumber.length < 7) {
      onShowError("Número de teléfono inválido");
      return;
    }
    const message = `Hola, me interesa tu publicación: ${anuncio.titulo}`;
    try {
      const canOpen = await Linking.canOpenURL(
        `whatsapp://send?phone=${phoneNumber}`
      );
      if (canOpen) {
        await Linking.openURL(
          `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`
        );
      } else {
        onShowError("WhatsApp no está instalado");
      }
    } catch (error) {
      console.error("Error opening WhatsApp:", error);
      onShowError("No se pudo abrir WhatsApp");
    }
  };

  const getTypeIcon = (tipo: string) => {
    switch (tipo) {
      case "servicios":
        return { library: "ionicons", name: "construct" };
      case "inmuebles":
        return { library: "ionicons", name: "home" };
      case "productos":
        return { library: "material", name: "emoji-objects" };
      default:
        return { library: "ionicons", name: "pricetag" };
    }
  };

  return (
    <View style={styles.content}>
      <View style={styles.typeSection}>
        <View style={styles.typeBadge}>
          {getTypeIcon(anuncio.tipo).library === "material" ? (
            <MaterialIcons
              name={getTypeIcon(anuncio.tipo).name as any}
              size={14}
              color={THEME.colors.text.secondary}
            />
          ) : (
            <Ionicons
              name={getTypeIcon(anuncio.tipo).name as any}
              size={14}
              color={THEME.colors.text.secondary}
            />
          )}
          <Text style={styles.typeText}>
            {anuncio.tipo.charAt(0).toUpperCase() + anuncio.tipo.slice(1)}
          </Text>
        </View>
      </View>

      {anuncio.estado === "bloqueada" && anuncio.razon_bloqueo && (
        <View style={styles.blockAlert}>
          <Ionicons name="warning" size={20} color={THEME.colors.error} />
          <View style={styles.blockAlertContent}>
            <Text style={styles.blockAlertTitle}>Publicación bloqueada</Text>
            <Text style={styles.blockAlertText}>{anuncio.razon_bloqueo}</Text>
          </View>
        </View>
      )}

      {anuncio.precio > 0 && (
        <View style={styles.priceSection}>
          <Text style={styles.priceText}>
            ${anuncio.precio.toLocaleString()}
          </Text>
          {anuncio.negociable ? (
            <View style={styles.negotiableBadge}>
              <Text style={styles.negotiableText}>Negociable</Text>
            </View>
          ) : null}
        </View>
      )}

      <View style={styles.infoSection}>
        <Text style={styles.titulo}>{anuncio.titulo || "Sin título"}</Text>
        <Text style={styles.descripcion}>
          {anuncio.descripcion || "Sin descripción disponible"}
        </Text>
      </View>

      <View style={styles.userSection}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userInitial}>
              {anuncio.usuario?.nombre
                ? anuncio.usuario.nombre.charAt(0).toUpperCase()
                : "U"}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {anuncio.usuario
                ? `${anuncio.usuario.nombre || ""} ${anuncio.usuario.apellido || ""}`.trim() ||
                  "Usuario"
                : "Usuario"}
            </Text>
            <View style={styles.contactInfo}>
              <Ionicons
                name="call"
                size={14}
                color={THEME.colors.text.secondary}
              />
              <Text style={styles.phoneNumber}>
                {anuncio.contacto || "No disponible"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
            <Ionicons name="call" size={18} color={THEME.colors.phone} />
            <Text style={styles.contactButtonText}>Llamar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.whatsappButton}
            onPress={handleWhatsApp}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
            <Text style={styles.whatsappButtonText}>WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {isAdmin && onBlock && (
          <TouchableOpacity style={styles.blockButton} onPress={onBlock}>
            <Ionicons name="ban" size={18} color={THEME.colors.error} />
            <Text style={styles.blockButtonText}>Bloquear Publicación</Text>
          </TouchableOpacity>
        )}

        {anuncio.estado === "bloqueada" && anuncio.fecha_moderacion && (
          <View style={styles.moderationInfo}>
            <Text style={styles.moderationText}>
              Bloqueada el{" "}
              {new Date(anuncio.fecha_moderacion).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function PublicacionDetalleScreen() {
  const params = useLocalSearchParams();
  const { selectedProject } = useProject();
  const [anuncio, setAnuncio] = useState<Publicacion | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
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
    if (!anuncio || !selectedProject?.NIT) return;

    const archivos = anuncio.archivos_nombres;
    if (!Array.isArray(archivos) || !archivos.length) return;

    let active = true;
    const nit = selectedProject.NIT;
    const tipo = anuncio.tipo;

    (async () => {
      const urls: string[] = [];
      for (const name of archivos) {
        try {
          const result = await s3Service.getPublicacionImageUrl(
            nit,
            tipo,
            name
          );
          if (result.success && result.url) urls.push(result.url);
        } catch {}
      }
      if (active) setImageUrls(urls);
    })();

    return () => {
      active = false;
    };
  }, [anuncio, selectedProject?.NIT]);

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

            <View style={styles.mainImageContainer}>
              <Image
                source={{ uri: imageUrls[selectedImageIndex] }}
                style={styles.mainImage}
                resizeMode="contain"
              />
            </View>

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

        <InfoSection
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
  typeSection: {
    marginBottom: THEME.spacing.md,
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surfaceLight,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 6,
    borderRadius: THEME.borderRadius.sm,
    gap: 6,
    alignSelf: "flex-start",
  },
  typeText: {
    fontSize: THEME.fontSize.xs,
    fontWeight: "600",
    color: THEME.colors.text.secondary,
    textTransform: "uppercase",
  },
  content: {
    padding: THEME.spacing.lg,
    backgroundColor: THEME.colors.surface,
  },
  priceSection: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: THEME.spacing.md,
    gap: THEME.spacing.sm,
    flexWrap: "wrap",
  },
  priceText: {
    fontSize: 28,
    fontWeight: "700",
    color: THEME.colors.text.primary,
    letterSpacing: -0.5,
  },
  negotiableBadge: {
    backgroundColor: "#FEE2E2",
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.sm,
  },
  negotiableText: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.colors.error,
    textTransform: "uppercase",
  },
  infoSection: {
    marginBottom: THEME.spacing.lg,
    paddingBottom: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  titulo: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    lineHeight: 28,
    marginBottom: THEME.spacing.sm,
    letterSpacing: -0.2,
  },
  descripcion: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    lineHeight: 24,
  },
  userSection: {
    backgroundColor: THEME.colors.surface,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  userInitial: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "700",
    color: THEME.colors.text.inverse,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.primary,
    fontWeight: "600",
    marginBottom: 2,
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME.spacing.xs,
  },
  phoneNumber: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.text.secondary,
    fontWeight: "400",
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
  actionButtons: {
    flexDirection: "row",
    gap: THEME.spacing.sm,
  },
  contactButton: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "#007AFF",
  },
  contactButtonText: {
    color: "#007AFF",
    fontSize: THEME.fontSize.sm,
    fontWeight: "600",
  },
  whatsappButton: {
    flex: 1,
    backgroundColor: "#25D366",
    borderRadius: THEME.borderRadius.md,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  whatsappButtonText: {
    color: THEME.colors.text.inverse,
    fontSize: THEME.fontSize.sm,
    fontWeight: "600",
  },
  blockButton: {
    marginTop: THEME.spacing.md,
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    borderRadius: THEME.borderRadius.md,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  blockButtonText: {
    color: THEME.colors.error,
    fontSize: THEME.fontSize.sm,
    fontWeight: "600",
  },
  blockAlert: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
    borderColor: "#FCA5A5",
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    gap: THEME.spacing.md,
  },
  blockAlertContent: {
    flex: 1,
  },
  blockAlertTitle: {
    fontSize: THEME.fontSize.sm,
    fontWeight: "700",
    color: THEME.colors.error,
    marginBottom: 6,
  },
  blockAlertText: {
    fontSize: THEME.fontSize.xs,
    color: "#991B1B",
    lineHeight: 22,
  },
  moderationInfo: {
    marginTop: THEME.spacing.md,
    paddingTop: THEME.spacing.md,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  moderationText: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.text.muted,
    textAlign: "center",
  },
});
