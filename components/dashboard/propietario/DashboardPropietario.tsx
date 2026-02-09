import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import ApartmentSelector from "../../ApartmentSelector";
import AnuncioSistema from "./AnuncioSistema";
import EstadoPagosUsuario from "./EstadoPagosUsuario";
import AccionesRapidas from "./AccionesRapidas";

const DashboardPropietario = React.memo(function DashboardPropietario() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <ApartmentSelector />
      <AnuncioSistema />
      <EstadoPagosUsuario />
      <AccionesRapidas />
    </ScrollView>
  );
});

export default DashboardPropietario;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
});
