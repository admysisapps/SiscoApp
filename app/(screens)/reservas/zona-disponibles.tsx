import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { EspacioCard } from "@/components/reservas/EspacioCard";
import { EspacioCardSkeleton } from "@/components/zonasComunes/EspacioCardSkeleton";
import { THEME } from "@/constants/theme";
import { useEspacios } from "@/hooks/useEspacios";
import { Espacio } from "@/types/Espacio";

export default function EspaciosDisponiblesScreen() {
  const {
    data: espacios = [],
    isLoading,
    refetch,
  } = useEspacios({
    solo_activos: false,
  });

  const handleEspacioPress = (espacio: Espacio) => {
    const params = new URLSearchParams({
      id: espacio.id.toString(),
      ...(espacio.imagen_nombre && { imagen_nombre: espacio.imagen_nombre }),
    });
    router.push(`/(screens)/reservas/detalle-zona?${params}`);
  };

  const handleBackPress = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={THEME.colors.header.title}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Zonas Comunes</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={false} onRefresh={refetch} />
        }
      >
        <View style={styles.section}>
          {isLoading ? (
            <>
              <EspacioCardSkeleton />
              <EspacioCardSkeleton />
              <EspacioCardSkeleton />
            </>
          ) : espacios.length > 0 ? (
            espacios.map((espacio: Espacio) => (
              <EspacioCard
                key={espacio.id}
                item={espacio}
                onPress={handleEspacioPress}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Image
                source={require("@/assets/images/ZonasComunes.webp")}
                style={styles.emptyImage}
                resizeMode="contain"
              />
              <Text style={styles.emptyTitle}>No hay zonas comunes</Text>
              <Text style={styles.emptySubtitle}>
                Actualmente no hay zonas comunes disponibles para reservar
              </Text>
            </View>
          )}
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
  },
  section: {
    padding: THEME.spacing.md,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 32,
  },
  emptyImage: {
    width: 400,
    height: 400,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#64748B",
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginTop: 8,
    textAlign: "center",
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 32,
  },
  loadingText: {
    fontSize: 16,
    color: THEME.colors.text.secondary,
    textAlign: "center",
  },
});
