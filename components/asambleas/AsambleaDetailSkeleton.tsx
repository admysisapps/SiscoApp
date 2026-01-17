import React, { useEffect, useRef } from "react";
import { View, StyleSheet, ScrollView, Animated } from "react-native";
import { THEME } from "@/constants/theme";

export default function AsambleaDetailSkeleton() {
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
    <ScrollView
      style={styles.content}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Gradient Skeleton */}
      <View style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <SkeletonBox
            width={60}
            height={60}
            style={{ borderRadius: 30, marginRight: THEME.spacing.md }}
          />
          <View style={styles.headerTextContainer}>
            <SkeletonBox width={100} height={20} style={{ marginBottom: 6 }} />
            <SkeletonBox width={150} height={14} />
          </View>
          <SkeletonBox width={80} height={24} style={{ borderRadius: 12 }} />
        </View>
      </View>

      {/* Título y Descripción Skeleton */}
      <View style={styles.tituloContainer}>
        <SkeletonBox
          width="90%"
          height={28}
          style={{ marginBottom: THEME.spacing.sm }}
        />
        <SkeletonBox width="100%" height={16} style={{ marginBottom: 6 }} />
        <SkeletonBox width="80%" height={16} />
      </View>

      {/* Detalles Card Skeleton */}
      <View style={styles.detallesCard}>
        <SkeletonBox
          width={100}
          height={20}
          style={{ marginBottom: THEME.spacing.md }}
        />

        {/* Detalle Row 1 */}
        <View style={styles.detalleRow}>
          <SkeletonBox
            width={40}
            height={40}
            style={{ borderRadius: 20, marginRight: THEME.spacing.md }}
          />
          <View style={styles.detalleTextContainer}>
            <SkeletonBox width={60} height={14} style={{ marginBottom: 4 }} />
            <SkeletonBox width={150} height={16} />
          </View>
        </View>

        {/* Detalle Row 2 */}
        <View style={styles.detalleRow}>
          <SkeletonBox
            width={40}
            height={40}
            style={{ borderRadius: 20, marginRight: THEME.spacing.md }}
          />
          <View style={styles.detalleTextContainer}>
            <SkeletonBox width={70} height={14} style={{ marginBottom: 4 }} />
            <SkeletonBox width={100} height={16} />
          </View>
        </View>

        {/* Detalle Row 3 - Quorum */}
        <View style={styles.detalleRow}>
          <SkeletonBox
            width={40}
            height={40}
            style={{ borderRadius: 20, marginRight: THEME.spacing.md }}
          />
          <View style={styles.detalleTextContainer}>
            <SkeletonBox width={60} height={14} style={{ marginBottom: 4 }} />
            <SkeletonBox width={120} height={16} style={{ marginBottom: 8 }} />
            <View style={styles.quorumBarContainer}>
              <SkeletonBox
                width="60%"
                height={6}
                style={{ borderRadius: THEME.borderRadius.full }}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Content Card Skeleton */}
      <View style={styles.contentCard}>
        <SkeletonBox
          width={120}
          height={20}
          style={{ marginBottom: THEME.spacing.md }}
        />
        <SkeletonBox width="100%" height={16} style={{ marginBottom: 8 }} />
        <SkeletonBox width="90%" height={16} style={{ marginBottom: 8 }} />
        <SkeletonBox width="70%" height={16} />
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: THEME.spacing.md,
  },
  headerGradient: {
    borderRadius: THEME.borderRadius.lg,
    backgroundColor: "#F5F5F5",
    overflow: "hidden",
    marginBottom: THEME.spacing.md,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: THEME.spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  tituloContainer: {
    marginBottom: THEME.spacing.lg,
  },
  detallesCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  detalleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: THEME.spacing.md,
  },
  detalleTextContainer: {
    flex: 1,
  },
  quorumBarContainer: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: THEME.borderRadius.full,
    overflow: "hidden",
    width: "100%",
  },
  contentCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomSpacer: {
    height: 50,
  },
});
