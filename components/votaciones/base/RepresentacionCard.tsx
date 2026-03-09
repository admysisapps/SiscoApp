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
          <View style={styles.coeficienteContainer}>
            <View style={styles.coeficienteMain}>
              <Text style={styles.coeficienteValue}>
                {(coeficienteTotal * 100).toFixed(2)}
              </Text>
              <Text style={styles.coeficienteSymbol}>%</Text>
            </View>
            <Text style={styles.coeficienteLabel}>coeficiente total</Text>
          </View>

          <View style={styles.apartmentsList}>
            {apartamentosNumeros.map((apt) => (
              <View key={apt} style={styles.apartmentChip}>
                <Text style={styles.apartmentChipText}>Inm. {apt}</Text>
              </View>
            ))}
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
    borderWidth: 1,
    borderColor: THEME.colors.border,
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
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    letterSpacing: 0.5,
    marginLeft: 0,
    marginBottom: 4,
  },
  coeficienteContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  coeficienteMain: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  coeficienteValue: {
    fontSize: 36,
    fontWeight: "800",
    color: THEME.colors.primary,
    lineHeight: 36,
  },
  coeficienteSymbol: {
    fontSize: 20,
    fontWeight: "600",
    color: THEME.colors.primary,
    marginLeft: 4,
  },
  coeficienteLabel: {
    fontSize: 13,
    color: THEME.colors.text.secondary,
    marginTop: 4,
  },
  apartmentsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  apartmentChip: {
    backgroundColor: THEME.colors.background,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  apartmentChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.colors.text.primary,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  observerBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
});
