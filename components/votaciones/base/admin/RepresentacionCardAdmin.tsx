import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";

interface RepresentacionCardAdminProps {
  coeficienteTotal: number;
  apartamentosCount: number;
  apartamentosNumeros: string[];
  asambleaId?: number;
}

const RepresentacionCardAdmin: React.FC<RepresentacionCardAdminProps> = ({
  coeficienteTotal,
  apartamentosCount,
  apartamentosNumeros,
}) => {
  const hasApartments = apartamentosCount > 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Tu Representación</Text>
        </View>
      </View>

      {hasApartments ? (
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
        <View style={styles.noApartmentsContainer}>
          <Ionicons
            name="information-circle"
            size={20}
            color={THEME.colors.text.secondary}
          />
          <Text style={styles.noApartmentsText}>
            No tienes inmuebles registrados
          </Text>
          <Text style={styles.noApartmentsSubtext}>
            Moderando como administrador
          </Text>
        </View>
      )}
    </View>
  );
};

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
    color: THEME.colors.admin,
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
    color: THEME.colors.admin,
    marginTop: THEME.spacing.xs,
    fontWeight: "500",
  },
});

export default RepresentacionCardAdmin;
