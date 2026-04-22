import React from "react";
import { View, StyleSheet } from "react-native";
import { COLORS } from "../../../constants/theme";
import ProximosPagos from "./DiponibilidadFondos";
import AccionesRapidasAdmin from "./AccionesRapidasAdmin";

export default function DashboardAdmin() {
  return (
    <View style={styles.container}>
      <ProximosPagos />
      <AccionesRapidasAdmin />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
