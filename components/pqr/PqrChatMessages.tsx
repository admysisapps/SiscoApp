import React, { useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import { KeyboardChatScrollView } from "react-native-keyboard-controller";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";
import PqrChatMessage, { Mensaje, MensajeRol } from "./PqrChatMessage";

type ScrollRef = React.ElementRef<typeof KeyboardChatScrollView>;

interface PqrChatMessagesProps {
  mensajes: Mensaje[];
  rolActual: MensajeRol;
  isAdmin: boolean;
  estadoPqr: string;
  offset?: number;
  staticContent?: React.ReactNode;
}

export default function PqrChatMessages({
  mensajes,
  rolActual,
  isAdmin,
  estadoPqr,
  offset = 0,
  staticContent,
}: PqrChatMessagesProps) {
  const scrollRef = useRef<ScrollRef>(null);

  return (
    <KeyboardChatScrollView
      ref={scrollRef}
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      keyboardLiftBehavior="always"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustContentInsets={false}
      contentInsetAdjustmentBehavior="never"
      offset={offset}
      onContentSizeChange={() =>
        scrollRef.current?.scrollToEnd({ animated: true })
      }
    >
      {/* Contenido estático arriba */}
      {staticContent}

      {/* Separador chat */}
      <View style={styles.chatCard}>
        <View style={styles.header}>
          <Ionicons name="chatbubbles" size={20} color={THEME.colors.primary} />
          <Text style={styles.title}>Seguimiento</Text>
        </View>

        {mensajes.length === 0 ? (
          <Text style={styles.empty}>No hay mensajes aún</Text>
        ) : (
          mensajes.map((mensaje) => (
            <PqrChatMessage
              key={mensaje.id}
              mensaje={mensaje}
              rolActual={rolActual}
            />
          ))
        )}

        {isAdmin && estadoPqr === "Pendiente" && (
          <View style={styles.infoCard}>
            <Ionicons
              name="information-circle"
              size={16}
              color={THEME.colors.info}
            />
            <Text style={styles.infoText}>
              Al responder, la PQR cambiará automáticamente a estado{" "}
              <Text style={styles.infoBold}>En Proceso</Text>
            </Text>
          </View>
        )}
      </View>
    </KeyboardChatScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  chatCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginLeft: 8,
  },
  empty: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 13,
    fontStyle: "italic",
    paddingVertical: 24,
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: "#1e40af",
    lineHeight: 18,
  },
  infoBold: {
    fontWeight: "600",
  },
});
