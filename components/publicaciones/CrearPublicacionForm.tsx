import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  CreatePublicacionRequest,
  TipoPublicacion,
} from "@/types/publicaciones";
import { publicacionesService } from "@/services/publicacionesService";
import { s3Service } from "@/services/s3Service";
import * as ImagePicker from "expo-image-picker";
import { useProject } from "@/contexts/ProjectContext";
import { THEME, COLORS } from "@/constants/theme";
import Toast from "@/components/Toast";
import ScreenHeader from "@/components/shared/ScreenHeader";

const { width } = Dimensions.get("window");

const categorias = [
  {
    id: "inmuebles" as TipoPublicacion,
    titulo: "Inmuebles",
  },
  {
    id: "productos" as TipoPublicacion,
    titulo: "Productos",
  },
  {
    id: "servicios" as TipoPublicacion,
    titulo: "Servicios",
  },
];

interface CrearAnuncioFormProps {
  onClose: () => void;
}

export default function CrearAnuncioForm({ onClose }: CrearAnuncioFormProps) {
  const { selectedProject } = useProject();
  const insets = useSafeAreaInsets();
  const [categoria, setCategoria] = useState<TipoPublicacion>("inmuebles");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });

  const formatearPrecio = (text: string) => {
    const numeros = text.replace(/[^0-9]/g, "");
    if (!numeros) return "";
    return numeros.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const handlePrecioChange = (text: string) => {
    const formateado = formatearPrecio(text);
    setPrecio(formateado);
  };
  const [negociable, setNegociable] = useState(false);
  const [telefono, setTelefono] = useState("");
  const [loading, setLoading] = useState(false);
  const [imagenes, setImagenes] = useState<
    { uri: string; name: string; type?: string }[]
  >([]);

  const crearPublicacion = async () => {
    if (!titulo.trim()) {
      setToast({
        visible: true,
        message: "Falta el título del anuncio",
        type: "warning",
      });
      return;
    }

    if (!descripcion.trim()) {
      setToast({
        visible: true,
        message: "Falta la descripción del anuncio",
        type: "warning",
      });
      return;
    }

    if (!precio.trim()) {
      setToast({
        visible: true,
        message: "Falta el precio del anuncio",
        type: "warning",
      });
      return;
    }

    if (!telefono.trim()) {
      setToast({
        visible: true,
        message: "Falta el número de teléfono",
        type: "warning",
      });
      return;
    }

    if (!/^3[0-9]{9}$/.test(telefono.trim())) {
      setToast({
        visible: true,
        message: "El teléfono debe empezar con 3 y tener 10 dígitos",
        type: "warning",
      });
      return;
    }

    setLoading(true);
    try {
      const fechaExpiracion = new Date();
      fechaExpiracion.setDate(fechaExpiracion.getDate() + 30);

      let archivosNombres: string[] = [];

      // Subir imágenes a S3 si hay alguna
      if (imagenes.length > 0) {
        if (!selectedProject?.nit) {
          throw new Error("No hay proyecto seleccionado");
        }

        const uploadResult = await s3Service.uploadPublicacionFiles(
          selectedProject.nit,
          categoria,
          imagenes
        );

        if (!uploadResult.success) {
          throw new Error(uploadResult.error || "Error subiendo imágenes");
        }

        archivosNombres = uploadResult.fileNames || [];
      }

      const publicacionData: CreatePublicacionRequest = {
        tipo: categoria,
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        precio: parseFloat(precio.replace(/\./g, "")),
        negociable,
        contacto: telefono.trim(),
        fecha_expiracion: fechaExpiracion.toISOString(),
        archivos_nombres: archivosNombres,
      };

      await publicacionesService.crearPublicacion(publicacionData);

      setToast({
        visible: true,
        message: "Publicación creada exitosamente",
        type: "success",
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Error:", error);
      setToast({
        visible: true,
        message: "No se pudo crear la publicación. Intenta nuevamente.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const seleccionarImagen = async () => {
    if (imagenes.length >= 5) {
      setToast({
        visible: true,
        message: "Máximo 5 imágenes por publicación",
        type: "warning",
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: false,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const newImage = {
        uri: asset.uri,
        name: `imagen_${Date.now()}.jpg`,
        type: "image/jpeg",
      };
      setImagenes([...imagenes, newImage]);
    }
  };

  const eliminarImagen = (index: number) => {
    setImagenes(imagenes.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Crear Anuncio" onBackPress={onClose} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <LinearGradient colors={["#FAFAFA", "#F5F5F5"]} style={styles.gradient}>
          <ScrollView
            style={styles.content}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: 20 + insets.bottom },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Categoría */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Categoría</Text>
              <View style={styles.categoriaTabs}>
                {categorias.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoriaTab,
                      categoria === cat.id && styles.categoriaTabActiva,
                    ]}
                    onPress={() => setCategoria(cat.id)}
                  >
                    <Text
                      style={[
                        styles.categoriaTabText,
                        categoria === cat.id && styles.categoriaTabTextActiva,
                      ]}
                    >
                      {cat.titulo}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Título */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Título del Anuncio</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Vendo Sofá de 3 puestos"
                value={titulo}
                onChangeText={setTitulo}
                placeholderTextColor={COLORS.text.muted}
              />
            </View>

            {/* Descripción */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Descripción</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Añade más detalles sobre tu artículo, condición, características..."
                value={descripcion}
                onChangeText={setDescripcion}
                multiline
                numberOfLines={4}
                placeholderTextColor={COLORS.text.muted}
              />
            </View>

            {/* Precio */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Precio</Text>
              <View style={styles.precioInputContainer}>
                <Text style={styles.dollarSign}>$</Text>
                <TextInput
                  style={styles.precioInput}
                  placeholder="1.500.000"
                  value={precio}
                  onChangeText={handlePrecioChange}
                  keyboardType="numeric"
                  placeholderTextColor={COLORS.text.muted}
                />
              </View>
              {precio === "0" && (
                <View style={styles.precioWarning}>
                  <Ionicons
                    name="information-circle"
                    size={16}
                    color={THEME.colors.warning}
                  />
                  <Text style={styles.precioWarningText}>
                    Tu publicación se mostrará sin precio
                  </Text>
                </View>
              )}
              <View style={styles.negociableContainer}>
                <TouchableOpacity
                  style={[styles.checkbox, negociable && styles.checkboxActivo]}
                  onPress={() => setNegociable(!negociable)}
                >
                  {negociable && (
                    <Ionicons
                      name="checkmark"
                      size={16}
                      color={THEME.colors.text.inverse}
                    />
                  )}
                </TouchableOpacity>
                <Text style={styles.negociableText}>Precio negociable</Text>
              </View>
            </View>

            {/* Fotos */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Fotos ({imagenes.length}/5)</Text>
              <View style={styles.fotosGrid}>
                {imagenes.map((imagen, index) => (
                  <View key={index} style={styles.fotoContainer}>
                    <Image source={{ uri: imagen.uri }} style={styles.foto} />
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => eliminarImagen(index)}
                    >
                      <Ionicons
                        name="close-circle"
                        size={24}
                        color={THEME.colors.error}
                      />
                    </TouchableOpacity>
                  </View>
                ))}
                {imagenes.length < 5 && (
                  <TouchableOpacity
                    style={styles.addFotoButton}
                    onPress={seleccionarImagen}
                  >
                    <Ionicons
                      name="camera"
                      size={32}
                      color={THEME.colors.text.secondary}
                    />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Información de Contacto */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Información de Contacto</Text>
              <View style={styles.inputContainer}>
                <Ionicons
                  name="call-outline"
                  size={20}
                  color={THEME.colors.text.secondary}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.inputPhone}
                  placeholder="Número de teléfono"
                  value={telefono}
                  onChangeText={setTelefono}
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholderTextColor={COLORS.text.muted}
                />
              </View>
            </View>

            {/* Botón Publicar */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.publishButton, loading && styles.buttonDisabled]}
                onPress={crearPublicacion}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator
                    size="small"
                    color={THEME.colors.text.inverse}
                  />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color={THEME.colors.text.inverse}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.publishButtonText}>
                      Publicar Anuncio
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </LinearGradient>
      </KeyboardAvoidingView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAFA",
  },
  keyboardView: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  fieldGroup: {
    marginBottom: THEME.spacing.lg,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.text.heading,
    marginBottom: 8,
  },
  categoriaTabs: {
    flexDirection: "row",
    gap: THEME.spacing.sm,
  },
  categoriaTab: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  categoriaTabActiva: {
    backgroundColor: THEME.colors.primary,
    shadowOpacity: 0.2,
    elevation: 5,
  },
  categoriaTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.text.secondary,
  },
  categoriaTabTextActiva: {
    color: THEME.colors.text.inverse,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 52,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  inputIcon: {
    marginRight: THEME.spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.heading,
    minHeight: 52,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  inputPhone: {
    flex: 1,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.heading,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  precioInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: THEME.spacing.md,
    minHeight: 52,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  dollarSign: {
    fontSize: 18,
    color: THEME.colors.primary,
    marginRight: THEME.spacing.xs,
    fontWeight: "600",
  },
  precioInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.heading,
  },
  precioWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.warningLight,
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm,
    borderRadius: 8,
    marginBottom: THEME.spacing.sm,
    gap: THEME.spacing.xs,
  },
  precioWarningText: {
    flex: 1,
    fontSize: 13,
    color: THEME.colors.text.warningDark,
    fontWeight: "500",
  },
  negociableContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: THEME.spacing.xs,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: THEME.colors.border,
    borderRadius: 6,
    marginRight: THEME.spacing.sm,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: THEME.colors.surface,
  },
  checkboxActivo: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  negociableText: {
    fontSize: 14,
    color: THEME.colors.text.heading,
  },
  fotosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  fotoContainer: {
    position: "relative",
    width: (width - 88) / 3,
  },
  foto: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
  },
  addFotoButton: {
    width: (width - 88) / 3,
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: THEME.colors.border,
    borderStyle: "dashed",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: THEME.colors.surfaceLight,
  },
  buttonContainer: {
    marginTop: 24,
  },
  publishButton: {
    backgroundColor: THEME.colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  publishButtonText: {
    color: THEME.colors.text.inverse,
    fontSize: 16,
    fontWeight: "700",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  deleteButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});
