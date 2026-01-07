import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import React, { useState } from "react";

const mockBalanceGeneral = {
  fecha: "11/06/25 - 15:29:07",
  mes: "Noviembre",
  año: 2025,
  activo: {
    disponible: {
      caja: {
        total: 500000,
        detalle: [{ concepto: "Caja Menor", valor: 500000 }],
      },
      bancos: {
        total: 10524453.01,
        detalle: [
          { concepto: "Banco Colpatria Cta Cte 12693", valor: 10524453.01 },
        ],
      },
      cuentasAhorro: {
        total: 25312748.32,
        detalle: [
          { concepto: "Banco Colpatria Cta AH", valor: 1678502.11 },
          { concepto: "Banco Colpatria Fdo Imprevistos", valor: 23634246.21 },
        ],
      },
      total: 36337201.33,
    },
    deudores: {
      clientes: {
        total: 276756480.9,
        detalle: [
          { concepto: "Administración", valor: 136172681 },
          { concepto: "Intereses de Mora", valor: 101529850 },
          { concepto: "Parqueadero Comunal", valor: 261900 },
          { concepto: "Extraordinaria", valor: 16090118 },
          { concepto: "Depósito", valor: 1455000 },
          { concepto: "Bicicletero", valor: 156600 },
          { concepto: "Retroactivo Administración", valor: 1661832 },
          { concepto: "Multa Asamblea", valor: 1190200 },
          { concepto: "Cobros Jurídicos", valor: 1809234 },
          { concepto: "Parqueadero Moto", valor: 47300 },
          { concepto: "Intereses Cuota Extraordinaria", valor: 16049500 },
          { concepto: "Revisión de Coeficientes", valor: 144712 },
          { concepto: "Parq Visitantes", valor: 271999 },
          { concepto: "Extraordinaria Ascensores", valor: 2400000 },
          { concepto: "Certificado de Tradición y Libertad", valor: 87600 },
          { concepto: "Instalación Registro", valor: 65000 },
          { concepto: "Consignaciones por Identificar", valor: -2637045.1 },
        ],
      },
      anticipos: {
        total: 34965650,
        detalle: [{ concepto: "A Contratistas", valor: 34965650 }],
      },
      provisiones: {
        total: -87873750,
        detalle: [
          { concepto: "Provisión Intereses de Mora", valor: -87873750 },
        ],
      },
      total: 223848380.9,
    },
    propiedadPlantaEquipo: {
      maquinaria: {
        total: 30051777,
        detalle: [{ concepto: "Otros", valor: 30051777 }],
      },
      muebles: {
        total: 12783627,
        detalle: [{ concepto: "Muebles y Enseres", valor: 12783627 }],
      },
      equipoComputo: {
        total: 6357550,
        detalle: [
          { concepto: "Equipo de Computación", valor: 4927550 },
          { concepto: "Cámaras de Televisión", valor: 1430000 },
        ],
      },
      depreciacion: {
        total: -49192954,
        detalle: [
          { concepto: "Depreciación Maquinaria y Equipo", valor: -30051777 },
          { concepto: "Depreciación Equipo de Oficina", valor: -12783627 },
          { concepto: "Depreciación Equipo de Computación", valor: -6357550 },
        ],
      },
      total: 0,
    },
    diferidos: {
      seguros: {
        total: 12100657.46,
        detalle: [{ concepto: "Seguros", valor: 12100657.46 }],
      },
      total: 12100657.46,
    },
    total: 272286239.69,
  },
  pasivo: {
    cuentasPorPagar: {
      costos: {
        total: -500000,
        detalle: [{ concepto: "Otras Cuentas por Pagar", valor: -500000 }],
      },
      retencionFuente: {
        total: 394324,
        detalle: [
          { concepto: "Rentas de Trabajo", valor: 22888 },
          { concepto: "Sobre Servicios Generales 6%", valor: 63900 },
          { concepto: "Servicios Tarifa 2%", valor: 51673 },
          { concepto: "Servicios Generales 4%", valor: 255863 },
        ],
      },
      total: -105676,
    },
    impuestos: {
      iva: {
        total: 40075,
        detalle: [{ concepto: "I.V.A. Recaudado", valor: 40075 }],
      },
      total: 40075,
    },
    diferidos: {
      anticipoAdmin: {
        total: 407700,
        detalle: [{ concepto: "Anticipo de Administración", valor: 407700 }],
      },
      total: 407700,
    },
    otrosPasivos: {
      fondosEspecificos: {
        total: 47789930,
        detalle: [{ concepto: "Cuota Extraordinaria", valor: 47789930 }],
      },
      ingresosParaTerceros: {
        total: 7064850,
        detalle: [
          { concepto: "Valores Recibidos para Terceros", valor: 55300 },
          { concepto: "Empresa de Vigilancia", valor: 4360100 },
          { concepto: "Revisión de Coeficientes", valor: 700350 },
          { concepto: "Compra de Certificados", valor: 1949100 },
        ],
      },
      total: 54854780,
    },
    total: 55196879,
  },
  patrimonio: {
    reservas: 23061610.78,
    utilidadEjercicio: 101218018.41,
    utilidadesAcumuladas: 92809731.5,
    total: 217089360.69,
  },
};

export default function Index() {
  const [expandedSections, setExpandedSections] = useState<{
    [key: string]: boolean;
  }>({});

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 2,
    }).format(value);

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderDetailRow = (item: any, key: string, label: string) => {
    const isExpanded = expandedSections[key];
    const hasDetail = item.detalle && item.detalle.length > 0;

    return (
      <View>
        <TouchableOpacity
          style={styles.row}
          onPress={() => hasDetail && toggleSection(key)}
          disabled={!hasDetail}
        >
          <Text style={styles.label}>
            {hasDetail && (isExpanded ? "▼ " : "▶ ")}
            {label}
          </Text>
          <Text style={[styles.value, item.total < 0 && styles.negative]}>
            {formatCurrency(item.total)}
          </Text>
        </TouchableOpacity>
        {isExpanded &&
          hasDetail &&
          item.detalle.map((det: any, idx: number) => (
            <View key={idx} style={styles.detailRow}>
              <Text style={styles.detailLabel}>• {det.concepto}</Text>
              <Text
                style={[styles.detailValue, det.valor < 0 && styles.negative]}
              >
                {formatCurrency(det.valor)}
              </Text>
            </View>
          ))}
      </View>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Balance General</Text>
        <Text style={styles.subtitle}>Estado de Situación Financiera</Text>
        <Text style={styles.date}>
          {mockBalanceGeneral.mes} {mockBalanceGeneral.año}
        </Text>
        <Text style={styles.date}>{mockBalanceGeneral.fecha}</Text>
      </View>

      {/* ACTIVO */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>ACTIVO</Text>

        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>Disponible</Text>
          {renderDetailRow(
            mockBalanceGeneral.activo.disponible.caja,
            "caja",
            "Caja"
          )}
          {renderDetailRow(
            mockBalanceGeneral.activo.disponible.bancos,
            "bancos",
            "Bancos"
          )}
          {renderDetailRow(
            mockBalanceGeneral.activo.disponible.cuentasAhorro,
            "cuentasAhorro",
            "Cuentas de Ahorro"
          )}
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Disponible</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(mockBalanceGeneral.activo.disponible.total)}
            </Text>
          </View>
        </View>

        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>Deudores</Text>
          {renderDetailRow(
            mockBalanceGeneral.activo.deudores.clientes,
            "clientes",
            "Clientes"
          )}
          {renderDetailRow(
            mockBalanceGeneral.activo.deudores.anticipos,
            "anticipos",
            "Anticipos y Avances"
          )}
          {renderDetailRow(
            mockBalanceGeneral.activo.deudores.provisiones,
            "provisiones",
            "Provisiones"
          )}
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Deudores</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(mockBalanceGeneral.activo.deudores.total)}
            </Text>
          </View>
        </View>

        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>Propiedad, Planta y Equipo</Text>
          {renderDetailRow(
            mockBalanceGeneral.activo.propiedadPlantaEquipo.maquinaria,
            "maquinaria",
            "Maquinaria y Equipo"
          )}
          {renderDetailRow(
            mockBalanceGeneral.activo.propiedadPlantaEquipo.muebles,
            "muebles",
            "Muebles y Enseres"
          )}
          {renderDetailRow(
            mockBalanceGeneral.activo.propiedadPlantaEquipo.equipoComputo,
            "equipoComputo",
            "Equipo de Cómputo"
          )}
          {renderDetailRow(
            mockBalanceGeneral.activo.propiedadPlantaEquipo.depreciacion,
            "depreciacion",
            "Depreciación Acumulada"
          )}
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total P.P.E.</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(
                mockBalanceGeneral.activo.propiedadPlantaEquipo.total
              )}
            </Text>
          </View>
        </View>

        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>Diferidos</Text>
          {renderDetailRow(
            mockBalanceGeneral.activo.diferidos.seguros,
            "seguros",
            "Seguros y Fianzas"
          )}
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Diferidos</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(mockBalanceGeneral.activo.diferidos.total)}
            </Text>
          </View>
        </View>

        <View style={[styles.row, styles.grandTotalRow]}>
          <Text style={styles.grandTotalLabel}>TOTAL ACTIVO</Text>
          <Text style={styles.grandTotalValue}>
            {formatCurrency(mockBalanceGeneral.activo.total)}
          </Text>
        </View>
      </View>

      {/* PASIVO */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}> PASIVO</Text>

        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>Cuentas por Pagar</Text>
          {renderDetailRow(
            mockBalanceGeneral.pasivo.cuentasPorPagar.costos,
            "costos",
            "Otras Cuentas por Pagar"
          )}
          {renderDetailRow(
            mockBalanceGeneral.pasivo.cuentasPorPagar.retencionFuente,
            "retencionFuente",
            "Retención en la Fuente"
          )}
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Cuentas por Pagar</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(mockBalanceGeneral.pasivo.cuentasPorPagar.total)}
            </Text>
          </View>
        </View>

        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>
            Impuestos, Gravámenes y Tasas
          </Text>
          {renderDetailRow(
            mockBalanceGeneral.pasivo.impuestos.iva,
            "iva",
            "IVA por Pagar"
          )}
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Impuestos</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(mockBalanceGeneral.pasivo.impuestos.total)}
            </Text>
          </View>
        </View>

        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>Diferidos</Text>
          {renderDetailRow(
            mockBalanceGeneral.pasivo.diferidos.anticipoAdmin,
            "anticipoAdmin",
            "Anticipo de Administración"
          )}
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Diferidos</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(mockBalanceGeneral.pasivo.diferidos.total)}
            </Text>
          </View>
        </View>

        <View style={styles.subsection}>
          <Text style={styles.subsectionTitle}>Otros Pasivos</Text>
          {renderDetailRow(
            mockBalanceGeneral.pasivo.otrosPasivos.fondosEspecificos,
            "fondosEspecificos",
            "Fondos con Destino Específico"
          )}
          {renderDetailRow(
            mockBalanceGeneral.pasivo.otrosPasivos.ingresosParaTerceros,
            "ingresosParaTerceros",
            "Ingresos para Terceros"
          )}
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Otros Pasivos</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(mockBalanceGeneral.pasivo.otrosPasivos.total)}
            </Text>
          </View>
        </View>

        <View style={[styles.row, styles.grandTotalRow]}>
          <Text style={styles.grandTotalLabel}>TOTAL PASIVO</Text>
          <Text style={styles.grandTotalValue}>
            {formatCurrency(mockBalanceGeneral.pasivo.total)}
          </Text>
        </View>
      </View>

      {/* PATRIMONIO */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}> PATRIMONIO</Text>

        <View style={styles.row}>
          <Text style={styles.label}>Reservas</Text>
          <Text style={styles.value}>
            {formatCurrency(mockBalanceGeneral.patrimonio.reservas)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Utilidad del Ejercicio</Text>
          <Text style={styles.value}>
            {formatCurrency(mockBalanceGeneral.patrimonio.utilidadEjercicio)}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Utilidades Acumuladas</Text>
          <Text style={styles.value}>
            {formatCurrency(mockBalanceGeneral.patrimonio.utilidadesAcumuladas)}
          </Text>
        </View>

        <View style={[styles.row, styles.grandTotalRow]}>
          <Text style={styles.grandTotalLabel}>TOTAL PATRIMONIO</Text>
          <Text style={styles.grandTotalValue}>
            {formatCurrency(mockBalanceGeneral.patrimonio.total)}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    padding: 16,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    marginTop: 4,
  },
  date: {
    fontSize: 13,
    color: "#999",
    marginTop: 4,
  },
  section: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 21,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 12,
  },
  subsection: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  subsectionTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#34495e",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  label: {
    fontSize: 15,
    color: "#555",
    flex: 1,
  },
  value: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  negative: {
    color: "#e74c3c",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingLeft: 20,
    backgroundColor: "#f9f9f9",
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#555",
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#ddd",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#2c3e50",
    flex: 1,
  },
  totalValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2c3e50",
  },
  grandTotalRow: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: "#2c3e50",
    backgroundColor: "#ecf0f1",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 4,
  },
  grandTotalLabel: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#2c3e50",
    flex: 1,
  },
  grandTotalValue: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  equation: {
    backgroundColor: "#d5f4e6",
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
    alignItems: "center",
  },
  equationText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#27ae60",
    marginBottom: 8,
  },
  equationValues: {
    fontSize: 12,
    color: "#27ae60",
  },
});
