import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";
import { Aviso } from "@/types/Avisos";
import { AvisoFiles } from "./AvisoFiles";
import {
  getAvisoIcon,
  getAvisoColor,
  formatEventDate,
  formatRelativeTime,
} from "@/utils/avisoUtils";

interface AvisoItemProps {
  aviso: Aviso;
  isVisible: boolean;
}

const AvisoItem = React.memo(({ aviso, isVisible }: AvisoItemProps) => {
  const fileNames = React.useMemo(() => {
    try {
      const parsed = aviso.archivos_nombres
        ? JSON.parse(aviso.archivos_nombres)
        : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }, [aviso.archivos_nombres]);

  const imageFiles = React.useMemo(
    () =>
      fileNames.filter(
        (fileName: string) =>
          typeof fileName === "string" &&
          fileName.match(/\.(jpg|jpeg|png|gif)$/i)
      ),
    [fileNames]
  );

  const showImageFirst = imageFiles.length === 1 && fileNames.length === 1;
  const showImageLast =
    fileNames.length > 1 || (fileNames.length === 1 && imageFiles.length === 0);

  return (
    <View style={styles.avisoPost}>
      <View style={styles.postHeader}>
        <View
          style={[
            styles.avatarContainer,
            { backgroundColor: `${getAvisoColor(aviso.prioridad)}15` },
          ]}
        >
          <Ionicons
            name={getAvisoIcon(aviso.tipo) as keyof typeof Ionicons.glyphMap}
            size={20}
            color={getAvisoColor(aviso.prioridad)}
          />
        </View>
        <View style={styles.userDetails}>
          <Text style={styles.publisherName}>Administración</Text>
          <Text style={styles.timestamp}>
            {formatRelativeTime(aviso.fecha_creacion)}
          </Text>
        </View>
      </View>

      {showImageFirst && (
        <AvisoFiles
          avisoId={aviso.id}
          archivos_nombres={aviso.archivos_nombres}
          isVisible={isVisible}
        />
      )}

      <View style={styles.postContent}>
        <Text style={styles.postTitle}>{aviso.titulo}</Text>
        <Text style={styles.postDescription}>{aviso.descripcion}</Text>
      </View>

      {showImageLast && (
        <AvisoFiles
          avisoId={aviso.id}
          archivos_nombres={aviso.archivos_nombres}
          isVisible={isVisible}
        />
      )}

      {aviso.fecha_evento && (
        <View style={styles.eventInfo}>
          <Ionicons name="calendar" size={16} color={THEME.colors.primary} />
          <Text style={styles.eventText}>
            Programado para: {formatEventDate(aviso.fecha_evento)}
          </Text>
        </View>
      )}
    </View>
  );
});

AvisoItem.displayName = "AvisoItem";

export default AvisoItem;

const styles = StyleSheet.create({
  avisoPost: {
    backgroundColor: "white",
    borderRadius: 16,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  publisherName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    color: "#64748B",
  },
  postContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 8,
    lineHeight: 24,
  },
  postDescription: {
    fontSize: 15,
    color: "#374151",
    lineHeight: 22,
  },
  eventInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 8,
    gap: 8,
  },
  eventText: {
    fontSize: 13,
    color: THEME.colors.primary,
    fontWeight: "500",
  },
});
