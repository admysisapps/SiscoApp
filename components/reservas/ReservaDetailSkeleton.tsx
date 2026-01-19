import React, { useEffect, useRef } from "react";
import { View, StyleSheet, ScrollView, Animated } from "react-native";
import { THEME } from "@/constants/theme";

export default function ReservaDetailSkeleton() {
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
      {/* Status Badge Skeleton */}
      <View style={styles.statusContainer}>
        <SkeletonBox width={120} height={32} style={{ borderRadius: 25 }} />
      </View>

      {/* Main Card Skeleton */}
      <View style={styles.mainCard}>
        <SkeletonBox
          width="80%"
          height={28}
          style={{ alignSelf: "center", marginBottom: 24 }}
        />

        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <SkeletonBox
              width={40}
              height={40}
              style={{ borderRadius: 20, marginRight: 12 }}
            />
            <View style={styles.infoContent}>
              <SkeletonBox width={60} height={12} style={{ marginBottom: 6 }} />
              <SkeletonBox
                width={100}
                height={16}
                style={{ marginBottom: 4 }}
              />
              <SkeletonBox width={80} height={12} />
            </View>
          </View>

          <View style={styles.infoItem}>
            <SkeletonBox
              width={40}
              height={40}
              style={{ borderRadius: 20, marginRight: 12 }}
            />
            <View style={styles.infoContent}>
              <SkeletonBox width={60} height={12} style={{ marginBottom: 6 }} />
              <SkeletonBox
                width={100}
                height={16}
                style={{ marginBottom: 4 }}
              />
              <SkeletonBox width={80} height={12} />
            </View>
          </View>
        </View>

        <View style={styles.precioContainer}>
          <SkeletonBox width={100} height={20} />
          <SkeletonBox width={120} height={28} />
        </View>
      </View>

      {/* Details Card Skeleton */}
      <View style={styles.detailsCard}>
        <SkeletonBox width="40%" height={14} style={{ marginBottom: 8 }} />
        <SkeletonBox width="90%" height={16} style={{ marginBottom: 16 }} />
        <View style={styles.dividerLine} />
        <SkeletonBox
          width="40%"
          height={14}
          style={{ marginBottom: 8, marginTop: 12 }}
        />
        <SkeletonBox width="70%" height={16} style={{ marginBottom: 16 }} />
        <View style={styles.dividerLine} />
        <SkeletonBox
          width="40%"
          height={14}
          style={{ marginBottom: 8, marginTop: 12 }}
        />
        <SkeletonBox width="60%" height={16} />
      </View>

      {/* Contact Card Skeleton */}
      <View style={styles.contactSection}>
        <SkeletonBox width={180} height={18} style={{ marginBottom: 12 }} />
        <View style={styles.contactCard}>
          <View style={styles.contactInfo}>
            <SkeletonBox
              width={48}
              height={48}
              style={{ borderRadius: 24, marginRight: 12 }}
            />
            <View style={styles.contactDetails}>
              <SkeletonBox
                width={120}
                height={16}
                style={{ marginBottom: 6 }}
              />
              <SkeletonBox
                width={150}
                height={14}
                style={{ marginBottom: 4 }}
              />
              <SkeletonBox width={100} height={14} />
            </View>
          </View>
          <View style={styles.contactActions}>
            <SkeletonBox width={40} height={40} style={{ borderRadius: 20 }} />
            <SkeletonBox width={40} height={40} style={{ borderRadius: 20 }} />
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    padding: 16,
  },
  statusContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  mainCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  infoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    marginHorizontal: 8,
  },
  infoContent: {
    flex: 1,
  },
  precioContainer: {
    backgroundColor: THEME.colors.background,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dividerLine: {
    height: 1,
    backgroundColor: THEME.colors.border,
    marginVertical: 12,
  },
  detailsCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  contactSection: {
    marginBottom: 16,
    paddingBottom: 20,
  },
  contactCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  contactInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  contactDetails: {
    flex: 1,
  },
  contactActions: {
    flexDirection: "row",
    gap: 12,
  },
});
