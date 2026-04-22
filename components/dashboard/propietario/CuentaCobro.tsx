import { THEME } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { DetalleCuentaModal } from "../DetalleCuentaModal";
import { useCuentaCobro } from "@/hooks/useCuentaCobro";
import { router } from "expo-router";

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const toNumber = (val: number | string): number =>
  typeof val === "number" ? val : parseFloat(val) || 0;

const calcularDescuento = (fechaDesc: string) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const [year, month, day] = fechaDesc.split("-").map(Number);
  const fechaLimite = new Date(year, month - 1, day);
  fechaLimite.setHours(0, 0, 0, 0);
  const diff = fechaLimite.getTime() - hoy.getTime();
  const diasRestantes = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return { activo: diasRestantes >= 0, diasRestantes };
};

const EstadoPagosUsuario = React.memo(function EstadoPagosUsuario() {
  const [modalVisible, setModalVisible] = useState(false);
  const { cuentaCobro, isLoading, error, refetch } = useCuentaCobro();

  const {
    descuentoActivo,
    ahorro,
    movimiento,
    subtotalConceptos,
    saldoSinDesc,
    saldoConDesc,
  } = useMemo(() => {
    if (!cuentaCobro)
      return {
        descuentoActivo: false,
        ahorro: 0,
        movimiento: null,
        subtotalConceptos: 0,
        saldoSinDesc: 0,
        saldoConDesc: 0,
      };

    const fechaDesc = cuentaCobro.param.fecha_desc;
    const { activo: descuentoActivo } = fechaDesc
      ? calcularDescuento(fechaDesc)
      : { activo: false };

    const movimiento =
      cuentaCobro.movimientos[cuentaCobro.movimientos.length - 1];

    // saldo del último ítem = total acumulado que viene de la API
    const saldoSinDesc = toNumber(
      movimiento?.detalle[movimiento.detalle.length - 1]?.saldo ?? "0"
    );
    // suma de cuotas para subtotal
    const subtotalConceptos =
      movimiento?.detalle.reduce(
        (sum, item) => sum + toNumber(item.cuota),
        0
      ) || 0;
    // descuento ya viene calculado por ítem en la API
    const ahorro =
      movimiento?.detalle.reduce(
        (sum, item) => sum + toNumber(item.descuento ?? 0),
        0
      ) || 0;
    const saldoConDesc = saldoSinDesc - ahorro;

    return {
      descuentoActivo,
      ahorro,
      movimiento,
      subtotalConceptos,
      saldoSinDesc,
      saldoConDesc,
    };
  }, [cuentaCobro]);

  if (isLoading) return <CuentaCobroSkeleton />;

  if (error) return <CuentaCobroError onRetry={() => refetch()} />;

  if (!cuentaCobro) return null;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.statusCard}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        {/* Header */}
        <View style={styles.receiptHeader}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.receiptTitle}>
                Unidad {cuentaCobro.unidad}
              </Text>
              <Text style={styles.receiptPeriod}>
                Período {movimiento?.periodo}
              </Text>
            </View>
          </View>
        </View>

        {/* Conceptos del detalle directo de la API */}
        {movimiento?.detalle && movimiento.detalle.length > 0 && (
          <View style={styles.section}>
            {movimiento.detalle.map((item, index) => (
              <View key={index} style={styles.receiptRow}>
                <Text style={styles.receiptLabel} numberOfLines={1}>
                  {item.descrip}
                </Text>
                <Text style={styles.receiptValue}>
                  {formatCurrency(toNumber(item.cuota))}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Saldo inicial (deuda anterior) */}
        {parseFloat(cuentaCobro.saldo_inicial) > 0 && (
          <View style={styles.section}>
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: "#EF4444" }]}>
                Saldo anterior
              </Text>
              <Text style={[styles.receiptValue, { color: "#EF4444" }]}>
                {formatCurrency(parseFloat(cuentaCobro.saldo_inicial))}
              </Text>
            </View>
          </View>
        )}

        {/* Descuento pronto pago */}
        {descuentoActivo && ahorro > 0 && (
          <View style={styles.discountSection}>
            <View style={styles.discountRow}>
              <View style={styles.discountInfo}>
                <Text style={styles.discountLabel}>
                  Descuento pronto pago {cuentaCobro.param.porcentaje_desc}%
                </Text>
              </View>
              <Text style={styles.discountLabel}>
                -{formatCurrency(ahorro)}
              </Text>
            </View>
            <Text style={styles.discountHint}>
              Válido hasta el{" "}
              {cuentaCobro.param.fecha_desc?.split("-").reverse().join("/")}
            </Text>
          </View>
        )}

        <View style={styles.dashedLine} />

        {/* Total */}
        {(() => {
          const total = descuentoActivo ? saldoConDesc : saldoSinDesc;
          const aFavor = total <= 0;
          return (
            <View style={styles.totalSection}>
              <Text
                style={[
                  styles.receiptTotalLabel,
                  aFavor && { color: "#10B981" },
                ]}
              >
                {aFavor ? "SALDO A FAVOR" : "TOTAL A PAGAR"}
              </Text>
              <Text
                style={[
                  styles.receiptTotalValue,
                  aFavor && { color: "#10B981" },
                ]}
              >
                {formatCurrency(Math.abs(total))}
              </Text>
            </View>
          );
        })()}
      </TouchableOpacity>

      <DetalleCuentaModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onVerEstadoCuenta={() => {
          setModalVisible(false);
          router.push("/(screens)/estadoCuenta/EstadoCuentaScreen");
        }}
        cuentaCobro={cuentaCobro}
        formatCurrency={formatCurrency}
        descuentoActivo={descuentoActivo}
        ahorro={ahorro}
        subtotalConceptos={subtotalConceptos}
        saldoSinDesc={saldoSinDesc}
        saldoConDesc={saldoConDesc}
      />
    </View>
  );
});

const CuentaCobroError = ({ onRetry }: { onRetry: () => void }) => (
  <View style={styles.container}>
    <View style={styles.statusCard}>
      {/* Header */}
      <View style={styles.receiptHeader}>
        <View style={styles.headerTop}>
          <View>
            <View style={styles.errorTitleRow}>
              <View style={styles.errorIconBadge}>
                <Ionicons
                  name="alert-circle"
                  size={16}
                  color={THEME.colors.error}
                />
              </View>
              <Text
                style={[styles.receiptTitle, { color: THEME.colors.error }]}
              >
                Sin datos
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* 3 filas placeholder */}
      {["Administración", "Servicios", "Otros conceptos"].map((label, i) => (
        <View key={i} style={[styles.receiptRow, { marginBottom: 12 }]}>
          <View style={styles.errorRowLeft}>
            <Ionicons
              name="remove-outline"
              size={14}
              color={THEME.colors.text.muted}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[styles.receiptLabel, { color: THEME.colors.text.muted }]}
            >
              {label}
            </Text>
          </View>
          <Text
            style={[styles.receiptValue, { color: THEME.colors.text.muted }]}
          >
            —
          </Text>
        </View>
      ))}

      <View style={styles.dashedLine} />

      {/* Footer con botón reintentar */}
      <View style={styles.errorFooter}>
        <Text style={styles.errorFooterText}>No se pudo obtener el total</Text>
      </View>
    </View>
  </View>
);

const CuentaCobroSkeleton = () => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const opacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.container}>
      <View style={styles.statusCard}>
        {/* Header */}
        <View style={{ marginBottom: 16 }}>
          <Animated.View
            style={[
              styles.skeletonBox,
              { width: 100, height: 18, opacity, marginBottom: 6 },
            ]}
          />
          <Animated.View
            style={[styles.skeletonBox, { width: 70, height: 13, opacity }]}
          />
        </View>
        {/* 3 conceptos */}
        {["90%", "75%", "60%"].map((width, i) => (
          <View key={i} style={[styles.receiptRow, { marginBottom: 12 }]}>
            <Animated.View
              style={[
                styles.skeletonBox,
                { flex: 1, height: 14, opacity, marginRight: 12 },
              ]}
            />
            <Animated.View
              style={[styles.skeletonBox, { width: 70, height: 14, opacity }]}
            />
          </View>
        ))}
        {/* Línea divisoria */}
        <View style={styles.dashedLine} />
        {/* Total */}
        <View style={styles.totalSection}>
          <Animated.View
            style={[styles.skeletonBox, { width: 110, height: 15, opacity }]}
          />
          <Animated.View
            style={[styles.skeletonBox, { width: 130, height: 24, opacity }]}
          />
        </View>
      </View>
    </View>
  );
};

export default EstadoPagosUsuario;

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    paddingHorizontal: 1,
  },
  statusCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  receiptHeader: {
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.colors.text.primary,
  },
  receiptPeriod: {
    fontSize: 13,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  skeletonBox: {
    backgroundColor: THEME.colors.border,
    borderRadius: 4,
  },
  section: {
    marginBottom: 16,
  },

  dashedLine: {
    height: 1,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    borderStyle: "dashed",
    marginVertical: 16,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  receiptLabel: {
    fontSize: 14,
    color: THEME.colors.text.primary,
    flex: 1,
    marginRight: 12,
  },
  receiptValue: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    fontVariant: ["tabular-nums"],
  },
  discountSection: {
    backgroundColor: "#ECFDF5",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  discountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  discountInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  discountLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.success,
  },
  discountHint: {
    fontSize: 11,
    color: "#059669",
    marginTop: 2,
  },
  totalSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  receiptTotalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.colors.text.secondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  receiptTotalValue: {
    fontSize: 24,
    fontWeight: "700",
    color: THEME.colors.text.primary,
    fontVariant: ["tabular-nums"],
  },
  errorTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  errorIconBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  errorRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  errorFooter: {
    flexDirection: "column",
    alignItems: "flex-start",
    gap: 12,
  },
  errorFooterText: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.colors.text.muted,
    letterSpacing: 0.5,
  },

  retryText: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.colors.error,
  },
});
