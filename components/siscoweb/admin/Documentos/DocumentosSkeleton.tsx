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
      {[1, 2, 3, 4, 5].map((item) => (
        <View key={item} style={styles.itemContainer}>
          <View style={styles.info}>
            <SkeletonBox width="70%" height={18} style={{ marginBottom: 8 }} />
            <SkeletonBox width="40%" height={14} />
          </View>
          <SkeletonBox width={24} height={24} style={{ borderRadius: 12 }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  info: {
    flex: 1,
    paddingRight: THEME.spacing.md,
  },
});
