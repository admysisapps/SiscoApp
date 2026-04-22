import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { THEME } from "@/constants/theme";
import Entypo from "@expo/vector-icons/Entypo";

interface DisponibleItem {
  codigo: string;
  nombre: string;
  disp: string;
}

interface ResumenItem {
  tipo: string;
  cargos: string;
  saldo: string;
}

interface DisponibilidadFondosData {
  status: number;
  periodo: string;
  acumu: ResumenItem[];
  mensu: ResumenItem[];
  disponible: DisponibleItem[];
}

const MOCK_DATA: DisponibilidadFondosData = {
  status: 200,
  periodo: "2026-03",
  acumu: [{ tipo: "S", cargos: "70770479.61", saldo: "70770479.61" }],
  mensu: [{ tipo: "S", cargos: "19426403.46", saldo: "19426403.46" }],
  disponible: [
    { codigo: "110505", nombre: "CAJA GENERAL", disp: "0.00" },
    { codigo: "110510", nombre: "CAJA MENOR", disp: "0.00" },
    { codigo: "11100501", nombre: "BANCO 1", disp: "0.00" },
    { codigo: "112005", nombre: "BANCOS", disp: "0.00" },
    {
      codigo: "112010",
      nombre: "CORPORACIONES AHORRO Y VIVIENDA",
      disp: "0.00",
    },
  ],
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

export default function DisponibilidadFondos() {
  const { periodo, disponible, acumu, mensu } = MOCK_DATA;

  // const totalDisponible = disponible.reduce(
  //   (sum, item) => sum + parseFloat(item.disp),
  //   0
  // );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Entypo name="wallet" size={24} color={THEME.colors.primary} />
          <View>
            <Text style={styles.title}>Disponibilidad de Fondos</Text>
            <Text style={styles.periodo}>{formatPeriodo(periodo)}</Text>
          </View>
        </View>
      </View>

      {/* Lista de cuentas */}
      <View style={styles.list}>
        {disponible.map((item) => (
          <View key={item.codigo} style={styles.item}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemNombre} numberOfLines={1}>
                {item.nombre}
              </Text>
              <Text style={styles.itemCodigo}>{item.codigo}</Text>
            </View>
            <Text
              style={[
                styles.itemValor,
                {
                  color:
                    parseFloat(item.disp) > 0
                      ? "#10B981"
                      : THEME.colors.text.secondary,
                },
              ]}
            >
              {formatCOP(item.disp)}
            </Text>
          </View>
        ))}
      </View>

      {/* Resumen */}
      <View style={styles.resumen}>
        {/* <View style={styles.resumenRow}>
          <Text style={styles.resumenLabel}>Total disponible</Text>
          <Text style={[styles.resumenValor, { color: totalDisponible > 0 ? "#10B981" : THEME.colors.text.primary }]}>
            {formatCOP(totalDisponible.toString())}
          </Text>
        </View>
        <View style={styles.divider} /> */}
        {acumu[0] && (
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Cargos acumulados</Text>
            <Text style={styles.resumenValor}>
              {formatCOP(acumu[0].cargos)}
            </Text>
          </View>
        )}
        {mensu[0] && (
          <View style={styles.resumenRow}>
            <Text style={styles.resumenLabel}>Cargos del mes</Text>
            <Text style={styles.resumenValor}>
              {formatCOP(mensu[0].cargos)}
            </Text>
          </View>
        )}
      </View>
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
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  periodo: {
    fontSize: 13,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
  },
  list: {
    gap: 4,
  },
  item: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  itemInfo: {
    flex: 1,
    marginRight: 12,
  },
  itemNombre: {
    fontSize: 14,
    fontWeight: "500",
    color: THEME.colors.text.primary,
  },
  itemCodigo: {
    fontSize: 11,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  itemValor: {
    fontSize: 14,
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  resumen: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 8,
  },
  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
  },
  resumenRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resumenLabel: {
    fontSize: 13,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
  },
  resumenValor: {
    fontSize: 14,
    fontWeight: "700",
    color: THEME.colors.text.primary,
    fontVariant: ["tabular-nums"],
  },
});
