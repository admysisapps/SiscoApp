import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Image,
  PanResponder,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width: screenWidth } = Dimensions.get("window");
const isSmallScreen = screenWidth < 375;
const isVerySmallScreen = screenWidth < 350;

interface ImageGalleryProps {
  images: string[];
  onImageLoad?: (url: string) => void;
}

export const ImageGallery = ({ images, onImageLoad }: ImageGalleryProps) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(
    null
  );

  if (images.length === 0) return null;

  const openImageModal = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeImageModal = () => {
    setSelectedImageIndex(null);
  };

  const goToNextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const goToPreviousImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return (
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) &&
        Math.abs(gestureState.dx) > 20
      );
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dx > 50) {
        // Swipe right - imagen anterior
        goToPreviousImage();
      } else if (gestureState.dx < -50) {
        // Swipe left - siguiente imagen
        goToNextImage();
      }
    },
  });

  const renderImageLayout = () => {
    if (images.length === 1) {
      return (
        <TouchableOpacity
          style={styles.singleImageContainer}
          onPress={() => openImageModal(0)}
          activeOpacity={0.9}
        >
          <Image
            source={{ uri: images[0] }}
            style={styles.singleImage}
            resizeMode="contain"
            onLoad={() => onImageLoad?.(images[0])}
          />
        </TouchableOpacity>
      );
    }

    if (images.length === 2) {
      return (
        <View style={styles.twoImagesContainer}>
          {images.map((imageUrl, index) => (
            <TouchableOpacity
              key={index}
              style={styles.halfImageContainer}
              onPress={() => openImageModal(index)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: imageUrl }}
                style={styles.halfImage}
                resizeMode="cover"
                onLoad={() => onImageLoad?.(imageUrl)}
              />
            </TouchableOpacity>
          ))}
        </View>
      );
    }

    if (images.length === 3) {
      return (
        <View style={styles.threeImagesContainer}>
          <TouchableOpacity
            style={styles.mainImageContainer}
            onPress={() => openImageModal(0)}
            activeOpacity={0.9}
          >
            <Image
              source={{ uri: images[0] }}
              style={styles.mainImage}
              resizeMode="cover"
              onLoad={() => onImageLoad?.(images[0])}
            />
          </TouchableOpacity>
          <View style={styles.sideImagesContainer}>
            {images.slice(1).map((imageUrl, index) => (
              <TouchableOpacity
                key={index}
                style={styles.sideImageContainer}
                onPress={() => openImageModal(index + 1)}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: imageUrl }}
                  style={styles.sideImage}
                  resizeMode="cover"
                  onLoad={() => onImageLoad?.(imageUrl)}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    // 4 o más imágenes
    return (
      <View style={styles.multipleImagesContainer}>
        <View style={styles.topRowContainer}>
          {images.slice(0, 2).map((imageUrl, index) => (
            <TouchableOpacity
              key={index}
              style={styles.quarterImageContainer}
              onPress={() => openImageModal(index)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: imageUrl }}
                style={styles.quarterImage}
                resizeMode="cover"
                onLoad={() => onImageLoad?.(imageUrl)}
              />
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.bottomRowContainer}>
          {images.slice(2, 4).map((imageUrl, index) => (
            <TouchableOpacity
              key={index + 2}
              style={styles.quarterImageContainer}
              onPress={() => openImageModal(index + 2)}
              activeOpacity={0.9}
            >
              <Image
                source={{ uri: imageUrl }}
                style={styles.quarterImage}
                resizeMode="cover"
                onLoad={() => onImageLoad?.(imageUrl)}
              />
              {index === 1 && images.length > 4 && (
                <View style={styles.moreImagesOverlay}>
                  <Text style={styles.moreImagesText}>
                    +{images.length - 4}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <>
      <View style={styles.galleryContainer}>
        {renderImageLayout()}
        {images.length > 1 && (
          <View style={styles.imageCountBadge}>
            <Ionicons name="images" size={12} color="white" />
            <Text style={styles.imageCountText}>{images.length}</Text>
          </View>
        )}
      </View>

      {/* Modal para ver imagen en grande */}
      <Modal
        visible={selectedImageIndex !== null}
        transparent
        animationType="fade"
        onRequestClose={closeImageModal}
        statusBarTranslucent
      >
        <View style={styles.imageModalOverlay} {...panResponder.panHandlers}>
          <TouchableOpacity
            style={styles.imageModalClose}
            onPress={closeImageModal}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={30} color="white" />
          </TouchableOpacity>

          {selectedImageIndex !== null && (
            <Image
              source={{ uri: images[selectedImageIndex] }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          )}

          {images.length > 1 && selectedImageIndex !== null && (
            <View style={styles.imageModalCounter}>
              <Text style={styles.imageModalCounterText}>
                {selectedImageIndex + 1} de {images.length}
              </Text>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  galleryContainer: {
    marginHorizontal: isVerySmallScreen ? 8 : isSmallScreen ? 12 : 16,
    marginBottom: isSmallScreen ? 8 : 12,
    position: "relative",
    borderRadius: isSmallScreen ? 8 : 12,
    overflow: "hidden",
  },
  singleImageContainer: {
    borderRadius: isSmallScreen ? 8 : 12,
  },
  singleImage: {
    width: "100%",
    minHeight: isVerySmallScreen ? 180 : isSmallScreen ? 200 : 250,
    maxHeight: isVerySmallScreen ? 280 : isSmallScreen ? 320 : 400,
    borderRadius: isSmallScreen ? 8 : 12,
  },
  twoImagesContainer: {
    flexDirection: "row",
    gap: isSmallScreen ? 2 : 3,
  },
  halfImageContainer: {
    flex: 1,
  },
  halfImage: {
    width: "100%",
    height: isVerySmallScreen ? 140 : isSmallScreen ? 160 : 200,
    borderRadius: isSmallScreen ? 6 : 10,
  },
  threeImagesContainer: {
    flexDirection: "row",
    gap: isSmallScreen ? 2 : 3,
    height: isVerySmallScreen ? 160 : isSmallScreen ? 180 : 220,
  },
  mainImageContainer: {
    flex: 2,
  },
  mainImage: {
    width: "100%",
    height: "100%",
    borderRadius: isSmallScreen ? 6 : 10,
  },
  sideImagesContainer: {
    flex: 1,
    gap: isSmallScreen ? 2 : 3,
  },
  sideImageContainer: {
    flex: 1,
  },
  sideImage: {
    width: "100%",
    height: "100%",
    borderRadius: isSmallScreen ? 6 : 10,
  },
  multipleImagesContainer: {
    gap: isSmallScreen ? 2 : 3,
  },
  topRowContainer: {
    flexDirection: "row",
    gap: isSmallScreen ? 2 : 3,
  },
  bottomRowContainer: {
    flexDirection: "row",
    gap: isSmallScreen ? 2 : 3,
  },
  quarterImageContainer: {
    flex: 1,
    position: "relative",
  },
  quarterImage: {
    width: "100%",
    height: isVerySmallScreen ? 90 : isSmallScreen ? 110 : 130,
    borderRadius: isSmallScreen ? 6 : 10,
  },
  moreImagesOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: isSmallScreen ? 6 : 10,
  },
  moreImagesText: {
    color: "white",
    fontSize: isVerySmallScreen ? 16 : isSmallScreen ? 18 : 20,
    fontWeight: "bold",
  },
  imageCountBadge: {
    position: "absolute",
    top: isSmallScreen ? 6 : 10,
    right: isSmallScreen ? 6 : 10,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: isSmallScreen ? 6 : 8,
    paddingVertical: isSmallScreen ? 3 : 4,
    borderRadius: isSmallScreen ? 8 : 12,
    gap: isSmallScreen ? 2 : 4,
  },
  imageCountText: {
    color: "white",
    fontSize: isSmallScreen ? 10 : 12,
    fontWeight: "600",
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageModalClose: {
    position: "absolute",
    top: isSmallScreen ? 30 : 50,
    right: isSmallScreen ? 15 : 20,
    zIndex: 1,
    padding: isSmallScreen ? 8 : 12,
  },
  fullScreenImage: {
    width: isSmallScreen ? "98%" : "95%",
    height: isVerySmallScreen ? "75%" : isSmallScreen ? "80%" : "85%",
    borderRadius: isSmallScreen ? 12 : 16,
  },
  imageModalCounter: {
    position: "absolute",
    bottom: isVerySmallScreen ? 30 : isSmallScreen ? 40 : 50,
    alignSelf: "center",
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: isSmallScreen ? 12 : 20,
    paddingVertical: isSmallScreen ? 6 : 10,
    borderRadius: isSmallScreen ? 16 : 24,
  },
  imageModalCounterText: {
    color: "white",
    fontSize: isSmallScreen ? 13 : 15,
    fontWeight: "600",
  },

  swipeText: {
    color: "white",
    fontSize: isSmallScreen ? 10 : 12,
    fontWeight: "500",
  },
});
