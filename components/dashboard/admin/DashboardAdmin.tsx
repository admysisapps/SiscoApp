import React from "react";
import { View, StyleSheet } from "react-native";
import { THEME } from "@/constants/theme";
import AccionesRapidasAdmin from "./AccionesRapidasAdmin";

import IndicadoresCopropiedad from "./IndicadoresCopropiedad";

export default function DashboardAdmin() {
  return (
    <View style={styles.container}>
      <IndicadoresCopropiedad />
      <AccionesRapidasAdmin />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
});
