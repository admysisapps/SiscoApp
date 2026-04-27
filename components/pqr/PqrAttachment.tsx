import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";

interface PqrAttachmentProps {
  archivoNombre: string;
  onPress: () => void;
}

export default function PqrAttachment({
  archivoNombre,
  onPress,
}: PqrAttachmentProps) {
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(archivoNombre);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.icon}>
        <Ionicons
          name={isImage ? "image" : "document"}
          size={24}
          color="white"
        />
      </View>
      <View style={styles.info}>
        <Text style={styles.title}>
          {isImage ? "Imagen adjunta" : "Archivo adjunto"}
        </Text>
        <Text style={styles.subtitle}>Toca para ver</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
  },
  subtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
});
