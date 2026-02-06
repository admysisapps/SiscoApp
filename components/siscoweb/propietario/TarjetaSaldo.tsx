import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Dimensions, StyleSheet, View, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Path,
  Stop,
} from "react-native-svg";

import { THEME } from "@/constants/theme";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 48;
const GRAPH_HEIGHT = 100;

export const TarjetaSaldo = () => {
  const d = `M0,${GRAPH_HEIGHT} C60,${GRAPH_HEIGHT} 80,40 140,40 S200,80 260,60 S320,0 ${CARD_WIDTH},20 L${CARD_WIDTH},${GRAPH_HEIGHT} Z`;

  return (
    <Animated.View
      entering={FadeInDown.delay(200).springify()}
      style={styles.container}
    >
      <LinearGradient
        colors={[THEME.colors.primary, THEME.colors.primaryDark]}
        style={StyleSheet.absoluteFill}
      />

      <View style={StyleSheet.absoluteFill}>
        <Svg height="100%" width="100%">
          <Defs>
            <SvgGradient id="grad" x1="0" y1="0" x2="0" y2="1">
              <Stop
                offset="0"
                stopColor={THEME.colors.secondary}
                stopOpacity="0.3"
              />
              <Stop
                offset="1"
                stopColor={THEME.colors.secondary}
                stopOpacity="0"
              />
            </SvgGradient>
          </Defs>
          <Path
            d={d}
            fill="url(#grad)"
            stroke={THEME.colors.secondary}
            strokeWidth={2}
          />
        </Svg>
      </View>

      <View style={styles.content}>
        <View>
          <View style={styles.header}>
            <Text style={styles.label}>Liquidez Disponible</Text>
          </View>
          <Text style={styles.balance}>$36.3M</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={styles.dot} />
            <Text style={styles.footerText}>
              Caja + Bancos + Cuentas de Ahorro{" \n"}
              Noviembre 2025
            </Text>
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: 220,
    borderRadius: THEME.borderRadius.xl * 1.5,
    overflow: "hidden",
    marginVertical: THEME.spacing.lg,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
  },
  content: {
    padding: THEME.spacing.lg,
    justifyContent: "space-between",
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  label: {
    color: THEME.colors.text.inverse,
    fontWeight: "500",
    fontSize: THEME.fontSize.sm,
  },

  badgeText: {
    color: THEME.colors.success,
    fontSize: 10,
    fontWeight: "bold",
  },
  balance: {
    fontSize: 36,
    fontWeight: "bold",
    color: THEME.colors.text.inverse,
    letterSpacing: -0.5,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: THEME.spacing.md,
  },
  footerLeft: {
    flexDirection: "row",
    gap: THEME.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.success,
    marginTop: 8,
  },
  footerText: {
    color: THEME.colors.text.inverse,
    fontSize: THEME.fontSize.xs,
    lineHeight: 20,
    opacity: 0.9,
  },
});
