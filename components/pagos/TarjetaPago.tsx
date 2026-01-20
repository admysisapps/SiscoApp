import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import { CuentaPago } from "@/types/CuentaPago";
import { getTipoNombre, getTypeIcon } from "@/constants/pagos";
import { openURL } from "@/utils/linkingHelper";
import { THEME } from "@/constants/theme";

const { width } = Dimensions.get("window");

interface Props {
  cuenta: CuentaPago;
  onPress: (cuenta: CuentaPago) => void;
  onError?: (message: string) => void;
}

export default function PaymentCard({ cuenta, onPress, onError }: Props) {
  const handleCopyAccount = async () => {
    if (cuenta.numero_cuenta) {
      await Clipboard.setStringAsync(cuenta.numero_cuenta);
    }
  };

  const handleOpenLink = () => {
    if (cuenta.enlace_pago) {
      openURL(cuenta.enlace_pago, onError);
    }
  };

  const getGradientColors = (): [string, string] => {
    switch (cuenta.tipo_cuenta) {
      case "ahorros":
      case "corriente":
        return [THEME.colors.primary, THEME.colors.primaryDark];
      case "billeteras_digitales":
        return [THEME.colors.success, "#059669"];
      case "pasarela":
        return [THEME.colors.secondary, THEME.colors.secondaryDark];
      case "fisico":
        return [THEME.colors.warning, "#D97706"];
      default:
        return [THEME.colors.text.secondary, THEME.colors.text.muted];
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={() => onPress(cuenta)}>
      <LinearGradient
        colors={getGradientColors()}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.bankInfo}>
            <Ionicons
              name={getTypeIcon(cuenta.tipo_cuenta)}
              size={24}
              color="white"
            />
            <Text style={styles.bankName}>{cuenta.nombre_banco}</Text>
          </View>
          <Text style={styles.accountType}>
            {getTipoNombre(cuenta.tipo_cuenta).toUpperCase()}
          </Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.titular}>{cuenta.titular}</Text>
          {cuenta.numero_cuenta && (
            <TouchableOpacity
              style={styles.accountRow}
              onPress={handleCopyAccount}
            >
              <Text style={styles.accountNumber}>
                {cuenta.tipo_cuenta === "billeteras_digitales"
                  ? cuenta.numero_cuenta
                  : cuenta.numero_cuenta.replace(/(.{4})/g, "$1 ")}
              </Text>
              <Ionicons name="copy" size={16} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.actions}>
          {cuenta.enlace_pago && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleOpenLink}
            >
              <Ionicons name="link" size={16} color="white" />
              <Text style={styles.actionText}>Pagar</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderRadius: 16,
  },
  card: {
    borderRadius: 16,
    padding: width < 360 ? 12 : 20,
    minHeight: width < 360 ? 100 : 140,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  bankInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  bankName: {
    color: "white",
    fontSize: width < 360 ? 14 : 16,
    fontWeight: "700",
    flexShrink: 1,
  },
  accountType: {
    color: "rgba(255,255,255,0.8)",
    fontSize: width < 360 ? 10 : 12,
    fontWeight: "600",
    flexShrink: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
  },
  titular: {
    color: "white",
    fontSize: width < 360 ? 12 : 14,
    fontWeight: "500",
    marginBottom: 8,
    flexShrink: 1,
  },
  accountRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accountNumber: {
    color: "white",
    fontSize: width < 360 ? 14 : 18,
    fontWeight: "600",
    letterSpacing: width < 360 ? 1 : 2,
    flexShrink: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  actionText: {
    color: "white",
    fontSize: width < 360 ? 10 : 12,
    fontWeight: "600",
  },
});
