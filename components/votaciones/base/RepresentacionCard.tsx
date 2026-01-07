import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";

interface RepresentacionCardProps {
  coeficienteTotal: number;
  apartamentosCount: number;
  apartamentosNumeros: string[];
  asambleaId?: number;
  titulo?: string;
  observerMode?: boolean;
}

export default function RepresentacionCard({
  coeficienteTotal,
  apartamentosCount,
  apartamentosNumeros,
  asambleaId,
  titulo = "Tu representación",
  observerMode = false,
}: RepresentacionCardProps) {
  const isObserver = observerMode || apartamentosCount === 0;
  const hasApartments = apartamentosCount > 0;

  return (
    <View style={[styles.card, isObserver && styles.observerCard]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>
            {isObserver ? "Modo Observador" : titulo}
          </Text>
        </View>
        {isObserver && (
          <View style={styles.observerBadge}>
            <Text style={styles.observerBadgeText}>SIN VOTO</Text>
          </View>
        )}
      </View>

      {hasApartments && !isObserver ? (
        <>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{apartamentosCount}</Text>
              <Text style={styles.statLabel}>
                inmuebles{apartamentosCount !== 1 ? "s" : ""}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {(coeficienteTotal * 100).toFixed(2)}%
              </Text>
              <Text style={styles.statLabel}>Coeficiente</Text>
            </View>
          </View>

          <View style={styles.apartmentsList}>
            <Text style={styles.apartmentsLabel}>inmuebles:</Text>
            <Text style={styles.apartmentsNumbers}>
              {apartamentosNumeros.join(", ")}
            </Text>
          </View>
        </>
      ) : (
        <View style={styles.observerInfoContainer}>
          <View style={styles.observerIconContainer}>
            <Ionicons
              name="people-outline"
              size={32}
              color={THEME.colors.warning}
            />
          </View>
          <Text style={styles.observerTitle}>
            Has otorgado poder de tus inmuebles
          </Text>
          <Text style={styles.observerDescription}>
            Como delegaste la representación de todos tus inmuebles a uno o más
            apoderados, ya no puedes votar en esta asamblea.
          </Text>
          <Text style={styles.observerDescription}>
            Tus apoderados asistirán y votarán en tu nombre. Podrás ver los
            resultados cuando finalicen las votaciones.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.lg,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME.spacing.md,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  title: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginLeft: THEME.spacing.sm,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: THEME.spacing.md,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: THEME.fontSize.xl,
    fontWeight: "700",
    color: THEME.colors.primary,
  },
  statLabel: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  apartmentsList: {
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.md,
  },
  apartmentsLabel: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    marginBottom: 4,
  },
  apartmentsNumbers: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.primary,
    fontWeight: "500",
  },
  noApartmentsContainer: {
    alignItems: "center",
    paddingVertical: THEME.spacing.md,
  },
  noApartmentsText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.sm,
    textAlign: "center",
  },
  noApartmentsSubtext: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.warning,
    marginTop: THEME.spacing.xs,
    fontWeight: "500",
  },
  observerInfoContainer: {
    alignItems: "center",
    paddingVertical: THEME.spacing.lg,
    paddingHorizontal: THEME.spacing.md,
  },
  observerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF3CD",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: THEME.spacing.md,
  },
  observerTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: THEME.colors.text.heading,
    textAlign: "center",
    marginBottom: THEME.spacing.sm,
  },
  observerDescription: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: THEME.spacing.xs,
  },
  observerCard: {
    backgroundColor: "#FFFBF0",
  },
  observerBadge: {
    backgroundColor: THEME.colors.warning,
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: 4,
    borderRadius: THEME.borderRadius.sm,
  },
  observerBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
