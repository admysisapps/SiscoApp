import React from "react";
import { View, StyleSheet } from "react-native";

export const EspacioCardSkeleton: React.FC = () => {
  return (
    <View style={styles.card}>
      <View style={styles.imageSkeleton} />
      <View style={styles.content}>
        <View style={styles.titleSkeleton} />
        <View style={styles.descriptionSkeleton} />
        <View style={styles.detailsRow}>
          <View style={styles.detailSkeleton} />
          <View style={styles.detailSkeleton} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 20,
    overflow: "hidden",
  },
  imageSkeleton: {
    height: 200,
    backgroundColor: "#E5E7EB",
  },
  content: {
    padding: 16,
  },
  titleSkeleton: {
    height: 20,
    width: "60%",
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 12,
  },
  descriptionSkeleton: {
    height: 16,
    width: "90%",
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: "row",
    gap: 16,
  },
  detailSkeleton: {
    height: 14,
    width: 80,
    backgroundColor: "#E5E7EB",
    borderRadius: 4,
  },
});
