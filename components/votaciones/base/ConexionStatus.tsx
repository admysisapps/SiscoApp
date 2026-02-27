import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";

interface ConexionStatusProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

const ConexionStatus: React.FC<ConexionStatusProps> = ({
  onConnectionChange,
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [connectionType, setConnectionType] = useState<string>("wifi");

  useEffect(() => {
    const timeoutRef = { current: null as NodeJS.Timeout | null };

    const unsubscribe = NetInfo.addEventListener((state) => {
      const connected = state.isConnected ?? false;
      const type = state.type;

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      timeoutRef.current = setTimeout(() => {
        if (connected !== isConnected) {
          setIsConnected(connected);
          onConnectionChange?.(connected);
        }
        setConnectionType(type);
      }, 1000);
    });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      unsubscribe();
    };
  }, [isConnected, onConnectionChange]);

  return (
    <View style={styles.container}>
      <Ionicons
        name={
          !isConnected
            ? "wifi-outline"
            : connectionType === "wifi"
              ? "wifi"
              : "cellular"
        }
        size={16}
        color={isConnected ? THEME.colors.success : THEME.colors.error}
      />
      <Text
        style={[
          styles.text,
          isConnected ? styles.onlineText : styles.offlineText,
        ]}
      >
        {isConnected ? "En línea" : "Sin conexión"}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: THEME.spacing.sm,
    paddingVertical: THEME.spacing.xs,
    backgroundColor: THEME.colors.surface,
    borderRadius: THEME.borderRadius.sm,
  },
  text: {
    fontSize: THEME.fontSize.xs,
    fontWeight: "500",
    marginLeft: THEME.spacing.xs,
  },
  onlineText: {
    color: THEME.colors.success,
  },
  offlineText: {
    color: THEME.colors.error,
  },
});

export default ConexionStatus;
