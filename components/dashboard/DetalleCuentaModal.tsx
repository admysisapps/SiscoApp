import { THEME } from "@/constants/theme";
import { CuentaCobro } from "@/types/cuentaCobro";
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
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { SafeAreaView } from "react-native-safe-area-context";

interface DetalleCuentaModalProps {
  visible: boolean;
  onClose: () => void;
  onVerEstadoCuenta: () => void;
  cuentaCobro: CuentaCobro;
  formatCurrency: (amount: number) => string;
  descuentoActivo: boolean;
  ahorro: number;
  subtotalConceptos: number;
  saldoSinDesc: number;
  saldoConDesc: number;
}

const toNumber = (val: number | string): number =>
  typeof val === "number" ? val : parseFloat(val) || 0;

export const DetalleCuentaModal: React.FC<DetalleCuentaModalProps> = ({
  visible,
  onClose,
  onVerEstadoCuenta,
  cuentaCobro,
  formatCurrency,
  descuentoActivo,
  ahorro,
  subtotalConceptos,
  saldoSinDesc,
  saldoConDesc,
}) => {
  const movimiento = cuentaCobro.movimientos[0];
  const translateY = useRef(new Animated.Value(600)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const saldoInicial = parseFloat(cuentaCobro.saldo_inicial);
  const saldoInicialAFavor = saldoInicial < 0;
  const total = descuentoActivo ? saldoConDesc : saldoSinDesc;
  const totalAFavor = total <= 0;

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
    ]).start(() => {
      onClose();
    });
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 5;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 50 || gestureState.vy > 0.5) {
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
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.modalOverlay}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity
            style={styles.backdropTouch}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>
        <Animated.View
          style={[styles.modalContent, { transform: [{ translateY }] }]}
        >
          <View {...panResponder.panHandlers}>
            <View style={styles.handleContainer}>
              <View style={styles.modalHandle} />
            </View>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detalle Completo</Text>
            </View>
          </View>

          <ScrollView contentContainerStyle={styles.modalScroll}>
            {/* Encabezado */}
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>CUENTA DE COBRO</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellText}>
                  Unidad {cuentaCobro.unidad}
                </Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellText}>{movimiento?.periodo}</Text>
              </View>
            </View>

            {/* Saldo inicial */}
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>SALDO ANTERIOR</Text>
              </View>
              <View style={styles.tableRow}>
                <Text
                  style={[
                    styles.tableCellAmount,
                    {
                      color: saldoInicialAFavor
                        ? "#10B981"
                        : saldoInicial === 0
                          ? THEME.colors.text.primary
                          : "#EF4444",
                    },
                  ]}
                >
                  {formatCurrency(Math.abs(saldoInicial))}
                </Text>
              </View>
            </View>

            {/* Conceptos */}
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={styles.tableCellLabel}>CONCEPTO</Text>
                <Text style={styles.tableCellLabel}>VALOR</Text>
              </View>
              {movimiento?.detalle.map((item, index) => {
                const descuento = toNumber(item.descuento ?? 0);
                const saldo = parseFloat(item.saldo);
                const expandido = expandedIndex === index;
                return (
                  <View key={index}>
                    <TouchableOpacity
                      style={styles.tableRow}
                      onPress={() => setExpandedIndex(expandido ? null : index)}
                      activeOpacity={0.6}
                    >
                      <Text style={[styles.tableCellText, { flex: 1 }]}>
                        {item.descrip}
                      </Text>
                      <Text style={styles.tableCellAmount}>
                        {formatCurrency(toNumber(item.cuota))}
                      </Text>
                    </TouchableOpacity>
                    {expandido && (
                      <View style={styles.detalleExpandido}>
                        {descuento > 0 && (
                          <View style={styles.detalleRow}>
                            <Text style={styles.detalleLabelVerde}>
                              Descuento pronto pago (
                              {cuentaCobro.param.porcentaje_desc}%)
                            </Text>
                            <Text style={styles.detalleValorVerde}>
                              -{formatCurrency(descuento)}
                            </Text>
                          </View>
                        )}
                        <View style={styles.detalleRow}>
                          <Text style={styles.detalleLabel}>
                            {saldo <= 0 ? "Saldo a favor" : "Saldo pendiente"}
                          </Text>
                          <Text
                            style={[
                              styles.detalleValor,
                              { color: saldo <= 0 ? "#10B981" : "#EF4444" },
                            ]}
                          >
                            {formatCurrency(Math.abs(saldo))}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
              <View style={styles.tableRowTotal}>
                <Text style={styles.tableCellLabelTotal}>SUBTOTAL</Text>
                <Text style={styles.tableCellAmountTotal}>
                  {formatCurrency(subtotalConceptos)}
                </Text>
              </View>
            </View>

            {/* Descuento */}
            {descuentoActivo && (
              <View style={styles.table}>
                <View style={styles.tableRow}>
                  <Text style={[styles.tableCellLabel, { color: "#10B981" }]}>
                    DESCUENTO PRONTO PAGO
                  </Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableCellText}>
                    Porcentaje: {cuentaCobro.param.porcentaje_desc}%
                  </Text>
                  <Text style={[styles.tableCellAmount, { color: "#10B981" }]}>
                    -{formatCurrency(ahorro)}
                  </Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableCellText}>Válido hasta</Text>
                  <Text style={[styles.tableCellAmount, { fontSize: 12 }]}>
                    {new Date(cuentaCobro.param.fecha_desc!).toLocaleDateString(
                      "es-CO"
                    )}
                  </Text>
                </View>
              </View>
            )}

            {/* Total */}
            <View style={styles.table}>
              {descuentoActivo && saldoSinDesc > 0 && (
                <View style={styles.tableRow}>
                  <Text
                    style={[
                      styles.tableCellText,
                      { textDecorationLine: "line-through" },
                    ]}
                  >
                    Total sin descuento
                  </Text>
                  <Text
                    style={[
                      styles.tableCellAmount,
                      {
                        textDecorationLine: "line-through",
                        color: THEME.colors.text.secondary,
                      },
                    ]}
                  >
                    {formatCurrency(saldoSinDesc)}
                  </Text>
                </View>
              )}
              <View
                style={[
                  styles.tableRowTotal,
                  totalAFavor && { backgroundColor: "#ECFDF5" },
                ]}
              >
                <Text
                  style={[
                    styles.tableCellLabelTotal,
                    totalAFavor && { color: "#10B981" },
                  ]}
                >
                  {totalAFavor ? "SALDO A FAVOR" : "TOTAL A PAGAR"}
                </Text>
                <Text
                  style={[
                    styles.tableCellAmountTotal,
                    totalAFavor && { color: "#10B981" },
                  ]}
                >
                  {formatCurrency(Math.abs(total))}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.tableRowCta}
                onPress={onVerEstadoCuenta}
                activeOpacity={0.6}
              >
                <Text style={styles.tableCellCta}>Ver estado de cuenta</Text>
                <FontAwesome6
                  name="money-bill-transfer"
                  size={18}
                  color="black"
                />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
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
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  handleContainer: {
    paddingVertical: 8,
    alignItems: "center",
  },
  modalHandle: {
    width: 36,
    height: 5,
    backgroundColor: THEME.colors.border,
    borderRadius: 3,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    padding: 16,
    paddingBottom: 32,
  },
  table: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    marginBottom: 16,
    borderRadius: 8,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  tableRowTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#F8FAFC",
  },
  tableCellLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableCellLabelTotal: {
    fontSize: 13,
    fontWeight: "700",
    color: THEME.colors.text.primary,
  },
  tableCellText: {
    fontSize: 14,
    color: THEME.colors.text.primary,
    flex: 1,
  },
  tableCellAmount: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    textAlign: "right",
  },
  tableCellAmountTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME.colors.text.primary,
    textAlign: "right",
  },
  detalleExpandido: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
    gap: 6,
  },
  detalleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  detalleLabel: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    flex: 1,
  },
  detalleValor: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  detalleLabelVerde: {
    fontSize: 14,
    color: "#10B981",
    flex: 1,
  },
  detalleValorVerde: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10B981",
  },
  tableRowCta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  tableCellCta: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    flex: 1,
  },
});
