import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import { BarChart, PieChart } from "react-native-gifted-charts";
import LottieView from "lottie-react-native";
import { THEME } from "@/constants/theme";

const { width: screenWidth } = Dimensions.get("window");
const chartWidth = screenWidth - THEME.spacing.lg * 4;

interface ResultadoOpcion {
  id: number | string;
  opcion_id: number;
  opcion_texto: string;
  total_votos: number;
  total_coeficiente: number;
}

interface ResultadosVotacionProps {
  resultados: ResultadoOpcion[];
  preguntaId: number;
  preguntaTexto?: string;
}

const COLORES = [
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#EAB308",
  "#14B8A6",
  "#A855F7",
];

// Genera colores adicionales si se necesitan más
const generarColor = (index: number): string => {
  if (index < COLORES.length) return COLORES[index];
  const hue = (index * 137.5) % 360; // Ángulo dorado para distribución uniforme
  return `hsl(${hue}, 70%, 55%)`;
};

export const ResultadosVotacion: React.FC<ResultadosVotacionProps> = ({
  resultados,
  preguntaTexto,
}) => {
  const [tipoGrafico, setTipoGrafico] = useState<"torta" | "barras">("barras");
  const [opcionEnfocada, setOpcionEnfocada] = useState<ResultadoOpcion | null>(
    null
  );
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const totalVotos = resultados.reduce(
    (sum, r) => sum + (Number(r.total_votos) || 0),
    0
  );
  const totalCoeficiente = resultados.reduce(
    (sum, r) => sum + (parseFloat(String(r.total_coeficiente)) || 0),
    0
  );

  const renderGraficoBarras = () => {
    // Separar abstención de las demás opciones
    const abstencion = resultados.find((r) => r.opcion_texto === "Abstención");
    const opcionesVoto = resultados.filter(
      (r) => r.opcion_texto !== "Abstención"
    );

    // Tomar top 5 de opciones de voto + abstención siempre
    const top5Opciones = [...opcionesVoto]
      .sort((a, b) => Number(b.total_coeficiente) - Number(a.total_coeficiente))
      .slice(0, 5);

    const top6Resultados = abstencion
      ? [...top5Opciones, abstencion]
      : top5Opciones;

    const colorMap = new Map(
      resultados.map((r, idx) => [
        r.opcion_texto,
        r.opcion_texto === "Abstención" ? "#94a3b8" : generarColor(idx),
      ])
    );

    const barData = top6Resultados.map((resultado) => {
      const coef = parseFloat(String(resultado.total_coeficiente)) || 0;
      const porcentaje =
        totalCoeficiente > 0 ? (coef / totalCoeficiente) * 100 : 0;
      return {
        value: porcentaje,
        label: resultado.opcion_texto.substring(0, 3),
        frontColor: colorMap.get(resultado.opcion_texto) || COLORES[0],
      };
    });

    const barWidth = Math.min(
      50,
      Math.max(
        30,
        (chartWidth - top6Resultados.length * 30) / top6Resultados.length
      )
    );

    return (
      <View style={styles.barrasContainer}>
        <BarChart
          data={barData}
          width={chartWidth}
          height={200}
          barWidth={barWidth}
          spacing={20}
          roundedTop
          roundedBottom
          hideRules
          xAxisThickness={1}
          yAxisThickness={0}
          xAxisColor={THEME.colors.border}
          yAxisTextStyle={{ color: THEME.colors.text.secondary, fontSize: 10 }}
          xAxisLabelTextStyle={{
            color: THEME.colors.text.primary,
            fontSize: 12,
          }}
          noOfSections={4}
          maxValue={100}
          formatYLabel={(value) => `${Number(value).toFixed(0)}%`}
        />
        <View style={styles.leyenda}>
          {resultados.map((resultado, index) => {
            const coef = parseFloat(String(resultado.total_coeficiente)) || 0;
            const porcentaje =
              totalCoeficiente > 0 ? (coef / totalCoeficiente) * 100 : 0;
            const esAbstencion = resultado.opcion_texto === "Abstención";
            return (
              <View
                key={resultado.id || `abs-${index}`}
                style={styles.leyendaItem}
              >
                <View
                  style={[
                    styles.leyendaColor,
                    {
                      backgroundColor: esAbstencion
                        ? "#94a3b8"
                        : generarColor(index),
                    },
                  ]}
                />
                <View style={styles.leyendaInfo}>
                  <Text style={styles.leyendaTexto} numberOfLines={1}>
                    {resultado.opcion_texto}
                  </Text>
                  <Text style={styles.leyendaPorcentaje}>
                    {porcentaje.toFixed(1)}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  useEffect(() => {
    const maxCoeficiente = Math.max(
      ...resultados.map((r) => Number(r.total_coeficiente) || 0)
    );
    const opcionGanadora = resultados.find(
      (r) => (Number(r.total_coeficiente) || 0) === maxCoeficiente
    );
    if (opcionGanadora) {
      setOpcionEnfocada(opcionGanadora);
    }
  }, [resultados]);

  const renderGraficoTorta = () => {
    const pieData = resultados.map((resultado, index) => {
      const esAbstencion = resultado.opcion_texto === "Abstención";
      return {
        value: parseFloat(String(resultado.total_coeficiente)) || 0,
        color: esAbstencion ? "#94a3b8" : generarColor(index),
        focused: opcionEnfocada?.id === resultado.id,
        onPress: () => {
          Animated.sequence([
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 150,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();
          setOpcionEnfocada(resultado);
        },
      };
    });

    return (
      <View style={styles.tortaContainer}>
        <PieChart
          data={pieData}
          donut
          radius={90}
          innerRadius={60}
          focusOnPress
          centerLabelComponent={() => (
            <Animated.View style={[styles.tortaCentro, { opacity: fadeAnim }]}>
              <Text style={styles.totalVotosTexto}>
                {(Number(opcionEnfocada?.total_coeficiente) || 0).toFixed(2)}
              </Text>
              <Text style={styles.totalVotosLabel}>Coeficiente</Text>
            </Animated.View>
          )}
        />
        <View style={styles.leyenda}>
          {resultados.map((resultado, index) => {
            const coef = parseFloat(String(resultado.total_coeficiente)) || 0;
            const porcentaje =
              totalCoeficiente > 0 ? (coef / totalCoeficiente) * 100 : 0;
            const esAbstencion = resultado.opcion_texto === "Abstención";

            return (
              <View
                key={resultado.id || `abs-${index}`}
                style={styles.leyendaItem}
              >
                <View
                  style={[
                    styles.leyendaColor,
                    {
                      backgroundColor: esAbstencion
                        ? "#94a3b8"
                        : generarColor(index),
                    },
                  ]}
                />
                <View style={styles.leyendaInfo}>
                  <Text style={styles.leyendaTexto} numberOfLines={1}>
                    {resultado.opcion_texto}
                  </Text>
                  <Text style={styles.leyendaPorcentaje}>
                    {porcentaje.toFixed(1)}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  if (!resultados || resultados.length === 0) {
    return (
      <View style={styles.container}>
        {preguntaTexto && (
          <View style={styles.preguntaContainer}>
            <Text style={styles.preguntaTexto}>{preguntaTexto}</Text>
          </View>
        )}
        <View style={styles.emptyContainer}>
          <LottieView
            source={require("@/assets/lottie/Chart.json")}
            autoPlay
            loop
            style={styles.emptyAnimation}
          />
          <Text style={styles.emptyText}>No hay resultados disponibles</Text>
          <Text style={styles.emptySubtext}>
            Los resultados se mostrarán cuando haya finalizado alguna votacion.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {preguntaTexto && (
        <View style={styles.preguntaContainer}>
          <Text style={styles.preguntaTexto}>{preguntaTexto}</Text>
        </View>
      )}
      <View style={styles.header}>
        <Text style={styles.titulo}>Resultados</Text>
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              tipoGrafico === "barras" && styles.toggleButtonActive,
            ]}
            onPress={() => setTipoGrafico("barras")}
          >
            <SimpleLineIcons
              name="chart"
              size={18}
              color={
                tipoGrafico === "barras" ? "#fff" : THEME.colors.text.secondary
              }
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              tipoGrafico === "torta" && styles.toggleButtonActive,
            ]}
            onPress={() => setTipoGrafico("torta")}
          >
            <SimpleLineIcons
              name="pie-chart"
              size={18}
              color={
                tipoGrafico === "torta" ? "#fff" : THEME.colors.text.secondary
              }
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.resumen}>
        <View style={styles.resumenItem}>
          <Text style={styles.resumenLabel}>Total Votos</Text>
          <Text style={styles.resumenValor}>{totalVotos}</Text>
        </View>
        <View style={styles.resumenItem}>
          <Text style={styles.resumenLabel}>Coeficiente Total</Text>
          <Text style={styles.resumenValor}>
            {((totalCoeficiente || 0) * 100).toFixed(2)}%
          </Text>
        </View>
      </View>

      {tipoGrafico === "barras" ? renderGraficoBarras() : renderGraficoTorta()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.lg,
    padding: THEME.spacing.lg,
  },
  preguntaContainer: {
    marginBottom: THEME.spacing.md,
    paddingBottom: THEME.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  preguntaTexto: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    lineHeight: 22,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: THEME.spacing.md,
  },
  titulo: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.borderRadius.md,
    padding: 3,
    gap: 4,
  },
  toggleButton: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.sm + 2,
    borderRadius: THEME.borderRadius.sm,
    minWidth: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleButtonActive: {
    backgroundColor: THEME.colors.primary,
  },
  resumen: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: THEME.spacing.lg,
    paddingVertical: THEME.spacing.md,
    backgroundColor: THEME.colors.background,
    borderRadius: THEME.borderRadius.md,
  },
  resumenItem: {
    alignItems: "center",
  },
  resumenLabel: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.text.secondary,
    marginBottom: 4,
  },
  resumenValor: {
    fontSize: THEME.fontSize.md,
    fontWeight: "700",
    color: THEME.colors.primary,
  },
  barrasContainer: {
    width: "100%",
    alignItems: "center",
    paddingVertical: THEME.spacing.md,
  },
  barTopLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  leyendaBarras: {
    marginTop: THEME.spacing.lg,
    gap: THEME.spacing.md,
  },
  leyendaBarraItem: {
    backgroundColor: THEME.colors.background,
    padding: THEME.spacing.sm,
    borderRadius: THEME.borderRadius.md,
  },
  leyendaBarraHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.xs,
  },
  leyendaBarraTexto: {
    flex: 1,
    fontSize: THEME.fontSize.sm,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  leyendaBarraStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingLeft: THEME.spacing.lg + 8,
  },
  leyendaBarraPorcentaje: {
    fontSize: THEME.fontSize.sm,
    fontWeight: "700",
    color: THEME.colors.primary,
  },
  leyendaBarraVotos: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.text.secondary,
  },
  leyendaBarraCoef: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.text.secondary,
  },
  tortaContainer: {
    alignItems: "center",
    paddingVertical: THEME.spacing.md,
  },
  tortaCentro: {
    justifyContent: "center",
    alignItems: "center",
  },
  totalVotosTexto: {
    fontSize: 24,
    fontWeight: "700",
    color: THEME.colors.primary,
  },
  totalVotosLabel: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.text.secondary,
  },
  leyenda: {
    width: "100%",
    gap: THEME.spacing.sm,
    marginTop: THEME.spacing.lg,
    alignSelf: "stretch",
  },
  leyendaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: THEME.spacing.sm,
  },
  leyendaColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  leyendaInfo: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  leyendaTexto: {
    flex: 1,
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.primary,
    marginRight: THEME.spacing.sm,
  },
  leyendaPorcentaje: {
    fontSize: THEME.fontSize.sm,
    fontWeight: "600",
    color: THEME.colors.text.secondary,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: THEME.spacing.xl * 2,
  },
  emptyAnimation: {
    width: 200,
    height: 200,
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
    paddingHorizontal: THEME.spacing.xl,
  },
});
