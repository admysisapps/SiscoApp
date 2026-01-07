import TableroPublicaciones from "@/components/publicaciones/TableroPublicaciones";
import React from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function TableroAnunciosScreen() {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <TableroPublicaciones />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
});
