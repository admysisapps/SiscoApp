import { THEME } from "@/constants/theme";
import { CuentaCobro } from "@/types/cuentaCobro";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { DetalleCuentaModal } from "../DetalleCuentaModal";

// Mock data - Ejemplo con fechas actuales (Enero 2026)
const mockCuentaCobro: CuentaCobro = {
  unidad: 102,
  tipo: "Cuenta de Cobro",
  param: {
    fecha_desc: "2026-01-19",
    porcentaje_desc: 10.0, //  total del El descuento viene en anticipos por concepto
  },
  movimientos: [
    {
      periodo: "01-2026",
      saldo_ini_deuda: 450000.0, // Deuda de meses anteriores (ej. Admón Dic + Mora)
      saldo_ini_ant: -50000.0, // Un pequeño saldo
      detalle: [
        {
          descrip: "CUOTA DE ADMINISTRACION",
          cuota: 280000.0,
          anticipos: -30000.0,
        },
        {
          descrip: "PARQUEADERO CARRO (P-45)",
          cuota: 110000.0,
          anticipos: 0,
        },
        {
          descrip: "SERVICIO DE CASILLERO",
          cuota: 15000.0,
          anticipos: 0,
        },
        {
          descrip: "MULTA CONVIVENCIA (RUIDO)",
          cuota: 140000.0,
          anticipos: 0,
        },
        {
          descrip: "FONDO DE IMPREVISTOS",
          cuota: 3000.0,
          anticipos: 0,
        },
      ],
    },
  ],
  // Cálculo sugerido:
  // Subtotal mes: 600,500
  // Deuda neta anterior: 400,000 (450k - 50k)
  // Total sin descuento: 1,000,500
  // Descuento (10% sobre 280,000): 28,000
  saldo_sin_desc: 1000500,
  saldo_con_desc: 972500,
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Función para verificar si el descuento está disponible
const isDescuentoDisponible = (fechaDesc: string) => {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [year, month, day] = fechaDesc.split("-").map(Number);
  const fechaLimite = new Date(year, month - 1, day);
  fechaLimite.setHours(0, 0, 0, 0);

  return hoy <= fechaLimite;
};

const EstadoPagosUsuario = React.memo(function EstadoPagosUsuario() {
  const [modalVisible, setModalVisible] = useState(false);
  const [historialExpanded, setHistorialExpanded] = useState(false);

  const descuentoActivo = isDescuentoDisponible(
    mockCuentaCobro.param.fecha_desc
  );
  const ahorro =
    mockCuentaCobro.saldo_sin_desc - mockCuentaCobro.saldo_con_desc;
  const movimiento = mockCuentaCobro.movimientos[0];
  const subtotalConceptos =
    movimiento?.detalle.reduce((sum, item) => sum + item.cuota, 0) || 0;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.statusCard}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        {/* Header estilo recibo */}
        <View style={styles.receiptHeader}>
          <Text style={styles.receiptTitle}>CUENTA DE COBRO</Text>
          <Text style={styles.receiptSubtitle}>
            Unidad {mockCuentaCobro.unidad}
          </Text>
          <Text style={styles.receiptPeriod}>
            Período: {movimiento?.periodo}
          </Text>
        </View>

        <View style={styles.dashedLine} />

        {/* Detalles en formato recibo */}
        <View style={styles.receiptDetails}>
          {movimiento?.detalle.map((item, index) => (
            <View key={index} style={styles.receiptRow}>
              <Text style={styles.receiptLabel}>{item.descrip}</Text>
              <Text style={styles.receiptValue}>
                {formatCurrency(item.cuota)}
              </Text>
            </View>
          ))}

          {movimiento?.saldo_ini_deuda > 0 && (
            <View style={styles.receiptRow}>
              <Text style={[styles.receiptLabel, { color: "#EF4444" }]}>
                Deuda anterior
              </Text>
              <Text style={[styles.receiptValue, { color: "#EF4444" }]}>
                {formatCurrency(movimiento.saldo_ini_deuda)}
              </Text>
            </View>
          )}

          {movimiento?.saldo_ini_ant < 0 && (
            <View style={styles.receiptRow}>
              <Text
                style={[styles.receiptLabel, { color: THEME.colors.success }]}
              >
                Saldo a favor
              </Text>
              <Text
                style={[styles.receiptValue, { color: THEME.colors.success }]}
              >
                -{formatCurrency(Math.abs(movimiento.saldo_ini_ant))}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.dashedLine} />

        {/* Descuento si aplica */}
        {descuentoActivo && (
          <>
            <View style={styles.receiptRow}>
              <Text
                style={[styles.receiptLabel, { color: THEME.colors.success }]}
              >
                Descuento {mockCuentaCobro.param.porcentaje_desc}%
              </Text>
              <Text
                style={[styles.receiptValue, { color: THEME.colors.success }]}
              >
                -{formatCurrency(ahorro)}
              </Text>
            </View>
            <View style={styles.dashedLine} />
          </>
        )}

        {/* Total */}
        <View style={styles.receiptRow}>
          <Text style={styles.receiptTotalLabel}>TOTAL A PAGAR</Text>
          <Text style={styles.receiptTotalValue}>
            {formatCurrency(
              descuentoActivo
                ? mockCuentaCobro.saldo_con_desc
                : mockCuentaCobro.saldo_sin_desc
            )}
          </Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.historySection}
        onPress={() => setHistorialExpanded(!historialExpanded)}
        activeOpacity={0.7}
      >
        <View style={styles.historyHeader}>
          <Text style={styles.historyTitle}>Estado De Cuenta </Text>
          <Ionicons
            name={historialExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={THEME.colors.text.secondary}
          />
        </View>
      </TouchableOpacity>

      {historialExpanded && (
        <View style={styles.historyList}>
          {[
            { periodo: "12-2025", amount: 450000, status: "paid" },
            { periodo: "11-2025", amount: 450000, status: "paid" },
            { periodo: "10-2025", amount: 450000, status: "paid" },
            { periodo: "09-2025", amount: 450000, status: "paid" },
            { periodo: "08-2025", amount: 450000, status: "paid" },
          ].map((payment, index) => (
            <View key={index} style={styles.historyItem}>
              <View style={styles.historyInfo}>
                <Text style={styles.historyDate}>{payment.periodo}</Text>
                <Text style={styles.historyAmount}>
                  {formatCurrency(payment.amount)}
                </Text>
              </View>
              <View style={styles.historyStatus}>
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              </View>
            </View>
          ))}
        </View>
      )}

      <DetalleCuentaModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        cuentaCobro={mockCuentaCobro}
        formatCurrency={formatCurrency}
        descuentoActivo={descuentoActivo}
        ahorro={ahorro}
        subtotalConceptos={subtotalConceptos}
      />
    </View>
  );
});

export default EstadoPagosUsuario;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusCard: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#9CA3AF",
    borderStyle: "dashed",
  },
  receiptHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  receiptTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.colors.text.primary,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  receiptSubtitle: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    marginTop: 4,
  },
  receiptPeriod: {
    fontSize: 12,
    color: THEME.colors.text.muted,
    marginTop: 2,
  },
  dashedLine: {
    height: 1,
    borderTopWidth: 1,
    borderTopColor: "#9CA3AF",
    borderStyle: "dashed",
    marginVertical: 12,
  },
  receiptDetails: {
    gap: 8,
  },
  receiptRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  receiptLabel: {
    fontSize: 13,
    color: THEME.colors.text.primary,
    flex: 1,
  },
  receiptValue: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    fontVariant: ["tabular-nums"],
  },
  receiptTotalLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME.colors.text.primary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  receiptTotalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.colors.text.primary,
    fontVariant: ["tabular-nums"],
  },
  historySection: {
    marginTop: 8,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  historyList: {
    gap: 8,
    marginTop: 12,
  },
  historyItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F8FAFC",
    borderRadius: 8,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: 13,
    color: THEME.colors.text.secondary,
    marginBottom: 4,
  },
  historyAmount: {
    fontSize: 15,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  historyStatus: {
    marginLeft: 12,
  },
});
