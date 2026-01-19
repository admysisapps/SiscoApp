import React, { useEffect, useRef } from "react";
import { View, StyleSheet, ScrollView, Animated } from "react-native";
import { THEME } from "@/constants/theme";

export default function PqrDetailSkeleton() {
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
          backgroundColor: "#E2E8F0",
          borderRadius: 8,
          opacity,
        },
        style,
      ]}
    />
  );

  return (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      {/* Hero Card Skeleton */}
      <View style={styles.heroCard}>
        <View style={styles.statusRow}>
          <SkeletonBox width={100} height={24} style={{ borderRadius: 12 }} />
          <SkeletonBox width={80} height={14} />
        </View>
        <SkeletonBox
          width="90%"
          height={24}
          style={{ marginTop: 16, marginBottom: 12 }}
        />
        <SkeletonBox width="100%" height={16} style={{ marginBottom: 6 }} />
        <SkeletonBox width="80%" height={16} style={{ marginBottom: 6 }} />
        <SkeletonBox width="60%" height={16} />
      </View>

      {/* Info Cards Grid Skeleton */}
      <View style={styles.infoGrid}>
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <SkeletonBox
              width={20}
              height={20}
              style={{ borderRadius: 10, marginRight: 8 }}
            />
            <SkeletonBox width={70} height={14} />
          </View>
          <SkeletonBox
            width="80%"
            height={20}
            style={{ marginTop: 12, marginBottom: 6 }}
          />
          <SkeletonBox width="60%" height={14} />
        </View>

        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <SkeletonBox
              width={20}
              height={20}
              style={{ borderRadius: 10, marginRight: 8 }}
            />
            <SkeletonBox width={80} height={14} />
          </View>
          <SkeletonBox
            width="70%"
            height={20}
            style={{ marginTop: 12, marginBottom: 6 }}
          />
          <SkeletonBox width="50%" height={14} />
        </View>
      </View>

      {/* Chat Card Skeleton */}
      <View style={styles.chatCard}>
        <View style={styles.chatHeader}>
          <SkeletonBox
            width={20}
            height={20}
            style={{ borderRadius: 10, marginRight: 8 }}
          />
          <SkeletonBox width={100} height={16} />
        </View>

        {/* Message Skeletons */}
        <View style={styles.messagesContainer}>
          {/* User message */}
          <View style={styles.messageUser}>
            <View style={styles.messageContent}>
              <SkeletonBox
                width="100%"
                height={14}
                style={{ marginBottom: 6 }}
              />
              <SkeletonBox
                width="80%"
                height={14}
                style={{ marginBottom: 8 }}
              />
              <SkeletonBox width={80} height={12} />
            </View>
            <SkeletonBox
              width={32}
              height={32}
              style={{ borderRadius: 16, marginLeft: 8 }}
            />
          </View>

          {/* Admin message */}
          <View style={styles.messageAdmin}>
            <SkeletonBox
              width={32}
              height={32}
              style={{ borderRadius: 16, marginRight: 8 }}
            />
            <View style={styles.messageContent}>
              <SkeletonBox
                width="100%"
                height={14}
                style={{ marginBottom: 6 }}
              />
              <SkeletonBox
                width="70%"
                height={14}
                style={{ marginBottom: 8 }}
              />
              <SkeletonBox width={80} height={12} />
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    padding: 16,
  },
  heroCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  infoCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  chatCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  messagesContainer: {
    gap: 12,
  },
  messageUser: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "flex-end",
  },
  messageAdmin: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  messageContent: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 12,
  },
});
