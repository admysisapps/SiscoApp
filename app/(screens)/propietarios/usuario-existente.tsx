import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { THEME, COLORS } from "@/constants/theme";
import { useRouter, useLocalSearchParams } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

export default function UsuarioExistenteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Parsear los datos del usuario desde los parámetros
  const usuario = params.usuario ? JSON.parse(params.usuario as string) : null;
  const apartamentos = params.apartamentos
    ? JSON.parse(params.apartamentos as string)
    : [];

  const rotate = useSharedValue(0);

  useEffect(() => {
    rotate.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 150 }),
        withTiming(10, { duration: 300 }),
        withTiming(-10, { duration: 300 }),
        withTiming(0, { duration: 150 }),
        withTiming(0, { duration: 2000 })
      ),
      -1,
      false
    );
  }, [rotate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  return (
    <SafeAreaView style={styles.container}>
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
        <Text style={styles.headerTitle}>Información del Usuario</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Información del usuario */}
        <View style={styles.userCard}>
          <View style={styles.userHeader}>
            <Ionicons name="person-circle" size={48} color={COLORS.primary} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {usuario?.nombre} {usuario?.apellido}
              </Text>
              <Text style={styles.userDocument}>
                Cédula: {usuario?.documento}
              </Text>
              <Text style={styles.userEmail}>{usuario?.email}</Text>
              <Text style={styles.userPhone}>{usuario?.telefono}</Text>

              {/* Estado del usuario */}
              <View
                style={[
                  styles.statusBadge,
                  usuario?.estado === "activo"
                    ? styles.statusActive
                    : styles.statusInactive,
                ]}
              >
                <Ionicons
                  name={
                    usuario?.estado === "activo"
                      ? "checkmark-circle"
                      : "close-circle"
                  }
                  size={12}
                  color={
                    usuario?.estado === "activo" ? COLORS.success : COLORS.error
                  }
                />
                <Text
                  style={[
                    styles.statusText,
                    usuario?.estado === "activo"
                      ? styles.statusActiveText
                      : styles.statusInactiveText,
                  ]}
                >
                  {usuario?.estado === "activo" ? "Activo" : "Inactivo"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Apartamentos */}
        <View style={styles.apartmentsCard}>
          <Text style={styles.apartmentsTitle}>
            Inmuebles Actuales ({apartamentos.length})
          </Text>

          {apartamentos.length > 0 ? (
            apartamentos.map((apt: any) => (
              <View key={apt.id} style={styles.apartmentItem}>
                <View style={styles.apartmentInfo}>
                  <Text style={styles.apartmentCode}>{apt.codigo_apt}</Text>
                  <Text style={styles.apartmentDetails}>
                    Bloque {apt.bloque} - Coeficiente: {apt.coeficiente}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.noApartments}>
              <Ionicons
                name="home-outline"
                size={32}
                color={COLORS.text.muted}
              />
              <Text style={styles.noApartmentsText}>
                Este usuario no tiene inmuebles asignados
              </Text>
            </View>
          )}
        </View>

        {/* Acciones */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Acciones Disponibles</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              router.push({
                pathname: "/(screens)/propietarios/seleccionar-apartamento",
                params: {
                  usuario: JSON.stringify(usuario),
                  esUsuarioNuevo: "false",
                },
              });
            }}
          >
            <Animated.View style={animatedStyle}>
              <Ionicons
                name="swap-horizontal"
                size={28}
                color={COLORS.primary}
              />
            </Animated.View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Transferir Unidad</Text>
              <Text style={styles.actionDescription}>
                Transferir la propiedad de un inmueble a este usuario
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: THEME.borderRadius.md,
    backgroundColor: THEME.colors.surfaceLight,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.header.title,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: THEME.spacing.lg,
  },
  userCard: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  userInfo: {
    marginLeft: THEME.spacing.md,
    flex: 1,
  },
  userName: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: 4,
  },
  userDocument: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.text.secondary,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.text.secondary,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.sm,
    marginTop: THEME.spacing.sm,
  },
  statusActive: {
    backgroundColor: COLORS.success + "20",
  },
  statusInactive: {
    backgroundColor: COLORS.error + "20",
  },
  statusText: {
    fontSize: THEME.fontSize.xs,
    fontWeight: "600",
    marginLeft: 4,
  },
  statusActiveText: {
    color: COLORS.success,
  },
  statusInactiveText: {
    color: COLORS.error,
  },
  apartmentsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  apartmentsTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: THEME.spacing.md,
  },
  apartmentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: THEME.spacing.sm,
    paddingHorizontal: THEME.spacing.md,
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.sm,
  },
  apartmentInfo: {
    flex: 1,
  },
  apartmentCode: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: COLORS.primary,
  },
  apartmentDetails: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  transferButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primaryLight + "20",
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    borderRadius: THEME.borderRadius.sm,
    gap: 4,
  },
  transferButtonText: {
    color: COLORS.primary,
    fontSize: THEME.fontSize.xs,
    fontWeight: "600",
  },
  noApartments: {
    alignItems: "center",
    paddingVertical: THEME.spacing.xl,
  },
  noApartmentsText: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.text.muted,
    textAlign: "center",
    marginTop: THEME.spacing.sm,
  },
  actionsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.xl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  actionsTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: COLORS.text.primary,
    marginBottom: THEME.spacing.md,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: THEME.spacing.md,
    paddingHorizontal: THEME.spacing.lg,
    borderRadius: THEME.borderRadius.lg,
    marginBottom: THEME.spacing.sm,
    backgroundColor: THEME.colors.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionInfo: {
    flex: 1,
    marginLeft: THEME.spacing.md,
  },
  actionTitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: COLORS.text.primary,
  },
  actionDescription: {
    fontSize: THEME.fontSize.sm,
    color: COLORS.text.secondary,
    marginTop: 2,
  },
  actionButtonDisabled: {
    backgroundColor: COLORS.text.muted + "15",
    opacity: 0.5,
    borderWidth: 1,
    borderColor: COLORS.text.muted + "30",
    borderStyle: "dashed",
  },
  actionTitleDisabled: {
    color: COLORS.text.muted,
  },
  actionDescriptionDisabled: {
    color: COLORS.text.muted,
  },
  // Estados de carga y hover
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: THEME.borderRadius.md,
    zIndex: 10,
  },
  actionButtonHover: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
    transform: [{ scale: 1.02 }],
  },
  cardHover: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  // Estados responsivos
  userCardLarge: {
    padding: THEME.spacing.xl,
  },
  userCardSmall: {
    padding: THEME.spacing.md,
  },
  // Gradientes y efectos visuales
  gradientOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.primary,
    opacity: 0.7,
  },
  successGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: COLORS.success,
  },
  // Estados de interacción
  pressedState: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  // Mejoras de accesibilidad
  focusState: {
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
});
