import { THEME } from "@/constants/theme";
import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
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
  const { cuentaCobro, isLoading, error } = useCuentaCobro();

  const {
    descuentoActivo,
    ahorro,
    movimiento,
    subtotalConceptos,
    saldoSinDesc,
    saldoConDesc,
    serviciosBasicos,
    extras,
  } = useMemo(() => {
    if (!cuentaCobro)
      return {
        descuentoActivo: false,
        ahorro: 0,
        movimiento: null,
        subtotalConceptos: 0,
        diasRestantes: 0,
        saldoSinDesc: 0,
        saldoConDesc: 0,
        serviciosBasicos: [],
        extras: [],
      };

    const fechaDesc = cuentaCobro.param.fecha_desc;
    const { activo: descuentoActivo, diasRestantes } = fechaDesc
      ? calcularDescuento(fechaDesc)
      : { activo: false, diasRestantes: 0 };

    // Último movimiento = deuda más reciente
    const movimiento =
      cuentaCobro.movimientos[cuentaCobro.movimientos.length - 1];

    // El saldo total ya viene calculado en el último movimiento
    const ultimoSaldo = parseFloat(
      movimiento?.detalle[movimiento.detalle.length - 1]?.saldo ?? "0"
    );
    const subtotalConceptos =
      movimiento?.detalle.reduce(
        (sum, item) => sum + toNumber(item.cuota),
        0
      ) || 0;
    const totalDescuento =
      movimiento?.detalle.reduce(
        (sum, item) => sum + toNumber(item.descuento ?? 0),
        0
      ) || 0;
    const saldoSinDesc = ultimoSaldo;
    const saldoConDesc = saldoSinDesc - totalDescuento;
    const ahorro = totalDescuento;

    const serviciosBasicos =
      movimiento?.detalle.filter(
        (item) =>
          !item.descrip.toLowerCase().includes("multa") &&
          !item.descrip.toLowerCase().includes("fondo")
      ) || [];

    const extras =
      movimiento?.detalle.filter(
        (item) =>
          item.descrip.toLowerCase().includes("multa") ||
          item.descrip.toLowerCase().includes("fondo")
      ) || [];

    return {
      descuentoActivo,
      ahorro,
      movimiento,
      subtotalConceptos,
      diasRestantes,
      saldoSinDesc,
      saldoConDesc,
      serviciosBasicos,
      extras,
    };
  }, [cuentaCobro]);

  if (isLoading)
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.statusCard,
            { alignItems: "center", justifyContent: "center", minHeight: 120 },
          ]}
        >
          <Text style={{ color: THEME.colors.text.secondary }}>
            Cargando cuenta de cobro...
          </Text>
        </View>
      </View>
    );

  if (error)
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.statusCard,
            { alignItems: "center", justifyContent: "center", minHeight: 120 },
          ]}
        >
          <Text style={{ color: "#EF4444" }}>
            Error al cargar la cuenta de cobro
          </Text>
        </View>
      </View>
    );

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

        {/* Servicios básicos */}
        {serviciosBasicos.length > 0 && (
          <View style={styles.section}>
            {serviciosBasicos.map((item, index) => (
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

        {/* Extras y multas */}
        {extras.length > 0 && (
          <View style={styles.section}>
            {extras.map((item, index) => (
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

        {/* Descuento */}
        {descuentoActivo && (
          <View style={styles.discountSection}>
            <View style={styles.discountRow}>
              <View style={styles.discountInfo}>
                <Text style={styles.discountLabel}>
                  Descuento {cuentaCobro.param.porcentaje_desc}%
                </Text>
              </View>
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
});
