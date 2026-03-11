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
  cancelAnimation,
} from "react-native-reanimated";
import ScreenHeader from "@/components/shared/ScreenHeader";

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
    return () => cancelAnimation(rotate);
  }, [rotate]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Información del Usuario"
        onBackPress={() => router.back()}
      />

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
});
