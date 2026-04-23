import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";

interface ResumenItem {
  tipo: string;
  cargos: string;
  saldo: string;
}

interface IndicadoresData {
  status: number;
  periodo: string;
  acumu: ResumenItem[];
  mensu: ResumenItem[];
}

const MOCK_FACTURACION: IndicadoresData = {
  status: 200,
  periodo: "2026-04",
  acumu: [{ tipo: "S", cargos: "139750579.61", saldo: "139750579.61" }],
  mensu: [{ tipo: "S", cargos: "68980100.00", saldo: "68980100.00" }],
};

const MOCK_CUENTAS_PAGAR: IndicadoresData = {
  status: 200,
  periodo: "2026-04",
  acumu: [{ tipo: "S", cargos: "0.00", saldo: "0.00" }],
  mensu: [{ tipo: "S", cargos: "0.00", saldo: "0.00" }],
};

const formatCOP = (value: string) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(parseFloat(value));

const formatPeriodo = (periodo: string) => {
  const [year, month] = periodo.split("-");
  const meses: Record<string, string> = {
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
  return `${meses[month]} ${year}`;
};

const calcPorcentajePago = (cargos: string, saldo: string): string => {
  const c = parseFloat(cargos);
  const s = parseFloat(saldo);
  if (c === 0) return "0.0%";
  return `${(((c - s) / c) * 100).toFixed(1)}%`;
};

interface FilaIndicadorProps {
  cargos: string;
  saldo: string;
  destacado?: boolean;
}

const FilaIndicador = React.memo(
  ({ cargos, saldo, destacado }: FilaIndicadorProps) => (
    <View style={styles.filaGroup}>
      <View style={styles.fila}>
        <Text
          style={[styles.filaLabel, destacado && styles.filaLabelDestacado]}
        >
          Total Facturas:
        </Text>
        <Text
          style={[styles.filaValor, destacado && styles.filaValorDestacado]}
        >
          {formatCOP(cargos)}
        </Text>
      </View>
      <View style={styles.fila}>
        <Text
          style={[styles.filaLabel, destacado && styles.filaLabelDestacado]}
        >
          Total Saldo:
        </Text>
        <Text
          style={[
            styles.filaValor,
            destacado && styles.filaValorDestacado,
            parseFloat(saldo) > 0 && styles.valorAlerta,
          ]}
        >
          {formatCOP(saldo)}
        </Text>
      </View>
      <View style={styles.fila}>
        <Text
          style={[styles.filaLabel, destacado && styles.filaLabelDestacado]}
        >
          % Pagos:
        </Text>
        <Text
          style={[
            styles.filaValor,
            destacado && styles.filaValorDestacado,
            styles.porcentaje,
          ]}
        >
          {calcPorcentajePago(cargos, saldo)}
        </Text>
      </View>
    </View>
  )
);
FilaIndicador.displayName = "FilaIndicador";

interface TarjetaProps {
  titulo: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  data: IndicadoresData;
}

const TarjetaIndicador = ({ titulo, icon, iconColor, data }: TarjetaProps) => {
  const [acumuladoVisible, setAcumuladoVisible] = useState(false);

  return (
    <View style={styles.tarjeta}>
      <View style={styles.tarjetaHeader}>
        <View
          style={[styles.iconContainer, { backgroundColor: `${iconColor}18` }]}
        >
          <Ionicons name={icon} size={20} color={iconColor} />
        </View>
        <Text style={styles.tarjetaTitulo}>{titulo}</Text>
      </View>

      {/* Mes actual — siempre visible */}
      <View style={styles.seccion}>
        <Text style={styles.seccionLabel}>Mes Actual</Text>
        {data.mensu[0] && (
          <FilaIndicador
            cargos={data.mensu[0].cargos}
            saldo={data.mensu[0].saldo}
            destacado
          />
        )}
      </View>

      {/* Acumulado — colapsable */}
      <TouchableOpacity
        style={[styles.seccion, styles.seccionBorder]}
        onPress={() => setAcumuladoVisible((v) => !v)}
        activeOpacity={0.7}
      >
        <View style={styles.acumuladoHeader}>
          <Text style={styles.seccionLabel}>Acumulado</Text>
          <Ionicons
            name={acumuladoVisible ? "chevron-up" : "chevron-down"}
            size={14}
            color={THEME.colors.text.muted}
          />
        </View>
        {acumuladoVisible && data.acumu[0] && (
          <FilaIndicador
            cargos={data.acumu[0].cargos}
            saldo={data.acumu[0].saldo}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

export default function IndicadoresCopropiedad() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>Indicadores de la Copropiedad</Text>
        <Text style={styles.periodo}>
          {formatPeriodo(MOCK_FACTURACION.periodo)}
        </Text>
      </View>

      <TarjetaIndicador
        titulo="Facturación"
        icon="trending-up-outline"
        iconColor={THEME.colors.primary}
        data={MOCK_FACTURACION}
      />

      <TarjetaIndicador
        titulo="Cuentas por Pagar"
        icon="trending-down-outline"
        iconColor="#F59E0B"
        data={MOCK_CUENTAS_PAGAR}
      />
    </View>
  );
}

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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  titulo: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.colors.text.primary,
  },
  periodo: {
    fontSize: 12,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
  },
  tarjeta: {
    backgroundColor: "#F8FAFC",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  tarjetaHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  tarjetaTitulo: {
    fontSize: 15,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  seccion: {
    paddingTop: 8,
  },
  seccionBorder: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    marginTop: 8,
  },
  acumuladoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seccionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: THEME.colors.text.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  filaGroup: {
    gap: 4,
  },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 3,
  },
  filaLabel: {
    fontSize: 13,
    color: THEME.colors.text.secondary,
  },
  filaLabelDestacado: {
    fontSize: 14,
    color: "#374151",
  },
  filaValor: {
    fontSize: 13,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    fontVariant: ["tabular-nums"],
  },
  filaValorDestacado: {
    fontSize: 14,
    color: "#111827",
  },
  valorAlerta: {
    color: "#EF4444",
  },
  porcentaje: {
    color: THEME.colors.success,
  },
});
