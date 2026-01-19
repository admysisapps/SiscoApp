import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Animated,
  Dimensions,
} from "react-native";
import { THEME } from "@/constants/theme";

const { width } = Dimensions.get("window");

export default function ZonaDetailSkeleton() {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const SkeletonBox = ({ width, height, style }: any) => (
    <Animated.View
      style={[
        {
          width,
          height,
          backgroundColor: THEME.colors.border,
          borderRadius: 8,
          opacity,
        },
        style,
      ]}
    />
  );

  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Imagen Skeleton */}
      <SkeletonBox width={width} height={300} style={{ borderRadius: 0 }} />

      {/* Main Info Skeleton */}
      <View style={styles.mainInfo}>
        <View style={styles.titleRow}>
          <SkeletonBox width="60%" height={28} />
          <SkeletonBox width={80} height={24} />
        </View>
        <SkeletonBox width={150} height={16} style={{ marginBottom: 12 }} />
        <SkeletonBox width="100%" height={16} style={{ marginBottom: 6 }} />
        <SkeletonBox width="80%" height={16} />
      </View>

      {/* Horarios Section Skeleton */}
      <View style={styles.section}>
        <SkeletonBox width={200} height={20} style={{ marginBottom: 16 }} />
        <View style={styles.horariosContainer}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <View key={i} style={styles.horarioRow}>
              <SkeletonBox width={40} height={16} />
              <SkeletonBox width={120} height={16} />
              <SkeletonBox width={60} height={16} />
            </View>
          ))}
        </View>
      </View>

      {/* Reglas Section Skeleton */}
      <View style={styles.section}>
        <SkeletonBox width={150} height={20} style={{ marginBottom: 16 }} />
        <SkeletonBox width="100%" height={16} style={{ marginBottom: 6 }} />
        <SkeletonBox width="90%" height={16} style={{ marginBottom: 6 }} />
        <SkeletonBox width="70%" height={16} />
      </View>

      {/* Info Reserva Section Skeleton */}
      <View style={styles.section}>
        <SkeletonBox width={180} height={20} style={{ marginBottom: 16 }} />
        <View style={styles.infoRow}>
          <SkeletonBox
            width={20}
            height={20}
            style={{ borderRadius: 10, marginRight: 8 }}
          />
          <SkeletonBox width="80%" height={16} />
        </View>
        <View style={styles.infoRow}>
          <SkeletonBox
            width={20}
            height={20}
            style={{ borderRadius: 10, marginRight: 8 }}
          />
          <SkeletonBox width="70%" height={16} />
        </View>
        <View style={styles.infoRow}>
          <SkeletonBox
            width={20}
            height={20}
            style={{ borderRadius: 10, marginRight: 8 }}
          />
          <SkeletonBox width="75%" height={16} />
        </View>
        <View style={styles.infoRow}>
          <SkeletonBox
            width={20}
            height={20}
            style={{ borderRadius: 10, marginRight: 8 }}
          />
          <SkeletonBox width="85%" height={16} />
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
  },
  mainInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  horariosContainer: {
    gap: 12,
  },
  horarioRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  bottomSpacer: {
    height: 100,
  },
});
