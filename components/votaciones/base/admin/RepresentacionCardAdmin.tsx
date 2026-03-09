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
    color: THEME.colors.admin,
    lineHeight: 36,
  },
  coeficienteSymbol: {
    fontSize: 20,
    fontWeight: "600",
    color: THEME.colors.admin,
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
    color: THEME.colors.admin,
    marginTop: THEME.spacing.xs,
    fontWeight: "500",
  },
});

export default RepresentacionCardAdmin;
