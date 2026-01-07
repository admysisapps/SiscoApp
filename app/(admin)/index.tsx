import React, { useState, useRef, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { PqrMainCards } from "@/components/pqr/PQRMainCards";
import { ReservaAdminCards } from "@/components/reservas/ReservaAdminCards";
import { CambiarPropietarioCard } from "@/components/propietarios/CambiarPropietarioCard";
import { useRouter } from "expo-router";
import DashboardHome from "@/components/dashboard/DashboardHome";
import { AvisosAdminCards } from "@/components/avisos/AvisosAdminCards";
import { AsambleasDashboardCard } from "@/components/asambleas/AsambleasDashboardCard";
import { CrearAsambleaDashboardCard } from "@/components/asambleas/CrearAsambleaDashboardCard";
import Toast from "@/components/Toast";

import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");

interface InternalTabProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color: string;
  isActive: boolean;
}

const InternalTab: React.FC<InternalTabProps> = ({
  icon,
  onPress,
  color,
  isActive,
}) => (
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
      <Ionicons name={icon} size={18} color={isActive ? "white" : "#94A3B8"} />
    </View>
  </TouchableOpacity>
);

// Componentes Admin (nombres únicos)
const AdminInicioSection = ({
  showToast,
}: {
  showToast?: (message: string, type: "success" | "error" | "warning") => void;
}) => (
  <View style={styles.sectionContainer}>
    <DashboardHome />
  </View>
);

const AdminPQRSection = ({
  showToast,
}: {
  showToast?: (message: string, type: "success" | "error" | "warning") => void;
}) => (
  <View style={styles.sectionContainer}>
    <PqrMainCards />
  </View>
);

const AdminAreasSection = ({
  showToast,
}: {
  showToast?: (message: string, type: "success" | "error" | "warning") => void;
}) => (
  <View style={styles.sectionContainer}>
    <ReservaAdminCards />
  </View>
);

const AdminAvisosSection = ({
  showToast,
}: {
  showToast?: (message: string, type: "success" | "error" | "warning") => void;
}) => (
  <View style={styles.sectionContainer}>
    <AvisosAdminCards />
  </View>
);

const AdminAsambleasSection = ({
  showToast,
}: {
  showToast?: (message: string, type: "success" | "error" | "warning") => void;
}) => (
  <View style={styles.sectionContainer}>
    <AsambleasDashboardCard />
    <CrearAsambleaDashboardCard />
  </View>
);

const AdminPropietariosSection = ({
  showToast,
}: {
  showToast?: (message: string, type: "success" | "error" | "warning") => void;
}) => {
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
};

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
    icon: "clipboard",
    color: "#4F46E5",
  },
  {
    key: "areas",
    component: AdminAreasSection,
    icon: "library",
    color: "#10B981",
  },
  {
    key: "avisos",
    component: AdminAvisosSection,
    icon: "megaphone",
    color: "#DC2626",
  },
  {
    key: "asambleas",
    component: AdminAsambleasSection,
    icon: "people-circle",
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
  const tabWidth = containerWidth / 6; // 6 secciones fijas
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
          icon={section.icon as keyof typeof Ionicons.glyphMap}
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
  const [isLoading, setIsLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" = "success"
  ) => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ visible: false, message: "", type: "success" });
  };

  // Simular carga inicial para transición suave
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleTabPress = useCallback((index: number) => {
    setActiveSection(index);
    scrollViewRef.current?.scrollTo({ x: index * width, animated: true });
  }, []);

  const handleScroll = useCallback(
    (event: any) => {
      const scrollX = event.nativeEvent.contentOffset.x;
      const index = Math.round(scrollX / width);
      if (index !== activeSection) {
        setActiveSection(index);
      }
    },
    [activeSection]
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          {/* Placeholder para transición suave */}
        </View>
      </View>
    );
  }

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
          return (
            <View key={section.key} style={styles.page}>
              <ScrollView showsVerticalScrollIndicator={false}>
                <SectionComponent showToast={showToast} />
              </ScrollView>
            </View>
          );
        })}
      </ScrollView>

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
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
  loadingContainer: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
});
