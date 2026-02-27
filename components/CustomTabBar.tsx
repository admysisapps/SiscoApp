import React, { useEffect, useMemo, useRef } from "react";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { View, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import LottieView from "lottie-react-native";
import { THEME } from "@/constants/theme";

const { width } = Dimensions.get("window");

// Orden dinámico de tabs según el contexto
const getTabOrder = (routes: any[]) => {
  const hasFinancieroAdmin = routes.some(
    (route) => route.name === "(financiero-admin)"
  );
  return hasFinancieroAdmin
    ? ["(financiero-admin)", "index", "perfil"]
    : ["(financiero)", "index", "perfil"];
};

interface TabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

const CustomTabBar: React.FC<TabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const insets = useSafeAreaInsets();
  const tabWidth = width / 3; // 3 tabs fijos
  const indicatorWidth = tabWidth * 0.5; // 50% del ancho del tab
  const translateX = useSharedValue(0);
  const lottieRef = useRef<LottieView>(null);
  const navigationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  // Reordenar tabs usando el orden dinámico (memoizado)
  const reorderedRoutes = useMemo(() => {
    const tabOrder = getTabOrder(state.routes);
    return tabOrder
      .map((routeName) =>
        state.routes.find((route: any) => route.name === routeName)
      )
      .filter(Boolean);
  }, [state.routes]);

  // Sincronizar indicador con el tab activo (optimizado)
  useEffect(() => {
    const activeRoute = state.routes[state.index];
    const tabOrder = getTabOrder(state.routes);
    const displayIndex = tabOrder.findIndex(
      (routeName) => routeName === activeRoute.name
    );
    if (displayIndex !== -1) {
      // Centrar el indicador en el tab
      const offset = (tabWidth - indicatorWidth) / 2;
      translateX.value = withSpring(displayIndex * tabWidth + offset, {
        damping: 15,
        stiffness: 150,
        mass: 0.8,
      });
    }

    return () => {
      if (navigationTimerRef.current) {
        clearTimeout(navigationTimerRef.current);
        navigationTimerRef.current = null;
      }
    };
  }, [state.index, state.routes, tabWidth, translateX, indicatorWidth]);

  const getIconName = (routeName: string, focused: boolean) => {
    switch (routeName) {
      case "index":
        return focused ? "home" : "home-outline";
      case "perfil":
        return focused ? "person" : "person-sharp";
      default:
        return "help-outline";
    }
  };

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case "index":
        return "Inicio";
      case "(financiero)":
        return "Financiero";
      case "(financiero-admin)":
        return "Sisco web";
      case "perfil":
        return "Perfil";
      default:
        return "Tab";
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Indicador animado redondeado */}
      <Animated.View
        style={[
          styles.indicator,
          animatedIndicatorStyle,
          { width: indicatorWidth },
        ]}
      />

      {/* Tabs */}
      {reorderedRoutes.map((route: any, displayIndex: number) => {
        const originalIndex = state.routes.findIndex(
          (r: any) => r.name === route.name
        );
        const isFocused = state.index === originalIndex;

        const onPress = () => {
          // Limpiar timer anterior si existe
          if (navigationTimerRef.current) {
            clearTimeout(navigationTimerRef.current);
            navigationTimerRef.current = null;
          }

          // Centrar el indicador en el tab
          const offset = (tabWidth - indicatorWidth) / 2;
          translateX.value = withSpring(displayIndex * tabWidth + offset, {
            damping: 15,
            stiffness: 150,
            mass: 0.8,
          });

          // Activar animación Lottie solo para el tab de inicio
          if (route.name === "index") {
            lottieRef.current?.play();
          }

          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            // Pequeño delay para evitar navegación instantánea
            navigationTimerRef.current = setTimeout(() => {
              navigation.navigate(route.name);
            }, 50);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            testID={route.name === "perfil" ? "tab-perfil" : undefined}
            style={styles.tab}
            onPress={onPress}
            activeOpacity={0.8}
          >
            <View style={styles.iconContainer}>
              {route.name === "index" ? (
                <LottieView
                  ref={lottieRef}
                  source={require("@/assets/lottie/HauseTab.json")}
                  style={styles.lottieIcon}
                  autoPlay={false}
                  loop={false}
                  colorFilters={[
                    {
                      keypath: "**",
                      color: isFocused
                        ? THEME.colors.primary
                        : THEME.colors.text.secondary,
                    },
                  ]}
                />
              ) : route.name === "(financiero-admin)" ? (
                <MaterialCommunityIcons
                  name="finance"
                  size={27}
                  color={
                    isFocused
                      ? THEME.colors.primary
                      : THEME.colors.text.secondary
                  }
                />
              ) : route.name === "(financiero)" ? (
                <Ionicons
                  name="receipt-sharp"
                  size={23}
                  color={
                    isFocused
                      ? THEME.colors.primary
                      : THEME.colors.text.secondary
                  }
                />
              ) : (
                <Ionicons
                  name={getIconName(route.name, isFocused)}
                  size={22}
                  color={
                    isFocused
                      ? THEME.colors.primary
                      : THEME.colors.text.secondary
                  }
                />
              )}
            </View>

            <Animated.Text
              style={[
                styles.label,
                {
                  color: isFocused
                    ? THEME.colors.primary
                    : THEME.colors.text.secondary,
                },
              ]}
            >
              {getTabLabel(route.name)}
            </Animated.Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: THEME.colors.surface,
    paddingVertical: 6,
    paddingHorizontal: THEME.spacing.xs,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
    position: "relative",
    borderTopWidth: 0.5,
    borderTopColor: THEME.colors.border,
  },
  indicator: {
    position: "absolute",
    top: 0,
    height: 2,
    backgroundColor: THEME.colors.primary,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  label: {
    fontSize: THEME.fontSize.xs,
    fontWeight: "600",
    color: THEME.colors.text.secondary,
  },
  lottieIcon: {
    width: 24,
    height: 24,
  },
});

export default CustomTabBar;
