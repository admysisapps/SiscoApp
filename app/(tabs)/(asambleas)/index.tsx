import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import { useAsambleas } from "@/contexts/AsambleaContext";
import { THEME } from "@/constants/theme";
import AsambleaCard from "@/components/asambleas/AsambleaCard";
import ScreenHeader from "@/components/shared/ScreenHeader";

export default function AsambleasScreen() {
  const { asambleas, cargarAsambleas, cargando } = useAsambleas();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await cargarAsambleas();
    setRefreshing(false);
  }, [cargarAsambleas]);

  const handleAsambleaPress = useCallback((asambleaId: number) => {
    router.push(`/(tabs)/(asambleas)/${asambleaId}`);
  }, []);

  useEffect(() => {
    cargarAsambleas();
  }, [cargarAsambleas]);

  return (
    <View style={styles.container}>
      <ScreenHeader title="Asambleas" />
      {/* Contenido */}
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[THEME.colors.primary]}
          />
        }
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {cargando ? (
          <View style={styles.centerContainer}>
            <LottieView
              source={require("@/assets/lottie/loader.json")}
              autoPlay
              loop
              style={styles.lottieLoading}
            />
          </View>
        ) : asambleas.length === 0 ? (
          <View style={styles.centerContainer}>
            <Ionicons
              name="calendar-outline"
              size={64}
              color={THEME.colors.text.muted}
            />
            <Text style={styles.emptyTitle}>No hay asambleas</Text>
            <Text style={styles.emptyText}>
              No se encontraron asambleas programadas para este proyecto.
            </Text>
          </View>
        ) : (
          <View style={styles.scrollContent}>
            {asambleas.map((asamblea) => (
              <AsambleaCard
                key={asamblea.id}
                asamblea={asamblea}
                onPress={() => handleAsambleaPress(asamblea.id)}
              />
            ))}
            <View style={styles.bottomSpacer} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    padding: THEME.spacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    marginTop: THEME.spacing.md,
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  emptyText: {
    marginTop: THEME.spacing.sm,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.secondary,
    textAlign: "center",
  },
  bottomSpacer: {
    height: 100,
  },
  lottieLoading: {
    width: 200,
    height: 200,
  },
});
