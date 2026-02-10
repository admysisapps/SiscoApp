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
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Documento } from "@/types/Documento";

interface DocumentoItemProps {
  documento: Documento;
  onDescargar: () => void;
  onEliminar: () => void;
  openItemId: SharedValue<string | null>;
  isDownloading?: boolean;
  shouldDelete?: boolean;
}

const SWIPE_THRESHOLD = -80;

export const DocumentoItem: React.FC<DocumentoItemProps> = ({
  documento,
  onDescargar,
  onEliminar,
  openItemId,
  isDownloading = false,
  shouldDelete = false,
}) => {
  const translateX = useSharedValue(0);
  const savedPosition = useSharedValue(0);

  // Ejecutar animación de salida cuando shouldDelete cambie a true
  React.useEffect(() => {
    if (shouldDelete) {
      translateX.value = withTiming(-500, { duration: 250 });
    }
  }, [shouldDelete, translateX]);

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
      if (newValue < 0 && newValue > SWIPE_THRESHOLD) {
        translateX.value = newValue;
      }
    })
    .onEnd((event) => {
      const finalPosition = savedPosition.value + event.translationX;
      if (finalPosition < SWIPE_THRESHOLD / 2) {
        translateX.value = withSpring(SWIPE_THRESHOLD);
        savedPosition.value = SWIPE_THRESHOLD;
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

  const deleteButtonStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0.5, 1],
      Extrapolation.CLAMP
    );
    const opacity = interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const handleDelete = () => {
    onEliminar();
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.deleteBackground}>
        <Animated.View
          style={[styles.deleteButtonContainer, deleteButtonStyle]}
        >
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
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
              <Text style={styles.documentoNombre} numberOfLines={1}>
                {documento.nombre}
              </Text>
              <Text style={styles.documentoMeta}>
                {documento.tipo} • {documento.tamaño} • {documento.fecha}
              </Text>
            </View>
            <View style={styles.iconContainer}>
              {isDownloading ? (
                <ActivityIndicator size="small" color={THEME.colors.primary} />
              ) : (
                !documento.enCache && (
                  <Ionicons
                    name="download-outline"
                    size={20}
                    color={THEME.colors.primary}
                  />
                )
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
    marginHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
    backgroundColor: "#f44336",
    borderRadius: THEME.borderRadius.md,
    overflow: "hidden",
  },
  deleteBackground: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  deleteButtonContainer: {
    width: 80,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    paddingHorizontal: 20,
    height: "100%",
    justifyContent: "center",
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
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
    fontWeight: "600",
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
});
