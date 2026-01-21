import React, { useState } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRole } from "@/hooks/useRole";
import AvisosList from "@/components/avisos/AvisosList";
import Toast from "@/components/Toast";
import { THEME } from "@/constants/theme";
import ScreenHeader from "@/components/shared/ScreenHeader";

export default function AvisosScreen() {
  const { isAdmin } = useRole();
  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error" | "warning",
  });

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" = "success"
  ) => {
    setToast({ visible: true, message, type });
  };

  const hideToast = () => {
    setToast({ visible: false, message: "", type: "success" });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Comunicados" />

      <AvisosList showToast={showToast} isAdmin={isAdmin} />

      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
});
