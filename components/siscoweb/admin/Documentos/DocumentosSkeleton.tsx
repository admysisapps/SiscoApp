import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { THEME } from "@/constants/theme";

export default function DocumentosSkeleton() {
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
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <SkeletonBox
          width="40%"
          height={18}
          style={{ marginBottom: THEME.spacing.sm }}
        />
      </View>
      {[1, 2, 3, 4, 5].map((item) => (
        <View key={item} style={styles.itemContainer}>
          <SkeletonBox width={24} height={24} style={{ borderRadius: 4 }} />
          <View style={styles.info}>
            <SkeletonBox width="70%" height={16} style={{ marginBottom: 6 }} />
            <SkeletonBox width="50%" height={12} />
          </View>
          <SkeletonBox width={20} height={20} style={{ borderRadius: 4 }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    marginTop: THEME.spacing.sm,
    marginBottom: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md + THEME.spacing.xs,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    marginHorizontal: THEME.spacing.md,
    marginBottom: THEME.spacing.sm,
  },
  info: {
    flex: 1,
    marginLeft: THEME.spacing.sm,
    marginRight: THEME.spacing.sm,
  },
});
