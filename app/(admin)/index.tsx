import React, { useState, useRef, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";

import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { PqrMainCards } from "@/components/pqr/PQRMainCards";
import { ReservaAdminCards } from "@/components/reservas/ReservaAdminCards";
import { CambiarPropietarioCard } from "@/components/propietarios/CambiarPropietarioCard";
import { useRouter } from "expo-router";
import DashboardAdmin from "@/components/dashboard/admin/DashboardAdmin";
import AnuncioSistema from "@/components/dashboard/admin/AnuncioSistema";
import { AvisosAdminCards } from "@/components/avisos/AvisosAdminCards";
import { AsambleasDashboardCard } from "@/components/asambleas/AsambleasDashboardCard";
import { CrearAsambleaDashboardCard } from "@/components/asambleas/CrearAsambleaDashboardCard";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

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

// Componentes Admin (nombres únicos)
const AdminInicioSection = React.memo(() => (
  <View style={styles.sectionContainer}>
    <AnuncioSistema />
    <DashboardAdmin />
  </View>
));
AdminInicioSection.displayName = "AdminInicioSection";

const AdminPQRSection = React.memo(() => (
  <View style={styles.sectionContainer}>
    <PqrMainCards />
  </View>
));
AdminPQRSection.displayName = "AdminPQRSection";

const AdminAreasSection = React.memo(() => (
  <View style={styles.sectionContainer}>
    <ReservaAdminCards />
  </View>
));
AdminAreasSection.displayName = "AdminAreasSection";

const AdminAvisosSection = React.memo(() => (
  <View style={styles.sectionContainer}>
    <AvisosAdminCards />
  </View>
));
AdminAvisosSection.displayName = "AdminAvisosSection";

const AdminAsambleasSection = React.memo(() => (
  <View style={styles.sectionContainer}>
    <AsambleasDashboardCard />
    <CrearAsambleaDashboardCard />
  </View>
));
AdminAsambleasSection.displayName = "AdminAsambleasSection";

const AdminPropietariosSection = React.memo(() => {
  const router = useRouter();

  return (
    <View style={styles.sectionContainer}>
      <CambiarPropietarioCard
        onPress={() =>
          router.push("/(screens)/propietarios/cambiar-propietario")
        }
      />
    </View>
  );
});
AdminPropietariosSection.displayName = "AdminPropietariosSection";

const ADMIN_SECTIONS = [
  {
    key: "inicio",
    component: AdminInicioSection,
    icon: "grid",
    color: "#64748B",
  },
  {
    key: "pqr",
    component: AdminPQRSection,
    icon: "document-text",
    color: "#4F46E5",
  },
  {
    key: "areas",
    component: AdminAreasSection,
    icon: "calendar-multiple-check",
    iconType: "materialcommunity",
    color: "#059669",
  },
  {
    key: "avisos",
    component: AdminAvisosSection,
    icon: "notifications",
    color: "#DC2626",
  },
  {
    key: "asambleas",
    component: AdminAsambleasSection,
    icon: "people",
    color: "#7C3AED",
  },
  {
    key: "propietarios",
    component: AdminPropietariosSection,
    icon: "person-add",
    color: "#F59E0B",
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
  const containerWidth = width - 24;
  const tabWidth = containerWidth / ADMIN_SECTIONS.length;
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
      {ADMIN_SECTIONS.map((section, index) => (
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

export default function AdminIndex() {
  const [activeSection, setActiveSection] = useState(0);
  const [renderedSections, setRenderedSections] = useState<Set<number>>(
    new Set([0, 1])
  );
  const scrollViewRef = useRef<ScrollView>(null);

  const handleTabPress = useCallback((index: number) => {
    setRenderedSections(
      (prev) =>
        new Set(
          [...prev, index, index - 1, index + 1].filter(
            (i) => i >= 0 && i < ADMIN_SECTIONS.length
          )
        )
    );
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
    setTimeout(() => setActiveSection(index), 50);
  }, []);

  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollX / width);
    if (index !== activeSection) {
      setActiveSection(index);
      setRenderedSections(
        (prev) =>
          new Set(
            [...prev, index, index - 1, index + 1].filter(
              (i) => i >= 0 && i < ADMIN_SECTIONS.length
            )
          )
      );
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
        {ADMIN_SECTIONS.map((section, index) => {
          const SectionComponent = section.component;
          const shouldRender =
            renderedSections.has(index) || Math.abs(index - activeSection) <= 1;

          return (
            <View key={section.key} style={styles.page}>
              {shouldRender ? (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.pageContent}
                  removeClippedSubviews={true}
                >
                  <SectionComponent />
                </ScrollView>
              ) : (
                <View style={styles.placeholder} />
              )}
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
    backgroundColor: "#F8FAFC",
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
    overflow: "visible",
  },
  placeholder: {
    flex: 1,
  },
  pageContent: {
    paddingBottom: 100,
    flexGrow: 1,
  },
});
