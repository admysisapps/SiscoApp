import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { THEME } from "@/constants/theme";

interface DiaHorarioItemProps {
  diaSemana: number;
  horario: {
    activo: boolean;
    hora_inicio: string;
    hora_fin: string;
    precio_especial: string;
  };
  onToggle: () => void;
  onUpdateHorario: (
    campo: "hora_inicio" | "hora_fin" | "precio_especial",
    valor: string
  ) => void;
  onOpenTimePicker: (tipo: "inicio" | "fin") => void;
  error?: string;
  mostrarPrecio: boolean;
}

const DIAS_NOMBRES: { [key: number]: string } = {
  1: "Lunes",
  2: "Martes",
  3: "Miércoles",
  4: "Jueves",
  5: "Viernes",
  6: "Sábado",
  7: "Domingo",
};

export default function DiaHorarioItem({
  diaSemana,
  horario,
  onToggle,
  onUpdateHorario,
  onOpenTimePicker,
  error,
  mostrarPrecio,
}: DiaHorarioItemProps) {
  const [expandido, setExpandido] = useState(false);

  return (
    <View
      style={[styles.container, !horario.activo && styles.containerInactivo]}
    >
      <TouchableOpacity
        style={styles.header}
        onPress={() => horario.activo && setExpandido(!expandido)}
        activeOpacity={0.7}
      >
        <TouchableOpacity style={styles.checkbox} onPress={onToggle}>
          <Ionicons
            name={horario.activo ? "checkbox" : "square-outline"}
            size={22}
            color={
              horario.activo ? THEME.colors.primary : THEME.colors.text.muted
            }
          />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text
            style={[
              styles.diaNombre,
              !horario.activo && styles.diaNombreInactivo,
            ]}
          >
            {DIAS_NOMBRES[diaSemana]}
          </Text>
          {horario.activo && (
            <Text style={styles.horarioResumen}>
              {horario.hora_inicio} - {horario.hora_fin}
              {mostrarPrecio &&
                horario.precio_especial &&
                ` • $${parseInt(horario.precio_especial).toLocaleString()}`}
            </Text>
          )}
        </View>

        {horario.activo && (
          <Ionicons
            name={expandido ? "chevron-up" : "chevron-down"}
            size={20}
            color={THEME.colors.text.secondary}
          />
        )}
      </TouchableOpacity>

      {horario.activo && expandido && (
        <View style={styles.detalles}>
          <View style={styles.timeRow}>
            <View style={styles.timeInput}>
              <Text style={styles.timeLabel}>Inicio</Text>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => onOpenTimePicker("inicio")}
              >
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={THEME.colors.primary}
                />
                <Text style={styles.timePickerText}>{horario.hora_inicio}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.timeInput}>
              <Text style={styles.timeLabel}>Fin</Text>
              <TouchableOpacity
                style={styles.timePickerButton}
                onPress={() => onOpenTimePicker("fin")}
              >
                <Ionicons
                  name="time-outline"
                  size={16}
                  color={THEME.colors.primary}
                />
                <Text style={styles.timePickerText}>{horario.hora_fin}</Text>
              </TouchableOpacity>
            </View>

            {mostrarPrecio && (
              <View style={styles.timeInput}>
                <Text style={styles.timeLabel}>Precio Especial</Text>
                <TextInput
                  style={styles.timeInputField}
                  value={horario.precio_especial}
                  onChangeText={(text) =>
                    onUpdateHorario("precio_especial", text)
                  }
                  placeholder="Opcional"
                  placeholderTextColor={THEME.colors.text.muted}
                  keyboardType="number-pad"
                />
              </View>
            )}
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.surfaceLight,
    borderRadius: THEME.borderRadius.md,
    marginBottom: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    overflow: "hidden",
  },
  containerInactivo: {
    opacity: 0.5,
    backgroundColor: THEME.colors.surfaceLight + "80",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: THEME.spacing.sm,
    gap: THEME.spacing.sm,
  },
  checkbox: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
  },
  diaNombre: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  diaNombreInactivo: {
    color: THEME.colors.text.muted,
  },
  horarioResumen: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.text.secondary,
    marginTop: 2,
  },
  detalles: {
    paddingHorizontal: THEME.spacing.sm,
    paddingBottom: THEME.spacing.sm,
    paddingLeft: 40,
  },
  timeRow: {
    flexDirection: "row",
    gap: THEME.spacing.sm,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    fontSize: THEME.fontSize.xs,
    fontWeight: "500",
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.xs,
    textAlign: "center",
  },
  timePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.sm,
    padding: THEME.spacing.sm,
    gap: THEME.spacing.xs,
    justifyContent: "center",
  },
  timePickerText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.primary,
    fontWeight: "500",
  },
  timeInputField: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: THEME.borderRadius.sm,
    padding: THEME.spacing.xs,
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.primary,
    textAlign: "center",
  },
  errorText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.error,
    marginTop: THEME.spacing.xs,
  },
});
