import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  useAnimatedReaction,
  SharedValue,
} from "react-native-reanimated";
import { Documento } from "@/types/Documento";

interface DocumentoItemProps {
  documento: Documento;
  onDescargar: () => void;
  onEliminar: () => void;
  openItemId: SharedValue<string | null>;
  isDownloading?: boolean;
}

export const DocumentoItem: React.FC<DocumentoItemProps> = ({
  documento,
  onDescargar,
  onEliminar,
  openItemId,
  isDownloading = false,
}) => {
  const translateX = useSharedValue(0);
  const savedPosition = useSharedValue(0);

  // Cerrar este item si otro se abre
  useAnimatedReaction(
    () => openItemId.value,
    (current, previous) => {
      if (
        current !== null &&
        current !== documento.id &&
        previous === documento.id
      ) {
        translateX.value = withSpring(0);
        savedPosition.value = 0;
      }
    }
  );

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onStart(() => {
      savedPosition.value = translateX.value;
    })
    .onUpdate((event) => {
      const newValue = savedPosition.value + event.translationX;
      if (newValue < 0 && newValue > -80) {
        translateX.value = newValue;
      }
    })
    .onEnd((event) => {
      const finalPosition = savedPosition.value + event.translationX;
      if (finalPosition < -40) {
        translateX.value = withSpring(-80);
        savedPosition.value = -80;
        openItemId.value = documento.id;
      } else {
        translateX.value = withSpring(0);
        savedPosition.value = 0;
        if (openItemId.value === documento.id) {
          openItemId.value = null;
        }
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const handleDelete = () => {
    translateX.value = withTiming(0, { duration: 200 }, (finished) => {
      if (finished && openItemId.value === documento.id) {
        openItemId.value = null;
      }
    });
    setTimeout(() => onEliminar(), 200);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.deleteBackground}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.container, animatedStyle]}>
          <TouchableOpacity
            style={styles.touchable}
            onPress={onDescargar}
            activeOpacity={0.7}
          >
            <Ionicons
              name="document-text-outline"
              size={24}
              color={THEME.colors.primary}
            />
            <View style={styles.documentoInfo}>
              <Text style={styles.documentoNombre} numberOfLines={2}>
                {documento.nombre}
              </Text>
              <Text style={styles.documentoMeta}>
                {documento.tipo} • {documento.tamaño} • {documento.fecha}
              </Text>
            </View>
            <View style={styles.iconContainer}>
              {isDownloading ? (
                <ActivityIndicator size="small" color={THEME.colors.primary} />
              ) : !documento.enCache ? (
                <Ionicons
                  name="download-outline"
                  size={20}
                  color={THEME.colors.primary}
                />
              ) : (
                <View style={styles.iconPlaceholder} />
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    overflow: "hidden",
    marginHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.md,
  },
  deleteBackground: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: "#f44336",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: THEME.borderRadius.md,
  },
  deleteButton: {
    width: 80,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  touchable: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
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
  iconContainer: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  iconPlaceholder: {
    width: 20,
    height: 20,
  },
});
