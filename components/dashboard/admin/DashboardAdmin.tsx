import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import GraficoPagos from "./GraficoPagos";
import EstadoFinanciero from "./EstadoFinanciero";
import ProximosPagos from "./ProximosPagos";
import ActividadReciente from "./ActividadReciente";
import ApartmentSelector from "../../ApartmentSelector";

export default function DashboardAdmin() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ApartmentSelector />
      <GraficoPagos />
      <EstadoFinanciero />
      <ProximosPagos />
      <ActividadReciente />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
});
