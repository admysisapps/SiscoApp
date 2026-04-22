import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { THEME } from "@/constants/theme";

export interface SelectOption<T extends string = string> {
  label: string;
  value: T;
  icon?: ComponentProps<typeof Ionicons>["name"];
}

interface SelectFieldProps<T extends string = string> {
  label?: string;
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
}

export function SelectField<T extends string = string>({
  label,
  value,
  options,
  onChange,
}: SelectFieldProps<T>) {
  const [visible, setVisible] = useState(false);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? "";

  const handleSelect = (optionValue: T) => {
    setVisible(false);
    onChange(optionValue);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.triggerText}>{selectedLabel}</Text>
        <Ionicons
          name="chevron-down"
          size={18}
          color={THEME.colors.text.secondary}
        />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            {label && (
              <View style={styles.header}>
                <Text style={styles.title}>{label}</Text>
              </View>
            )}

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.optionsList}
            >
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => handleSelect(option.value)}
                    activeOpacity={0.7}
                  >
                    {option.icon && (
                      <Ionicons
                        name={option.icon}
                        size={20}
                        color={
                          isSelected
                            ? THEME.colors.success
                            : THEME.colors.text.secondary
                        }
                      />
                    )}
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                    >
                      {option.label}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color={THEME.colors.success}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: THEME.colors.surfaceLight,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: THEME.spacing.sm,
  },
  triggerText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.primary,
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: THEME.colors.modalOverlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: THEME.spacing.md,
  },
  modal: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 20,
    padding: 24,
    width: "98%",
    maxWidth: 600,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.colors.header.title,
  },
  optionsList: {
    marginBottom: 16,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: THEME.colors.border,
    backgroundColor: THEME.colors.surface,
    gap: 12,
    marginBottom: 8,
  },
  optionSelected: {
    borderColor: THEME.colors.success,
    backgroundColor: THEME.colors.successLight,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    color: THEME.colors.text.heading,
    fontWeight: "500",
  },
  optionTextSelected: {
    color: THEME.colors.success,
    fontWeight: "600",
  },
  cancelButton: {
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.text.secondary,
  },
});
