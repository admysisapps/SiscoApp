import React from "react";
import { MaterialIcons } from "@expo/vector-icons";
import {
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  View,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useProject } from "@/contexts/ProjectContext";
import { THEME, COLORS } from "@/constants/theme";
import { Proyecto } from "@/types/Proyecto";

const { height } = Dimensions.get("window");

interface ProjectSelectorProps {
  onProjectSelected: (proyecto: Proyecto) => void;
}

// Componente separado para cada proyecto
const ProjectCard = React.memo(
  ({
    item,
    index,
    onProjectSelected,
  }: {
    item: Proyecto;
    index: number;
    onProjectSelected: (proyecto: Proyecto) => void;
  }) => {
    const isAdmin = item.rolUsuario === "admin";

    return (
      <View style={styles.projectCard}>
        <TouchableOpacity
          onPress={() => onProjectSelected(item)}
          activeOpacity={1}
        >
          <LinearGradient
            colors={
              isAdmin
                ? ["#1E40AF", "#3B82F6", "#60A5FA"]
                : ["#1E3A8A", "#3B82F6", "#60A5FA"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
            admin-panel-settingspersonhome-work
          >
            <View style={styles.cardContent}>
              {/* Icono principal */}
              <View style={styles.iconSection}>
                <View style={styles.iconContainer}>
                  {isAdmin ? (
                    <MaterialIcons
                      name="admin-panel-settings"
                      size={35}
                      color="white"
                    />
                  ) : (
                    <MaterialIcons
                      name="account-circle"
                      size={32}
                      color="white"
                    />
                  )}
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {isAdmin ? "ADMIN" : "PROPIETARIO"}
                  </Text>
                </View>
              </View>

              {/* Información */}
              <View style={styles.infoSection}>
                <Text style={styles.projectName} numberOfLines={1}>
                  {item.nombre}
                </Text>
                <Text style={styles.nitText}>NIT: {item.nit}</Text>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }
);
ProjectCard.displayName = "ProjectCard";

export default function ProjectSelector({
  onProjectSelected,
}: ProjectSelectorProps) {
  const { proyectos } = useProject();

  const handleProjectSelected = (proyecto: Proyecto) => {
    onProjectSelected(proyecto);
  };

  const renderProyecto = ({
    item,
    index,
  }: {
    item: Proyecto;
    index: number;
  }) => (
    <ProjectCard
      item={item}
      index={index}
      onProjectSelected={handleProjectSelected}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: "#F8FAFC" }]}>
      {/* Background decorativo */}
      <View style={styles.backgroundDecoration}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
        <View style={[styles.circle, styles.circle5]} />
      </View>

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>tus Copropiedades</Text>
          <Text style={styles.subtitle}>
            {proyectos.length > 1
              ? "Elige la copropiedad a la que deseas acceder"
              : "Accede a tu copropiedad"}
          </Text>
        </View>

        <FlatList
          data={proyectos}
          renderItem={renderProyecto}
          keyExtractor={(item) => `${item.nit}-${item.rolUsuario}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundDecoration: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle: {
    position: "absolute",
    borderRadius: 1000,
    opacity: 0.15,
  },
  circle1: {
    width: 280,
    height: 280,
    backgroundColor: COLORS.primary,
    top: -140,
    right: -100,
  },
  circle2: {
    width: 200,
    height: 200,
    backgroundColor: COLORS.primary,
    bottom: -80,
    left: -60,
  },
  circle3: {
    width: 150,
    height: 150,
    backgroundColor: COLORS.primary,
    top: height * 0.35,
    left: -50,
  },

  circle5: {
    width: 160,
    height: 160,
    backgroundColor: COLORS.primary,
    bottom: height * 0.25,
    right: -40,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: THEME.spacing.xl,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: THEME.colors.text.primary,
    textAlign: "center",
    marginBottom: THEME.spacing.sm,
  },
  subtitle: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  listContent: {
    padding: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
  },
  projectCard: {
    marginBottom: THEME.spacing.lg,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  cardGradient: {
    borderRadius: 20,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: THEME.spacing.lg,
    minHeight: 100,
  },
  iconSection: {
    alignItems: "center",
    marginRight: THEME.spacing.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: THEME.spacing.sm,
  },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    minWidth: 90,
    alignItems: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.8,
  },
  infoSection: {
    flex: 1,
  },
  projectName: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    marginBottom: 4,
  },
  nitText: {
    fontSize: THEME.fontSize.sm,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: THEME.spacing.sm,
  },
});
