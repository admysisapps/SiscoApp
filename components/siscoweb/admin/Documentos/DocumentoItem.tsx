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
            style={styles.info}
            onPress={onDescargar}
            activeOpacity={0.7}
          >
            <Text style={styles.nombre} numberOfLines={2}>
              {documento.nombre}
            </Text>
            <Text style={styles.fecha}>{documento.fecha}</Text>
          </TouchableOpacity>
          <View style={styles.iconContainer}>
            {isDownloading ? (
              <ActivityIndicator size="small" color={THEME.colors.primary} />
            ) : !documento.enCache ? (
              <TouchableOpacity
                style={styles.downloadButton}
                onPress={onDescargar}
              >
                <Ionicons
                  name="download-outline"
                  size={24}
                  color={THEME.colors.primary}
                />
              </TouchableOpacity>
            ) : null}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    overflow: "hidden",
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
    justifyContent: "space-between",
    paddingVertical: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#847e7e",
    backgroundColor: THEME.colors.background,
  },
  info: {
    flex: 1,
    paddingRight: THEME.spacing.md,
  },
  nombre: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: 4,
  },
  fecha: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
  },
  iconContainer: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  downloadButton: {
    padding: THEME.spacing.xs,
  },
});
