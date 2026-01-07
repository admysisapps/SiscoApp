import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useUser } from "@/contexts/UserContext";
import { useProject } from "@/contexts/ProjectContext";
import { apiService } from "@/services/apiService";
import { userCacheService } from "@/services/cache/userCacheService";
import { THEME } from "@/constants/theme";
import EditPersonalInfoModal from "@/components/EditPersonalInfoModal";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

export default function PersonalInfo() {
  const { user, setUser } = useUser();
  const { selectedProject } = useProject();
  const [showEditModal, setShowEditModal] = useState(false);

  const [isLoadingFullData, setIsLoadingFullData] = useState(true);
  const loadedKeyRef = useRef<string | null>(null);

  // Memorizar si tenemos datos completos
  const hasCompleteData = useMemo(
    () => Boolean(user?.telefono && user?.email),
    [user?.telefono, user?.email]
  );

  // Crear key única para esta combinación de usuario/proyecto
  const currentKey = useMemo(
    () => `${user?.documento}_${selectedProject?.NIT}`,
    [user?.documento, selectedProject?.NIT]
  );

  // Función de carga memoizada
  const loadUserData = useCallback(async () => {
    if (!user?.documento || !selectedProject) return;

    // Si ya tenemos datos completos o ya cargamos esta combinación, no hacer nada
    if (hasCompleteData || loadedKeyRef.current === currentKey) {
      setIsLoadingFullData(false);
      return;
    }

    setIsLoadingFullData(true);

    try {
      // 1. Intentar cache primero
      const cachedData = await userCacheService.getCachedData(
        user.documento,
        selectedProject.NIT
      );

      if (cachedData) {
        setUser(cachedData);
        loadedKeyRef.current = currentKey;
        setIsLoadingFullData(false);
        return;
      }

      // 2. Si no hay cache, hacer API call
      const response = await apiService.getUserInfo(user.documento, true);
      if (response.success && response.data) {
        setUser(response.data);
        loadedKeyRef.current = currentKey;

        // 3. Guardar en cache
        await userCacheService.setCachedData(
          user.documento,
          selectedProject.NIT,
          response.data
        );
      }
    } catch (error) {
      console.error("Error cargando información personal:", error);
    } finally {
      setIsLoadingFullData(false);
    }
  }, [user?.documento, selectedProject, hasCompleteData, currentKey, setUser]);

  // CACHE-FIRST: Intentar cache primero, luego API si es necesario
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]} mode="padding">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={THEME.colors.header.title}
          />
        </TouchableOpacity>

        <Text style={styles.title}>Información Personal</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content}>
        {/* Card de Información */}
        <View style={styles.infoCard}>
          {/* Nombre */}
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => setShowEditModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.infoRowHeader}>
              <Ionicons
                name="person-outline"
                size={20}
                color={THEME.colors.text.secondary}
              />
              <Text style={styles.label}>Nombre</Text>
            </View>
            {isLoadingFullData ? (
              <ActivityIndicator
                size="small"
                color={THEME.colors.primary}
                style={styles.loadingIndicator}
              />
            ) : (
              <View style={styles.valueRow}>
                <Text style={styles.value}>
                  {user?.nombre || "No especificado"}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={THEME.colors.text.muted}
                />
              </View>
            )}
          </TouchableOpacity>

          {/* Apellido */}
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => setShowEditModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.infoRowHeader}>
              <Ionicons
                name="person-outline"
                size={20}
                color={THEME.colors.text.secondary}
              />
              <Text style={styles.label}>Apellido</Text>
            </View>
            {isLoadingFullData ? (
              <ActivityIndicator
                size="small"
                color={THEME.colors.primary}
                style={styles.loadingIndicator}
              />
            ) : (
              <View style={styles.valueRow}>
                <Text style={styles.value}>
                  {user?.apellido || "No especificado"}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={THEME.colors.text.muted}
                />
              </View>
            )}
          </TouchableOpacity>

          {/* Teléfono */}
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => setShowEditModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.infoRowHeader}>
              <Ionicons
                name="call-outline"
                size={20}
                color={THEME.colors.text.secondary}
              />
              <Text style={styles.label}>Teléfono</Text>
            </View>
            {isLoadingFullData ? (
              <ActivityIndicator
                size="small"
                color={THEME.colors.primary}
                style={styles.loadingIndicator}
              />
            ) : (
              <View style={styles.valueRow}>
                <Text style={styles.value}>
                  {user?.telefono || "No especificado"}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={THEME.colors.text.muted}
                />
              </View>
            )}
          </TouchableOpacity>
          {/* Correo */}
          <TouchableOpacity
            style={[styles.infoRow]}
            onPress={() => router.push("/(screens)/CambiarCorreo")}
            activeOpacity={0.7}
          >
            <View style={styles.infoRowHeader}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={THEME.colors.text.secondary}
              />
              <Text style={styles.label}>Correo electrónico</Text>
            </View>
            {isLoadingFullData ? (
              <ActivityIndicator
                size="small"
                color={THEME.colors.primary}
                style={styles.loadingIndicator}
              />
            ) : (
              <View style={styles.valueRow}>
                <Text style={styles.value}>
                  {user?.email || "No especificado"}
                </Text>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={THEME.colors.text.muted}
                />
              </View>
            )}
          </TouchableOpacity>

          {/* Cédula */}
          <View style={styles.infoRow}>
            <View style={styles.infoRowHeader}>
              <FontAwesome6
                name="id-card"
                size={19}
                color={THEME.colors.text.secondary}
              />
              <Text style={styles.label}>Documento</Text>
            </View>
            <Text style={styles.value}>
              {user?.documento || user?.usuario || "No especificado"}
            </Text>
            <Text style={styles.helperText}>
              Este campo no se puede modificar
            </Text>
          </View>
        </View>

        {/* Información adicional */}
        <View style={styles.noteCard}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={THEME.colors.primary}
          />
          <Text style={styles.noteText}>
            Toca cualquier campo para editar tu información personal.
          </Text>
        </View>
      </ScrollView>

      {/* Modal de Edición */}
      <EditPersonalInfoModal
        visible={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSave={() => setShowEditModal(false)}
      />
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.colors.surfaceLight,
    borderRadius: THEME.borderRadius.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.header.title,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: THEME.spacing.md,
  },
  infoCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoRow: {
    paddingVertical: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  lastInfoRow: {
    borderBottomWidth: 0,
  },
  infoRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: THEME.spacing.sm,
  },
  label: {
    fontSize: THEME.fontSize.sm,
    fontWeight: "500",
    color: THEME.colors.text.secondary,
    marginLeft: THEME.spacing.sm,
  },
  value: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "500",
    color: THEME.colors.text.primary,
    flex: 1,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  helperText: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.xs,
  },
  loadingIndicator: {
    alignSelf: "flex-start",
  },
  noteCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.md,
    marginBottom: THEME.spacing.md,
  },
  noteText: {
    flex: 1,
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    marginLeft: THEME.spacing.sm,
  },
});
