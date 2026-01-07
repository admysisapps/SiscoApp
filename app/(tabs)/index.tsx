import UserDashboard from "@/components/dashboard/UserDashboard";
import { PqrMainCards } from "@/components/pqr/PQRMainCards";
import { ReservaMainCards } from "@/components/reservas/ReservaPropietarioCards";
import { AvisosUserCards } from "@/components/avisos/AvisosUserCards";
import { AsambleasDashboardCard } from "@/components/asambleas/AsambleasDashboardCard";

import { useProjectApartment } from "@/hooks/useProjectApartment";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import React, { useRef, useState, useCallback } from "react";

import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import { THEME } from "@/constants/theme";

const { width } = Dimensions.get("window");

interface InternalTabProps {
  icon: keyof typeof Ionicons.glyphMap | string;
  iconType?: "ionicons" | "materialcommunity";
  onPress: () => void;
  color: string;
  isActive: boolean;
}

const InternalTab: React.FC<InternalTabProps> = React.memo(
  ({ icon, iconType = "ionicons", onPress, color, isActive }) => (
    <TouchableOpacity
      style={styles.internalTab}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View
        style={[
          styles.tabIconContainer,
          { backgroundColor: isActive ? color : "transparent" },
        ]}
      >
        {iconType === "materialcommunity" ? (
          <MaterialCommunityIcons
            name={icon as any}
            size={18}
            color={isActive ? "white" : "#94A3B8"}
          />
        ) : (
          <Ionicons
            name={icon as keyof typeof Ionicons.glyphMap}
            size={18}
            color={isActive ? "white" : "#94A3B8"}
          />
        )}
      </View>
    </TouchableOpacity>
  )
);
InternalTab.displayName = "InternalTab";

// Componente Inicio (dashboard de usuario)
const InicioSection = React.memo(() => (
  <View style={styles.sectionContainer}>
    <UserDashboard />
  </View>
));
InicioSection.displayName = "InicioSection";

// Componente PQR
const PQRSection = React.memo(() => (
  <View style={styles.sectionContainer}>
    <PqrMainCards />
  </View>
));
PQRSection.displayName = "PQRSection";

// Componente Áreas Comunes
const AreasSection = React.memo(() => (
  <View style={styles.sectionContainer}>
    <ReservaMainCards />
  </View>
));
AreasSection.displayName = "AreasSection";

// Componente Avisos
const AvisosSection = React.memo(() => (
  <View style={styles.sectionContainer}>
    <AvisosUserCards />
  </View>
));
AvisosSection.displayName = "AvisosSection";

// Componente Asambleas
const AsambleasSection = React.memo(() => (
  <View style={styles.sectionContainer}>
    <AsambleasDashboardCard />
  </View>
));
AsambleasSection.displayName = "AsambleasSection";

const SECTIONS = [
  { key: "inicio", component: InicioSection, icon: "home", color: "#64748B" },
  {
    key: "pqr",
    component: PQRSection,
    icon: "document-text",
    color: "#4F46E5",
  },
  {
    key: "areas",
    component: AreasSection,
    icon: "calendar-multiple-check",
    iconType: "materialcommunity",
    color: "#059669",
  },
  {
    key: "avisos",
    component: AvisosSection,
    icon: "notifications",
    color: "#DC2626",
  },
  {
    key: "asambleas",
    component: AsambleasSection,
    icon: "people",
    color: "#7C3AED",
  },
];

interface InternalTabBarProps {
  activeSection: number;
  onTabPress: (index: number) => void;
}

const InternalTabBar: React.FC<InternalTabBarProps> = ({
  activeSection,
  onTabPress,
}) => {
  const containerWidth = width - 24; // Restamos los márgenes horizontales (12 * 2)
  const tabWidth = containerWidth / SECTIONS.length;
  const indicatorWidth = tabWidth - 6; // Más margen para que quede igual en ambos lados
  const translateX = useSharedValue(activeSection * tabWidth);

  React.useEffect(() => {
    const indicatorOffset = activeSection * tabWidth;
    translateX.value = withSpring(indicatorOffset, {
      damping: 15,
      stiffness: 150,
      mass: 0.8,
    });
  }, [activeSection, tabWidth, translateX]);

  const animatedIndicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View style={styles.internalTabBar}>
      {/* Indicador animado */}
      <Animated.View
        style={[
          styles.tabIndicator,
          animatedIndicatorStyle,
          { width: indicatorWidth },
        ]}
      />

      {/* Tabs */}
      {SECTIONS.map((section, index) => (
        <InternalTab
          key={section.key}
          icon={section.icon}
          iconType={section.iconType as "ionicons" | "materialcommunity"}
          onPress={() => onTabPress(index)}
          color={section.color}
          isActive={activeSection === index}
        />
      ))}
    </View>
  );
};

export default function Index() {
  // Conectar ProjectContext con ApartmentContext
  useProjectApartment();

  const [activeSection, setActiveSection] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const handleTabPress = useCallback((index: number) => {
    setActiveSection(index);
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
  }, []);

  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollX / width);
    if (index !== activeSection) {
      setActiveSection(index);
    }
  };

  return (
    <View style={styles.container}>
      {/* TabBar interna arriba */}
      <InternalTabBar
        activeSection={activeSection}
        onTabPress={handleTabPress}
      />

      {/* Carrusel horizontal */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.carousel}
      >
        {SECTIONS.map((section, index) => {
          const SectionComponent = section.component;
          return (
            <View key={section.key} style={styles.page}>
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.pageContent}
              >
                <SectionComponent />
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  internalTabBar: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 12,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 8,
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 0.5,
    borderColor: "#E2E8F0",
  },
  tabIndicator: {
    position: "absolute",
    top: 2,
    bottom: 2,
    backgroundColor: "white",
    borderRadius: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginHorizontal: 2,
  },
  internalTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    zIndex: 1,
  },
  tabIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  carousel: {
    flex: 1,
  },
  page: {
    width: width,
    flex: 1,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  pageContent: {
    paddingBottom: 100,
  },
});
