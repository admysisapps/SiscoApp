import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ImageGallery } from "@/components/shared/ImageGallery";
import { THEME } from "@/constants/theme";

interface ArchivoSeleccionado {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
  uploaded?: boolean;
}

interface PqrFileUploadProps {
  archivo: ArchivoSeleccionado | null;
  uploading: boolean;
  onSelect: () => void;
  onRemove: () => void;
}

export default function PqrFileUpload({
  archivo,
  uploading,
  onSelect,
  onRemove,
}: PqrFileUploadProps) {
  return (
    <>
      <TouchableOpacity
        style={[styles.uploadButton, uploading && styles.disabled]}
        onPress={onSelect}
        disabled={uploading}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name="cloud-upload-outline"
            size={32}
            color={THEME.colors.indigo}
          />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.uploadText}>
            {uploading ? "Subiendo archivo..." : "Seleccionar archivo"}
          </Text>
          <Text style={styles.hint}>PDF, Imágenes, Documentos (Máx 10MB)</Text>
        </View>
      </TouchableOpacity>

      {archivo && (
        <View
          style={[styles.fileCard, archivo.uploaded && styles.fileCardUploaded]}
        >
          <View
            style={[
              styles.fileIcon,
              archivo.uploaded && styles.fileIconUploaded,
            ]}
          >
            <Ionicons
              name={
                archivo.uploaded
                  ? "checkmark-circle"
                  : archivo.mimeType?.startsWith("image/")
                    ? "image-outline"
                    : "document-text-outline"
              }
              size={28}
              color={
                archivo.uploaded ? THEME.colors.success : THEME.colors.indigo
              }
            />
          </View>

          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {archivo.name}
            </Text>
            {archivo.uploaded ? (
              <View style={styles.uploadedBadge}>
                <Ionicons
                  name="checkmark"
                  size={12}
                  color={THEME.colors.success}
                />
                <Text style={styles.uploadedText}>Subido</Text>
              </View>
            ) : (
              <Text style={styles.readyText}>Listo para enviar</Text>
            )}
          </View>

          <TouchableOpacity
            onPress={onRemove}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="trash-outline"
              size={20}
              color={THEME.colors.error}
            />
          </TouchableOpacity>
        </View>
      )}

      {archivo?.mimeType?.startsWith("image/") && (
        <ImageGallery images={[archivo.uri]} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  uploadButton: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: THEME.colors.indigo + "30",
    borderStyle: "dashed",
    borderRadius: THEME.borderRadius.lg,
    paddingVertical: THEME.spacing.xl,
    paddingHorizontal: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    gap: THEME.spacing.sm,
    backgroundColor: THEME.colors.indigo + "05",
  },
  disabled: { opacity: 0.6 },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: THEME.borderRadius.lg,
    backgroundColor: THEME.colors.indigo + "15",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: THEME.spacing.xs,
  },
  textContainer: { alignItems: "center", gap: THEME.spacing.xs },
  uploadText: {
    color: THEME.colors.indigo,
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },
  hint: {
    color: THEME.colors.text.secondary,
    fontSize: THEME.fontSize.xs,
    textAlign: "center",
  },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surface,
    borderWidth: 1.5,
    borderColor: THEME.colors.indigo + "30",
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
    gap: THEME.spacing.sm,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  fileCardUploaded: {
    borderColor: THEME.colors.success + "40",
    backgroundColor: THEME.colors.success + "08",
  },
  fileIcon: {
    width: 48,
    height: 48,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.indigo + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  fileIconUploaded: { backgroundColor: THEME.colors.success + "15" },
  fileInfo: { flex: 1, gap: THEME.spacing.xs },
  fileName: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  uploadedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: THEME.colors.success + "15",
    paddingHorizontal: THEME.spacing.xs,
    paddingVertical: 2,
    borderRadius: THEME.borderRadius.sm,
    alignSelf: "flex-start",
  },
  uploadedText: {
    fontSize: THEME.fontSize.xs,
    fontWeight: "600",
    color: THEME.colors.success,
  },
  readyText: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.text.secondary,
  },
});
