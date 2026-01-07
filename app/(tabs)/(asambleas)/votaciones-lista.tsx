import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import LottieView from "lottie-react-native";
import { votacionesService } from "@/services/votacionesService";
import { Votacion, PreguntaVotacion } from "@/types/Votaciones";
import { THEME } from "@/constants/theme";

export default function VotacionesLista() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const asambleaId = params.asambleaId
    ? parseInt(params.asambleaId as string)
    : null;

  const [votaciones, setVotaciones] = useState<Votacion[]>([]);
  const [loading, setLoading] = useState(true);

  const cargarVotaciones = useCallback(async () => {
    if (!asambleaId) return;
    try {
      const response = await votacionesService.obtenerVotaciones(asambleaId);
      if (response.success) {
        setVotaciones(response.votaciones);
      }
    } catch (error) {
      console.error("Error cargando votaciones:", error);
    } finally {
      setLoading(false);
    }
  }, [asambleaId]);

  useEffect(() => {
    cargarVotaciones();
  }, [cargarVotaciones]);

  const getEstadoBadge = (estado: string) => {
    const badges = {
      programada: {
        color: "#3B82F6",
        icon: "time-outline",
        text: "Programada",
      },
      en_curso: { color: "#10B981", icon: "play-circle", text: "En Curso" },
      finalizada: {
        color: "#94A3B8",
        icon: "checkmark-circle",
        text: "Finalizada",
      },
      cancelada: { color: "#EF4444", icon: "close-circle", text: "Cancelada" },
    };
    return badges[estado as keyof typeof badges] || badges.programada;
  };

  const renderPregunta = React.useCallback(
    ({ item }: { item: PreguntaVotacion }) => {
      const badge = getEstadoBadge(item.estado);

      return (
        <View style={styles.preguntaCard}>
          <View style={styles.preguntaInfo}>
            <Text style={styles.preguntaTexto}>{item.pregunta}</Text>
            <View style={styles.preguntaMeta}>
              <View
                style={[styles.badge, { backgroundColor: badge.color + "20" }]}
              >
                <Ionicons
                  name={badge.icon as any}
                  size={14}
                  color={badge.color}
                />
                <Text style={[styles.badgeText, { color: badge.color }]}>
                  {badge.text}
                </Text>
              </View>
              <Text style={styles.tipoPregunta}>
                {item.tipo_pregunta === "si_no" ? "Sí/No" : "Múltiple"}
              </Text>
            </View>
          </View>

          {item.tipo_pregunta === "multiple" && item.opciones && (
            <View style={styles.opcionesContainer}>
              {item.opciones.map((opcion: any) => (
                <Text key={opcion.id} style={styles.opcionTexto}>
                  • {opcion.opcion}
                </Text>
              ))}
            </View>
          )}
        </View>
      );
    },
    []
  );

  const renderVotacion = React.useCallback(
    ({ item }: { item: Votacion }) => (
      <View style={styles.votacionCard}>
        <Text style={styles.votacionTitulo}>{item.titulo}</Text>
        {item.descripcion ? (
          <Text style={styles.votacionDesc}>{item.descripcion}</Text>
        ) : null}
        <FlatList
          data={
            item.preguntas?.map((p) => ({
              ...p,
              votacion_id: item.id,
            })) as PreguntaVotacion[]
          }
          renderItem={renderPregunta}
          keyExtractor={(pregunta) => pregunta.id.toString()}
        />
      </View>
    ),
    [renderPregunta]
  );

  if (loading) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["left", "right", "bottom"]}
      >
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
          <Text style={styles.headerTitle}>Preguntas de Votación</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.loadingContainer}>
          <LottieView
            source={require("@/assets/lottie/LoadingVotaciones.json")}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
          <View style={styles.textPlaceholder} />
        </View>
      </SafeAreaView>
    );
  }

  if (votaciones.length === 0) {
    return (
      <SafeAreaView
        style={styles.container}
        edges={["left", "right", "bottom"]}
      >
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
          <Text style={styles.headerTitle}>Preguntas de Votación</Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyContainer}>
          <LottieView
            source={require("@/assets/lottie/LoadingVotaciones.json")}
            autoPlay
            loop
            style={styles.lottieAnimation}
          />
          <Text style={styles.emptyText}>No hay votaciones disponibles</Text>
          <Text style={styles.emptySubtext}>
            Las preguntas de votación aparecerán aquí cuando estén disponibles
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
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
        <Text style={styles.headerTitle}>Preguntas de Votación</Text>
        <View style={styles.headerSpacer} />
      </View>
      <FlatList
        data={votaciones}
        renderItem={renderVotacion}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  lottieAnimation: {
    width: 200,
    height: 200,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: THEME.spacing.xl,
  },
  textPlaceholder: {
    height: 80,
  },
  emptyText: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginTop: THEME.spacing.md,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    marginTop: THEME.spacing.xs,
    textAlign: "center",
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
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.header.title,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: {
    width: 40,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  votacionCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  votacionTitulo: {
    fontSize: 18,
    fontWeight: "bold",
    color: THEME.colors.text.heading,
    marginBottom: 8,
  },
  votacionDesc: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    marginBottom: 12,
  },
  preguntaCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    padding: 18,
    marginTop: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  preguntaInfo: {
    flex: 1,
  },
  preguntaTexto: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.text.heading,
    marginBottom: 10,
    lineHeight: 22,
  },
  preguntaMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tipoPregunta: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
  },
  opcionesContainer: {
    marginTop: 12,
    paddingLeft: 8,
  },
  opcionTexto: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    marginVertical: 3,
    lineHeight: 20,
  },
});
