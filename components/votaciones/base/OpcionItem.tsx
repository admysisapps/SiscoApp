import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { THEME } from "@/constants/theme";

interface OpcionItemProps {
  opcion: { id: number; opcion: string };
  disabled: boolean;
  onPress: (id: number) => void;
  isVotando: boolean;
}

export const OpcionItem = React.memo(
  ({ opcion, disabled, onPress, isVotando }: OpcionItemProps) => {
    return (
      <TouchableOpacity
        style={[styles.opcionButton, disabled && styles.opcionButtonDisabled]}
        onPress={() => onPress(opcion.id)}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Text style={styles.opcionText}>{opcion.opcion}</Text>
        {isVotando && (
          <ActivityIndicator size="small" color={THEME.colors.primary} />
        )}
      </TouchableOpacity>
    );
  },
  (prevProps, nextProps) =>
    prevProps.opcion.id === nextProps.opcion.id &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.isVotando === nextProps.isVotando
);

OpcionItem.displayName = "OpcionItem";

const styles = StyleSheet.create({
  opcionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  opcionButtonDisabled: {
    opacity: 0.5,
  },
  opcionText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#0F172A",
    flex: 1,
  },
});
