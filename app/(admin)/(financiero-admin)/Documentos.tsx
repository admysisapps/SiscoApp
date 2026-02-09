import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { THEME } from "@/constants/theme";
import ScreenHeader from "@/components/shared/ScreenHeader";
import { DocumentoItem } from "@/components/siscoweb/admin/Documentos/DocumentoItem";
import {
  DOCUMENTOS_MOCK,
  Documento,
} from "@/components/siscoweb/admin/Documentos/documentosMock";

export default function Documentos() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [documentos, setDocumentos] = useState<Documento[]>(DOCUMENTOS_MOCK);

  const handleSubirDocumento = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        const nuevoDoc: Documento = {
          id: Date.now().toString(),
          nombre: file.name,
          tipo: file.name.split(".").pop()?.toUpperCase() || "FILE",
          tamaño: `${(file.size! / 1024 / 1024).toFixed(2)} MB`,
          fecha: new Date().toLocaleDateString("es-ES"),
          categoria: "Legal",
        };

        setDocumentos([nuevoDoc, ...documentos]);
        Alert.alert("Éxito", "Documento subido correctamente");
      }
    } catch {
      Alert.alert("Error", "No se pudo subir el documento");
    }
  };

  const handleEliminarDocumento = (id: string) => {
    Alert.alert(
      "Eliminar Documento",
      "¿Estás seguro de eliminar este documento?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            setDocumentos(documentos.filter((doc) => doc.id !== id));
          },
        },
      ]
    );
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
          {documentos.length === 0 ? (
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
              <DocumentoItem
                key={doc.id}
                documento={doc}
                onDescargar={() => console.log("Descargar:", doc.nombre)}
                onEliminar={() => handleEliminarDocumento(doc.id)}
              />
            ))
          )}
        </ScrollView>

        <TouchableOpacity
          style={[
            styles.uploadButton,
            { bottom: THEME.spacing.lg + insets.bottom },
          ]}
          onPress={handleSubirDocumento}
          activeOpacity={0.7}
        >
          <View style={styles.uploadIconContainer}>
            <Ionicons
              name="cloud-upload-outline"
              size={22}
              color={THEME.colors.primary}
            />
          </View>
          <Text style={styles.uploadButtonText}>Subir Documento</Text>
        </TouchableOpacity>
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
  documentosList: {
    flex: 1,
    paddingHorizontal: THEME.spacing.lg,
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
});
