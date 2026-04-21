import React, { useMemo } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LottieView from "lottie-react-native";
import ScreenHeader from "@/components/shared/ScreenHeader";
import { MovimientosList } from "@/components/estadoCuenta/MovimientosList";
import {
  useEstadoCuenta,
  useEstadoCuentaAnioAnterior,
} from "@/hooks/useEstadoCuenta";
import { THEME } from "@/constants/theme";

export default function EstadoCuentaScreen() {
  const { estadoCuenta, isLoading, error } = useEstadoCuenta();
  const {
    estadoCuenta: estadoAnterior,
    isLoading: isLoadingAnterior,
    fetch: fetchAnioAnteriorRaw,
  } = useEstadoCuentaAnioAnterior();

  const fetchAnioAnterior = React.useCallback(() => {
    void fetchAnioAnteriorRaw();
  }, [fetchAnioAnteriorRaw]);

  const movimientos = useMemo(() => {
    if (!estadoCuenta) return [];
    const todos = estadoAnterior
      ? [...estadoCuenta.movimientos, ...estadoAnterior.movimientos]
      : [...estadoCuenta.movimientos];
    return todos.sort((a, b) => {
      const toSortable = (p: string) => p.slice(3) + p.slice(0, 2);
      return toSortable(b.periodo).localeCompare(toSortable(a.periodo));
    });
  }, [estadoCuenta, estadoAnterior]);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Estado de Cuenta" />

      {isLoading ? (
        <View style={styles.centerContainer}>
          <LottieView
            source={require("@/assets/lottie/loader.json")}
            autoPlay
            loop
            style={styles.lottie}
          />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>
            Error al cargar el estado de cuenta
          </Text>
        </View>
      ) : !estadoCuenta ? null : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <MovimientosList
            movimientos={movimientos}
            isLoadingAnioAnterior={isLoadingAnterior}
            anioAnteriorCargado={!!estadoAnterior}
            onCargarAnioAnterior={fetchAnioAnterior}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: THEME.spacing.md,
    paddingBottom: 40,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  lottie: {
    width: 200,
    height: 200,
  },
  errorText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.error,
    textAlign: "center",
  },
});
