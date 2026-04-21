import { THEME } from "@/constants/theme";
import { Movimiento } from "@/types/cuentaCobro";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MovimientoModal } from "./MovimientoModal";

interface MovimientosListProps {
  movimientos: Movimiento[];
  anioAnteriorCargado?: boolean;
  isLoadingAnioAnterior?: boolean;
  onCargarAnioAnterior?: () => void;
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

const getSaldoColor = (saldo: number) =>
  saldo < 0 ? "#10B981" : saldo > 0 ? "#EF4444" : THEME.colors.text.primary;

interface MovimientoCardProps {
  mov: Movimiento;
  onPress: () => void;
}

function MovimientoCard({ mov, onPress }: MovimientoCardProps) {
  const saldoFinal = parseFloat(
    mov.detalle[mov.detalle.length - 1]?.saldo ?? "0"
  );
  const [mes, anio] = mov.periodo.split("-");
  const conceptos = mov.detalle.filter((d) => toNumber(d.cuota) > 0);
  const totalPagado = mov.detalle.reduce(
    (s, d) => s + toNumber(d["pagos/ajustes"]),
    0
  );
  const saldoColor = getSaldoColor(saldoFinal);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>
            {MESES_FULL[mes]} {anio}
          </Text>
          <Text style={styles.cardSubtitle}>Período {mov.periodo}</Text>
        </View>
      </View>

      {/* Conceptos */}
      <View style={styles.section}>
        {conceptos.map((item, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.rowLabel} numberOfLines={1}>
              {item.descrip}
            </Text>
            <Text style={styles.rowValue}>
              {formatCOP(toNumber(item.cuota))}
            </Text>
          </View>
        ))}
      </View>

      {/* Pagos */}
      {totalPagado > 0 && (
        <View style={styles.pagoSection}>
          <View style={styles.row}>
            <Text style={styles.pagoLabel}>Pagos / Ajustes</Text>
            <Text style={styles.pagoValue}>-{formatCOP(totalPagado)}</Text>
          </View>
        </View>
      )}

      <View style={styles.dashedLine} />

      {/* Total */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>
          {saldoFinal < 0 ? "SALDO A FAVOR" : "SALDO DEL PERÍODO"}
        </Text>
        <Text style={[styles.totalValue, { color: saldoColor }]}>
          {formatCOP(Math.abs(saldoFinal))}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export const MovimientosList = React.memo(function MovimientosList({
  movimientos,
  anioAnteriorCargado = false,
  isLoadingAnioAnterior = false,
  onCargarAnioAnterior,
}: MovimientosListProps) {
  const prevYear = new Date().getFullYear() - 1;
  const [selectedMov, setSelectedMov] = useState<Movimiento | null>(null);

  useEffect(() => {
    if (__DEV__) {
      console.log("[MovimientosList] Recibidos:", movimientos.length, "movimientos");
      movimientos.forEach((m) => {
        const saldoFinal = parseFloat(m.detalle[m.detalle.length - 1]?.saldo ?? "0");
        const totalCuotas = m.detalle.reduce((s, d) => s + toNumber(d.cuota), 0);
        const totalPagado = m.detalle.reduce((s, d) => s + toNumber(d["pagos/ajustes"]), 0);
        console.log(`  → [${m.periodo}] cuotas: $${totalCuotas} | pagado: $${totalPagado} | saldo final: $${saldoFinal} | mostrando: ${m.detalle.filter(d => toNumber(d.cuota) > 0).length} conceptos`);
        if (totalCuotas === 0) {
          console.log(`    [RAW ${m.periodo}]:`, JSON.stringify(m.detalle));
        }
      });
    }
  }, [movimientos]);

  useEffect(() => {
    if (anioAnteriorCargado) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
  }, [anioAnteriorCargado]);

  return (
    <View style={styles.container}>
      {movimientos.map((mov, i) => (
        <MovimientoCard
          key={`${mov.periodo}-${i}`}
          mov={mov}
          onPress={() => setSelectedMov(mov)}
        />
      ))}

      {!anioAnteriorCargado && (
        <TouchableOpacity
          style={styles.loadMoreBtn}
          onPress={onCargarAnioAnterior}
          disabled={isLoadingAnioAnterior}
          activeOpacity={0.7}
        >
          {isLoadingAnioAnterior ? (
            <ActivityIndicator
              size="small"
              color={THEME.colors.text.secondary}
            />
          ) : (
            <Text style={styles.loadMoreText}>Ver historial {prevYear}</Text>
          )}
        </TouchableOpacity>
      )}

      {selectedMov && (
        <MovimientoModal
          visible={!!selectedMov}
          movimiento={selectedMov}
          onClose={() => setSelectedMov(null)}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: THEME.spacing.md,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.colors.text.primary,
  },
  cardSubtitle: {
    fontSize: 13,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  section: {
    marginBottom: 12,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
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
  pagoSection: {
    backgroundColor: "#F0FDF4",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 4,
  },
  pagoLabel: {
    fontSize: 13,
    color: "#10B981",
    fontWeight: "500",
    flex: 1,
  },
  pagoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#10B981",
    fontVariant: ["tabular-nums"],
  },
  dashedLine: {
    height: 1,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    borderStyle: "dashed",
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: THEME.colors.text.secondary,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  loadMoreBtn: {
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    minHeight: 48,
  },
  loadMoreText: {
    fontSize: THEME.fontSize.sm,
    fontWeight: "600",
    color: THEME.colors.text.secondary,
  },
});
