import React, { useEffect, useState, useRef } from "react";
import { Fontisto, Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { useRouter } from "expo-router";
import { quorumService } from "@/services/quorumService";
import { THEME } from "@/constants/theme";

interface QuorumData {
  quorum_requerido: number;
  quorum_alcanzado: number;
}

interface QuorumChartProps {
  asambleaId?: number;
  disablePolling?: boolean;
  quorumData?: QuorumData;
}

export const QuorumChart: React.FC<QuorumChartProps> = ({
  asambleaId,
  disablePolling = false,
  quorumData: externalQuorumData,
}) => {
  const router = useRouter();
  const [quorumData, setQuorumData] = useState<QuorumData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [displayPercentage, setDisplayPercentage] = useState(0);

  useEffect(() => {
    const listener = animatedValue.addListener(({ value }) => {
      setDisplayPercentage(value);
    });

    if (externalQuorumData) {
      const newPercentage = Math.min(
        externalQuorumData.quorum_alcanzado * 100,
        100
      );
      Animated.timing(animatedValue, {
        toValue: newPercentage,
        duration: 800,
        useNativeDriver: false,
      }).start();
      setQuorumData(externalQuorumData);
      setLoading(false);

      return () => {
        animatedValue.removeListener(listener);
      };
    }

    const loadData = async (isPolling = false) => {
      try {
        if (!isPolling) setLoading(true);

        if (!asambleaId) {
          setError("ID de asamblea no proporcionado");
          setLoading(false);
          return;
        }

        const response = await quorumService.getQuorumAsamblea(asambleaId);

        if (response.success) {
          const newData = {
            quorum_requerido: response.quorum_requerido,
            quorum_alcanzado: response.quorum_alcanzado,
          };

          const newPercentage = Math.min(newData.quorum_alcanzado * 100, 100);

          Animated.timing(animatedValue, {
            toValue: newPercentage,
            duration: 800,
            useNativeDriver: false,
          }).start();

          setQuorumData(newData);
          setError(null);
        } else {
          setError(response.error || "Error al cargar quorum");
        }
      } catch {
        setError("Error de conexión");
      } finally {
        if (!isPolling) setLoading(false);
      }
    };

    loadData();

    const interval = disablePolling
      ? null
      : setInterval(() => {
          loadData(true);
        }, 5000);

    return () => {
      if (interval) clearInterval(interval);
      animatedValue.removeListener(listener);
    };
  }, [externalQuorumData, disablePolling, asambleaId, animatedValue]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Estado del Quórum</Text>

        <View style={styles.chartContainer}>
          <View style={[styles.skeletonChart, styles.skeleton]} />
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <View style={[styles.skeletonText, styles.skeleton]} />
            <View style={[styles.skeletonValue, styles.skeleton]} />
          </View>

          <View style={styles.statItem}>
            <View style={[styles.skeletonText, styles.skeleton]} />
            <View style={[styles.skeletonValue, styles.skeleton]} />
          </View>

          <View style={[styles.statItem, styles.statusItem]}>
            <View style={[styles.skeletonText, styles.skeleton]} />
            <View style={[styles.skeletonStatus, styles.skeleton]} />
          </View>
        </View>
      </View>
    );
  }

  if (error || !quorumData) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          {error || "No hay datos disponibles"}
        </Text>
      </View>
    );
  }

  const porcentajeAlcanzado = Math.min(displayPercentage, 100);
  const porcentajeFaltante = Math.max(0, 100 - porcentajeAlcanzado);
  const quorumCumplido =
    porcentajeAlcanzado >= quorumData.quorum_requerido * 100;

  const pieData = [
    {
      value: porcentajeAlcanzado,
      color: quorumCumplido ? THEME.colors.success : THEME.colors.warning,
      text: `${porcentajeAlcanzado.toFixed(1)}%`,
    },
    {
      value: porcentajeFaltante,
      color: THEME.colors.border,
      text: "",
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estado del Quórum</Text>

      <View style={styles.chartContainer}>
        <PieChart
          data={pieData}
          radius={80}
          innerRadius={50}
          centerLabelComponent={() => (
            <View style={styles.centerLabel}>
              <Text style={styles.centerPercentage}>
                {porcentajeAlcanzado.toFixed(1)}%
              </Text>
              <Text style={styles.centerText}>Alcanzado</Text>
            </View>
          )}
        />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Asistencia Total</Text>
          <Text style={styles.statValue}>
            {porcentajeAlcanzado.toFixed(2)}%
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Quórum Requerido</Text>
          <Text style={styles.statValue}>
            {(quorumData.quorum_requerido * 100).toFixed(2)}%
          </Text>
        </View>

        <View style={[styles.statItem, styles.statusItem]}>
          <Text style={styles.statLabel}>Estado</Text>
          <Text
            style={[
              styles.statusText,
              {
                color: quorumCumplido
                  ? THEME.colors.success
                  : THEME.colors.warning,
              },
            ]}
          >
            {quorumCumplido ? "Quórum Válido" : "Quórum Insuficiente"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.statItem}
          onPress={() =>
            router.push(`/participantes-lista?asambleaId=${asambleaId}`)
          }
        >
          <View style={styles.participantsLabelContainer}>
            <Fontisto
              name="persons"
              size={16}
              color={THEME.colors.text.secondary}
              style={styles.participantsIcon}
            />
            <Text style={styles.statLabel}>Participantes</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={THEME.colors.text.secondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
    alignItems: "center",
  },
  title: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginBottom: THEME.spacing.lg,
  },
  chartContainer: {
    marginBottom: THEME.spacing.lg,
  },
  centerLabel: {
    alignItems: "center",
  },
  centerPercentage: {
    fontSize: THEME.fontSize.xl,
    fontWeight: "bold",
    color: THEME.colors.text.primary,
  },
  centerText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
  },
  statsContainer: {
    width: "100%",
  },
  statItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: THEME.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  statusItem: {
    borderBottomWidth: 0,
  },
  statLabel: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
  },
  statValue: {
    fontSize: THEME.fontSize.sm,
    fontWeight: "600",
    color: THEME.colors.primary,
  },
  statusText: {
    fontSize: THEME.fontSize.sm,
    fontWeight: "600",
  },
  loadingText: {
    marginTop: THEME.spacing.sm,
    color: THEME.colors.text.secondary,
  },
  errorText: {
    color: THEME.colors.error,
    textAlign: "center",
  },
  skeleton: {
    backgroundColor: THEME.colors.border,
    opacity: 0.3,
  },
  skeletonChart: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  skeletonText: {
    width: 100,
    height: 16,
    borderRadius: 4,
  },
  skeletonValue: {
    width: 60,
    height: 16,
    borderRadius: 4,
  },
  skeletonStatus: {
    width: 80,
    height: 16,
    borderRadius: 4,
  },
  participantsLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME.spacing.xs,
  },
  participantsIcon: {
    marginRight: THEME.spacing.xs,
  },
});
