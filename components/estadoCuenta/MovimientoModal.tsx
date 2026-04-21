import { THEME } from "@/constants/theme";
import { Movimiento } from "@/types/cuentaCobro";
import React, { useRef, useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  PanResponder,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface MovimientoModalProps {
  visible: boolean;
  movimiento: Movimiento;
  onClose: () => void;
}

const formatCOP = (value: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(value);

const toNumber = (val: number | string): number =>
  typeof val === "number" ? val : parseFloat(val) || 0;

const MESES_FULL: Record<string, string> = {
  "01": "Enero",
  "02": "Febrero",
  "03": "Marzo",
  "04": "Abril",
  "05": "Mayo",
  "06": "Junio",
  "07": "Julio",
  "08": "Agosto",
  "09": "Septiembre",
  "10": "Octubre",
  "11": "Noviembre",
  "12": "Diciembre",
};

export const MovimientoModal: React.FC<MovimientoModalProps> = ({
  visible,
  movimiento,
  onClose,
}) => {
  const translateY = useRef(new Animated.Value(600)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const saldoFinal = parseFloat(
    movimiento.detalle[movimiento.detalle.length - 1]?.saldo ?? "0"
  );
  const alDia = saldoFinal <= 0;
  const totalPagado = movimiento.detalle.reduce(
    (s, d) => s + toNumber(d["pagos/ajustes"]),
    0
  );
  const [mes, anio] = movimiento.periodo.split("-");

  const estadoColor = alDia ? "#10B981" : "#EF4444";

  useEffect(() => {
    if (visible) {
      translateY.setValue(600);
      backdropOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          damping: 25,
          stiffness: 200,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, backdropOpacity]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 800,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 50 || g.vy > 0.5) {
          handleClose();
        } else {
          Animated.timing(translateY, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal
      animationType="none"
      transparent
      visible={visible}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity
            style={styles.backdropTouch}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
          <View {...panResponder.panHandlers}>
            <View style={styles.handleContainer}>
              <View style={styles.handle} />
            </View>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>
                {MESES_FULL[mes]} {anio}
              </Text>
              <Text style={styles.headerSubtitle}>
                Período {movimiento.periodo}
              </Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.scroll}>
            {/* Conceptos */}
            <View style={styles.card}>
              {/* Header tabla */}
              <View style={styles.tableHeaderRow}>
                <Text style={styles.tableHeaderCell}>CONCEPTO</Text>
                <Text style={styles.tableHeaderCell}>VALOR</Text>
              </View>

              {movimiento.detalle.map((item, i) => {
                const cuota = toNumber(item.cuota);
                const pagado = toNumber(item["pagos/ajustes"]);
                const isAnticipo = cuota === 0 && pagado > 0;
                const expandido = expandedIndex === i;

                return (
                  <View key={i}>
                    <TouchableOpacity
                      style={styles.row}
                      onPress={() => setExpandedIndex(expandido ? null : i)}
                      activeOpacity={0.6}
                    >
                      <Text style={styles.rowLabel}>
                        {isAnticipo ? "Anticipo" : item.descrip}
                      </Text>
                      <Text style={styles.rowValue}>
                        {isAnticipo ? "—" : formatCOP(cuota)}
                      </Text>
                    </TouchableOpacity>

                    {expandido && pagado > 0 && (
                      <View style={styles.expandedRow}>
                        <Text style={styles.expandedLabel}>
                          Pagos / Ajustes
                        </Text>
                        <Text style={styles.expandedValue}>
                          -{formatCOP(pagado)}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}

              {/* Total pagado */}
              {totalPagado > 0 && (
                <View style={styles.pagoRow}>
                  <Text style={styles.pagoLabel}>Total pagado</Text>
                  <Text style={styles.pagoValue}>
                    -{formatCOP(totalPagado)}
                  </Text>
                </View>
              )}

              {/* Saldo final */}
              <View
                style={[
                  styles.totalRow,
                  alDia && { backgroundColor: "#ECFDF5" },
                ]}
              >
                <Text style={[styles.totalLabel, { color: estadoColor }]}>
                  {alDia ? "SALDO A FAVOR" : "SALDO DEL PERÍODO"}
                </Text>
                <Text style={[styles.totalValue, { color: estadoColor }]}>
                  {formatCOP(Math.abs(saldoFinal))}
                </Text>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: THEME.colors.modalOverlay,
  },
  backdropTouch: {
    flex: 1,
  },
  sheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  handleContainer: {
    paddingVertical: 8,
    alignItems: "center",
  },
  handle: {
    width: 36,
    height: 5,
    backgroundColor: THEME.colors.border,
    borderRadius: 3,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.colors.text.primary,
  },
  headerSubtitle: {
    fontSize: 13,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: THEME.colors.surface,
  },
  tableHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    backgroundColor: "#F8FAFC",
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  rowLabel: {
    fontSize: 14,
    color: THEME.colors.text.primary,
    flex: 1,
    marginRight: 12,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    fontVariant: ["tabular-nums"],
  },
  expandedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: "#F0FDF4",
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  expandedLabel: {
    fontSize: 13,
    color: "#10B981",
    fontWeight: "500",
    flex: 1,
  },
  expandedValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#10B981",
    fontVariant: ["tabular-nums"],
  },
  pagoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    backgroundColor: "#F0FDF4",
  },
  pagoLabel: {
    fontSize: 14,
    color: "#10B981",
    fontWeight: "500",
    flex: 1,
  },
  pagoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
    fontVariant: ["tabular-nums"],
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: "#F8FAFC",
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  totalValue: {
    fontSize: 22,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
});
