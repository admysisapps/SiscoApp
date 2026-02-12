import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import dayjs from "dayjs";
import Toast from "@/components/Toast";
import { reservaService } from "@/services/reservaService";
import { THEME } from "@/constants/theme";
import ScreenHeader from "@/components/shared/ScreenHeader";
import { Button } from "@/components/reacticx/button";

// Función para calcular hora fin basada en hora inicio y duración
const calcularHoraFin = (
  horaInicio: string,
  duracionMinutos: number
): string => {
  const inicio = new Date(`2000-01-01T${horaInicio}:00`);
  inicio.setMinutes(inicio.getMinutes() + duracionMinutos);
  return inicio.toTimeString().slice(0, 5);
};

export default function ConfirmarReservaScreen() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [motivo, setMotivo] = useState("");

  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error" | "warning",
  });
  const [behavior, setBehavior] = useState<"padding" | "height" | undefined>(
    Platform.OS === "ios" ? "padding" : "height"
  );

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener("keyboardDidShow", () => {
      setBehavior(Platform.OS === "ios" ? "padding" : "height");
    });

    const keyboardHideListener = Keyboard.addListener("keyboardDidHide", () => {
      setBehavior(undefined);
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  // Función para organizar horarios por días
  const organizarHorarios = () => {
    const horariosStr = params.horarios as string;
    const tipoReserva = params.tipoReserva as string;

    if (!horariosStr) {
      return [
        {
          fecha: params.fechaSeleccionada as string,
          horarios: [`${params.horaInicio} - ${params.horaFin}`],
        },
      ];
    }

    const horarios = horariosStr.split(", ");
    const diaActual: string[] = [];
    const diaSiguiente: string[] = [];

    horarios.forEach((horario) => {
      let horarioFormateado = horario;

      // Si es bloque_fijo y no tiene el prefijo "Bloque", agregarlo
      if (tipoReserva === "bloque_fijo" && !horario.includes("Bloque")) {
        const horaLimpia = horario.replace(" (+1 día)", "");
        const horaInicio = parseInt(horaLimpia.split(":")[0]);
        const horaFin = horaInicio + 2;
        const horaFinFormateada =
          horaFin >= 24
            ? `${(horaFin - 24).toString().padStart(2, "0")}:00`
            : `${horaFin.toString().padStart(2, "0")}:00`;
        horarioFormateado = `Bloque ${horaLimpia} - ${horaFinFormateada}`;
        if (horario.includes("(+1 día)")) {
          horarioFormateado += " (+1 día)";
        }
      }

      if (horarioFormateado.includes("(+1 día)")) {
        diaSiguiente.push(horarioFormateado.replace(" (+1 día)", ""));
      } else {
        diaActual.push(horarioFormateado);
      }
    });

    const resultado = [];

    if (diaActual.length > 0) {
      resultado.push({
        fecha: params.fechaSeleccionada as string,
        horarios: diaActual,
      });
    }

    if (diaSiguiente.length > 0) {
      const fechaSiguiente = new Date(params.fechaSeleccionada as string);
      fechaSiguiente.setDate(fechaSiguiente.getDate() + 1);
      resultado.push({
        fecha: fechaSiguiente.toISOString().split("T")[0],
        horarios: diaSiguiente,
      });
    }

    return resultado;
  };

  const showToast = (
    message: string,
    type: "success" | "error" | "warning" = "success"
  ) => {
    setToast({ visible: true, message, type });
  };

  const hideToast = useCallback(() => {
    setToast({ visible: false, message: "", type: "success" });
  }, []);

  const handleBackPress = useCallback(() => {
    router.back();
  }, []);

  const confirmarReserva = async () => {
    Keyboard.dismiss();
    setLoading(true);

    try {
      const response = await reservaService.crearReserva({
        espacio_id: Number(params.espacioId),
        fecha_reserva: params.fechaSeleccionada as string,
        hora_inicio: params.horaInicio as string,
        hora_fin:
          (params.horaFin as string) ||
          (params.duracionMinutos
            ? calcularHoraFin(
                params.horaInicio as string,
                Number(params.duracionMinutos)
              )
            : "00:00"),
        precio_total: Number(params.precioTotal),
        duracion_minutos: params.duracionMinutos
          ? Number(params.duracionMinutos)
          : undefined,
        motivo: motivo.trim() || undefined,
      });

      if (response.success) {
        showToast(response.mensaje || "Reserva creada exitosamente", "success");

        setTimeout(() => {
          router.push("/(tabs)");
        }, 2000);
      } else {
        showToast(response.error || "Error al crear la reserva", "error");
      }
    } catch {
      showToast("Error de conexión", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Confirmar Reserva" onBackPress={handleBackPress} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={behavior}>
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Indicador de pasos */}
          <View style={styles.stepsIndicator}>
            {[1, 2, 3].map((stepNum) => (
              <View key={stepNum} style={styles.stepIndicatorContainer}>
                <View style={[styles.stepCircle, styles.stepCircleActive]}>
                  <Text style={[styles.stepNumber, styles.stepNumberActive]}>
                    {stepNum}
                  </Text>
                </View>
                {stepNum < 3 && <View style={styles.stepLine} />}
              </View>
            ))}
          </View>

          {/* Resumen de la reserva */}
          <View style={styles.resumenContainer}>
            <Text style={styles.sectionTitle}>Resumen de tu reserva</Text>

            <View style={styles.detalleCard}>
              <View style={styles.detalleRow}>
                <Text style={styles.detalleLabel}>Zona común</Text>
                <Text style={styles.detalleValor}>{params.espacioNombre}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detalleRow}>
                <Text style={styles.detalleLabel}>Fecha</Text>
                <Text style={styles.detalleValor}>
                  {dayjs(params.fechaSeleccionada as string).format(
                    "dddd, DD [de] MMMM"
                  )}
                </Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detalleRowVertical}>
                <Text style={styles.detalleLabel}>Horarios seleccionados</Text>
                <View style={styles.horariosContainer}>
                  {organizarHorarios().map((dia, index) => (
                    <View key={index} style={styles.diaContainer}>
                      <Text style={styles.fechaDia}>
                        {dayjs(dia.fecha).format("dddd, DD [de] MMMM")}
                      </Text>
                      <View style={styles.horariosLista}>
                        {dia.horarios.map((horario, idx) => (
                          <View key={idx} style={styles.horarioChip}>
                            <Text style={styles.horarioTexto}>{horario}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.precioRow}>
                <Text style={styles.precioLabel}>Total a pagar</Text>
                <Text style={styles.precioTotal}>
                  ${Number(params.precioTotal || 0).toLocaleString()}
                </Text>
              </View>
            </View>
          </View>

          {/* Campo de motivo opcional */}
          <View style={styles.motivoContainer}>
            <Text style={styles.sectionTitle}>
              Motivo de la reserva (opcional)
            </Text>
            <TextInput
              style={styles.motivoInput}
              placeholder="Ej: Reunión familiar, Celebración de cumpleaños..."
              placeholderTextColor={THEME.colors.text.muted}
              value={motivo}
              onChangeText={setMotivo}
              maxLength={255}
              multiline
              numberOfLines={3}
            />
            <Text style={styles.caracteresRestantes}>
              {motivo.length}/255 caracteres
            </Text>
          </View>

          {/* Información adicional */}

          {params.requiereAprobacion === "true" ? (
            <View style={styles.infoContainer}>
              <Ionicons
                name="information-circle"
                size={20}
                color={THEME.colors.warning}
              />
              <Text style={styles.infoTexto}>
                Tu reserva quedará en estado &quot;Pendiente&quot; hasta que sea
                confirmada por el administrador.
              </Text>
            </View>
          ) : (
            <View style={[styles.infoContainer, styles.infoContainerSuccess]}>
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={THEME.colors.success}
              />
              <Text style={[styles.infoTexto, styles.infoTextoSuccess]}>
                Esta zona no necesita aprobación del administrador, por lo que
                se confirmará automáticamente.
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Botón confirmar */}
        <View style={styles.bottomContainer}>
          <Button
            isLoading={loading}
            onPress={confirmarReserva}
            loadingText="Confirmando..."
            loadingTextColor="#fff"
            backgroundColor={THEME.colors.success}
            loadingTextBackgroundColor={THEME.colors.success}
            height={56}
            borderRadius={12}
            style={{ width: "100%" }}
          >
            <Text style={styles.confirmarButtonText}>Confirmar Reserva</Text>
          </Button>
        </View>
      </KeyboardAvoidingView>

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
  stepsIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  stepIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  stepCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: THEME.colors.surfaceLight,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: THEME.colors.border,
  },
  stepCircleActive: {
    backgroundColor: THEME.colors.success,
    borderColor: THEME.colors.success,
  },
  stepNumber: {
    fontSize: 12,
    fontWeight: "700",
    color: THEME.colors.text.muted,
  },
  stepNumberActive: { color: THEME.colors.text.inverse },
  stepLine: {
    width: 44,
    height: 2,
    backgroundColor: THEME.colors.border,
    marginHorizontal: 8,
  },
  motivoContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  motivoInput: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: THEME.colors.text.heading,
    textAlignVertical: "top",
    minHeight: 80,
  },
  caracteresRestantes: {
    fontSize: 12,
    color: THEME.colors.text.muted,
    textAlign: "right",
    marginTop: 8,
  },
  infoContainer: {
    flexDirection: "row",
    backgroundColor: THEME.colors.warning + "10",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    marginHorizontal: 16,
  },
  infoContainerSuccess: {
    backgroundColor: THEME.colors.success + "10",
    borderLeftColor: THEME.colors.success,
  },
  infoTexto: {
    flex: 1,
    fontSize: 14,
    color: THEME.colors.warning,
    marginLeft: 12,
    lineHeight: 20,
  },
  infoTextoSuccess: {
    color: THEME.colors.success,
  },

  bottomContainer: {
    padding: 16,
    backgroundColor: THEME.colors.surface,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    alignItems: "center",
  },
  confirmarButtonText: {
    color: THEME.colors.text.inverse,
    fontSize: 16,
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  resumenContainer: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.colors.text.heading,
    marginBottom: 16,
  },
  detalleCard: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: THEME.colors.surfaceLight,
  },
  detalleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  detalleLabel: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
  },
  detalleValor: {
    fontSize: 16,
    color: THEME.colors.text.heading,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: THEME.colors.surfaceLight,
    marginVertical: 4,
  },
  precioRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    backgroundColor: THEME.colors.background,
    borderRadius: 12,
    paddingHorizontal: 20,
    marginTop: 8,
  },
  precioLabel: {
    fontSize: 16,
    color: THEME.colors.text.secondary,
    fontWeight: "600",
  },
  precioTotal: {
    fontSize: 20,
    color: THEME.colors.success,
    fontWeight: "700",
  },
  detalleRowVertical: {
    paddingVertical: 14,
  },
  horariosContainer: {
    marginTop: 8,
  },
  diaContainer: {
    marginBottom: 12,
  },
  fechaDia: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.text.secondary,
    marginBottom: 8,
    textTransform: "capitalize",
  },
  horariosLista: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  horarioChip: {
    backgroundColor: THEME.colors.success + "10",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: THEME.colors.success,
  },
  horarioTexto: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.success,
  },
});
