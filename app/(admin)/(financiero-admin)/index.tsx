import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View, Text } from "react-native";
import Animated, {
  FadeInUp,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";

import { THEME } from "@/constants/theme";
import { BotonesAccion } from "@/components/siscoweb/admin/BotonesAccion";
import { FilaActivo } from "@/components/siscoweb/admin/FilaActivo";
import { TarjetaSaldo } from "@/components/siscoweb/admin/TarjetaSaldo";
import { DATOS_COPROPIEDAD } from "@/components/siscoweb/admin/constants";
import { useProject } from "@/contexts/ProjectContext";

const FilaInfo = ({ label, value, icon, valueColor }: any) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={16} color={THEME.colors.text.secondary} />
    <Text style={styles.infoLabel}>{label}:</Text>
    <Text style={[styles.infoValue, valueColor && { color: valueColor }]}>
      {value || "N/A"}
    </Text>
  </View>
);

export default function FinancieroIndex() {
  const router = useRouter();
  const scrollY = useSharedValue(0);
  const { selectedProject } = useProject();
  const [showInfo, setShowInfo] = React.useState(false);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const getAvatarText = () => {
    const codigo = selectedProject?.codigo;
    if (codigo && codigo.length >= 2) {
      return codigo.substring(0, 2);
    }
    return "CP";
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getAvatarText()}</Text>
          </View>
          <View>
            <Text style={styles.greetingName}>
              {selectedProject?.nombre || "Copropiedad"}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.notificationButton}
          onPress={() => router.push("/(screens)/avisos/AvisosScreen")}
        >
          <View style={styles.notificationDot} />
          <Ionicons
            name="notifications-outline"
            size={20}
            color={THEME.colors.text.primary}
          />
        </TouchableOpacity>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        <TarjetaSaldo />

        <BotonesAccion
          onSendBy={() => console.log("Finanzas")}
          onReceive={() => console.log("Reportes")}
          onSwap={() => console.log("Proyectos")}
          onBuy={() => console.log("Servicios")}
        />

        <TouchableOpacity
          style={styles.menuHeader}
          onPress={() => setShowInfo(!showInfo)}
          activeOpacity={0.7}
        >
          <View style={styles.menuHeaderLeft}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={THEME.colors.primary}
            />
            <Text style={styles.menuHeaderText}>
              Información de la Copropiedad
            </Text>
          </View>
          <Ionicons
            name={showInfo ? "chevron-up" : "chevron-down"}
            size={20}
            color={THEME.colors.text.secondary}
          />
        </TouchableOpacity>

        {showInfo && (
          <Animated.View
            entering={FadeInUp.duration(300)}
            style={styles.infoContainer}
          >
            <FilaInfo
              label="NIT"
              value={selectedProject?.nit}
              icon="business-outline"
            />
            <FilaInfo
              label="Código"
              value={selectedProject?.codigo}
              icon="barcode-outline"
            />

            <FilaInfo
              label="Poderes Habilitados"
              value={selectedProject?.poderesHabilitados ? "Sí" : "No"}
              icon="document-text-outline"
              valueColor={
                selectedProject?.poderesHabilitados
                  ? THEME.colors.success
                  : THEME.colors.error
              }
            />
            <FilaInfo
              label="Permiso Admin Apoderados"
              value={selectedProject?.permisoAdminApoderados ? "Sí" : "No"}
              icon="shield-checkmark-outline"
            />
            <FilaInfo
              label="Máx. Apoderados (Propietario)"
              value={selectedProject?.maxApoderadosPropietario?.toString()}
              icon="people-outline"
            />

            <FilaInfo
              label="Máx. Apoderados (Admin)"
              value={selectedProject?.maxApoderadosAdmin?.toString()}
              icon="people-circle-outline"
            />

            {selectedProject?.descripcion && (
              <FilaInfo
                label="Descripción"
                value={selectedProject.descripcion}
                icon="text-outline"
              />
            )}
          </Animated.View>
        )}

        <View style={styles.assetsSection}>
          <View style={styles.assetsSectionHeader}>
            <Text style={styles.assetsSectionTitle}>Estado Financiero</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Ver Todo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.assetsList}>
            {DATOS_COPROPIEDAD.map((dato, index) => (
              <Animated.View
                key={dato.id}
                entering={FadeInUp.delay(400 + index * 100).springify()}
              >
                <FilaActivo
                  asset={dato}
                  onPress={() => console.log("Dato:", dato.nombre)}
                />
              </Animated.View>
            ))}
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: THEME.spacing.lg,
    paddingTop: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME.spacing.md,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  avatarText: {
    fontWeight: "700",
    fontSize: THEME.fontSize.lg,
    color: THEME.colors.text.primary,
  },
  greetingName: {
    color: THEME.colors.text.primary,
    fontWeight: "700",
    fontSize: THEME.fontSize.lg,
  },
  notificationButton: {
    width: 40,
    height: 40,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: THEME.borderRadius.full,
    backgroundColor: THEME.colors.error,
    zIndex: 10,
    borderWidth: 1,
    borderColor: THEME.colors.surface,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: THEME.spacing.lg,
  },
  scrollContent: {
    paddingBottom: THEME.spacing.sm,
  },
  menuHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  menuHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME.spacing.sm,
  },
  menuHeaderText: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  infoContainer: {
    backgroundColor: THEME.colors.surface,
    padding: THEME.spacing.md,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.lg,
    gap: THEME.spacing.md,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME.spacing.sm,
  },
  infoLabel: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
    minWidth: 180,
  },
  infoValue: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.primary,
    fontWeight: "600",
    flex: 1,
  },
  assetsSection: {
    marginBottom: THEME.spacing.lg,
  },
  assetsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: THEME.spacing.md,
  },
  assetsSectionTitle: {
    fontSize: THEME.fontSize.xl,
    fontWeight: "700",
    color: THEME.colors.text.primary,
  },
  seeAllText: {
    color: THEME.colors.text.secondary,
    fontSize: THEME.fontSize.sm,
    fontWeight: "500",
  },
  assetsList: {
    gap: THEME.spacing.sm,
  },
});
