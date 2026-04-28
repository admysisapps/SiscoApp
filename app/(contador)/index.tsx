import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import DashboardContador from "@/components/dashboard/contador/DashboardContador";
import { THEME } from "@/constants/theme";

export default function ContadorIndex() {
  return (
    <>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <DashboardContador />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
});
