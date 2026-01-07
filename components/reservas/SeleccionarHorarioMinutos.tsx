import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import DateTimePicker from "@react-native-community/datetimepicker";
import { reservaService } from "@/services/reservaService";
import dayjs from "dayjs";

interface Props {
  espacioId: string;
  espacioNombre: string;
  fechaSeleccionada: string;
  espacioCosto: string;
  tiempoReserva: string;
  tiempoMaximoReserva: string;
  requiereAprobacion: string;
  espacio: any;
  showToast: (message: string, type?: "success" | "error" | "warning") => void;
  setConflictoModal: (modal: any) => void;
}

export default function SeleccionarHorarioMinutos({
  espacioId,
  espacioNombre,
  fechaSeleccionada,
  espacioCosto,
  tiempoReserva,
  tiempoMaximoReserva,
  requiereAprobacion,
  espacio,
  showToast,
  setConflictoModal,
}: Props) {
  const [horaInicio, setHoraInicio] = useState(new Date());

  React.useEffect(() => {
    if (espacio?.horarios) {
      const fechaReserva = new Date(fechaSeleccionada + "T00:00:00");
      const diaSemana = fechaReserva.getDay() === 0 ? 7 : fechaReserva.getDay();
      const horarioDelDia = espacio.horarios.find(
        (h: any) => h.dia_semana === diaSemana && h.activo
      );

      if (horarioDelDia?.hora_inicio) {
        const [hora, minuto] = horarioDelDia.hora_inicio.split(":").map(Number);
        const nuevaHora = new Date();
        nuevaHora.setHours(hora, minuto, 0, 0);
        setHoraInicio(nuevaHora);
      } else {
        const fallback = new Date();
        fallback.setHours(6, 0, 0, 0);
        setHoraInicio(fallback);
      }
    }
  }, [espacio, fechaSeleccionada]);
  const [duracionMinutos, setDuracionMinutos] = useState(30);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [validandoDisponibilidad, setValidandoDisponibilidad] = useState(false);
  const [duracionPersonalizada, setDuracionPersonalizada] = useState("");
  const [usandoDuracionPersonalizada, setUsandoDuracionPersonalizada] =
    useState(false);

  const tiempoMaximoReservaValue = Number(tiempoMaximoReserva) || 240;
  const duracionesDisponibles = [15, 30, 45, 60, 90, 120, 180, 240, 300, 360];

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setHoraInicio(selectedTime);
    }
  };

  const calcularHoraFin = () => {
    const fin = new Date(horaInicio);
    fin.setMinutes(fin.getMinutes() + duracionMinutos);
    return fin;
  };

  const validarHorarioEnRango = () => {
    if (!espacio?.horarios) return { valido: true, mensaje: "" };

    const fechaReserva = new Date(fechaSeleccionada + "T00:00:00");
    const diaSemana = fechaReserva.getDay() === 0 ? 7 : fechaReserva.getDay();
    const horarioDelDia = espacio.horarios.find(
      (h: any) => h.dia_semana === diaSemana && h.activo
    );

    if (!horarioDelDia) {
      return {
        valido: false,
        mensaje: "El espacio no está disponible este día.",
      };
    }

    const horaInicioMinutos =
      horaInicio.getHours() * 60 + horaInicio.getMinutes();
    const horaFinCalculada = calcularHoraFin();
    const horaFinMinutos =
      horaFinCalculada.getHours() * 60 + horaFinCalculada.getMinutes();

    const [horaInicioEspacio, minutoInicioEspacio] = horarioDelDia.hora_inicio
      .split(":")
      .map(Number);
    const [horaFinEspacio, minutoFinEspacio] = horarioDelDia.hora_fin
      .split(":")
      .map(Number);

    const inicioEspacioMinutos = horaInicioEspacio * 60 + minutoInicioEspacio;
    const finEspacioMinutos = horaFinEspacio * 60 + minutoFinEspacio;

    if (
      horaInicioMinutos < inicioEspacioMinutos ||
      horaFinMinutos > finEspacioMinutos
    ) {
      return {
        valido: false,
        mensaje: `El horario debe estar entre ${horarioDelDia.hora_inicio} y ${horarioDelDia.hora_fin}.`,
      };
    }

    // Verificar duración mínima
    const tiempoMinimo = espacio.tiempo_minimo_reserva || 30;
    if (duracionMinutos < tiempoMinimo) {
      return {
        valido: false,
        mensaje: `La duración mínima es de ${tiempoMinimo} minutos.`,
      };
    }

    return { valido: true, mensaje: "" };
  };

  const calcularPrecioConEspeciales = () => {
    if (!espacio?.horarios) return Number(espacioCosto) * duracionMinutos;

    const [year, month, dayNum] = fechaSeleccionada.split("-").map(Number);
    const fechaReserva = new Date(year, month - 1, dayNum);
    const diaSemana = fechaReserva.getDay() === 0 ? 7 : fechaReserva.getDay();

    const horarioDelDia = espacio.horarios.find(
      (h: any) => h.dia_semana === diaSemana && h.activo
    );

    const precioBase = horarioDelDia?.precio_especial || Number(espacioCosto);
    return Math.round(precioBase * duracionMinutos);
  };

  const calcularPrecioMinutos = () => {
    return calcularPrecioConEspeciales();
  };

  const tienePrecioEspecial = () => {
    if (!espacio?.horarios) return false;

    const [year, month, dayNum] = fechaSeleccionada.split("-").map(Number);
    const fechaReserva = new Date(year, month - 1, dayNum);
    const diaSemana = fechaReserva.getDay() === 0 ? 7 : fechaReserva.getDay();
    const horarioDelDia = espacio.horarios.find(
      (h: any) => h.dia_semana === diaSemana && h.activo
    );

    return (
      horarioDelDia?.precio_especial &&
      horarioDelDia.precio_especial !== Number(espacioCosto)
    );
  };

  const validarDisponibilidadMinutos = async () => {
    // Validar que la reserva no exceda el horario del espacio
    const validacion = validarHorarioEnRango();
    if (!validacion.valido) {
      showToast(validacion.mensaje, "error");
      return;
    }

    if (duracionMinutos > tiempoMaximoReservaValue) {
      const horasMaximas = Math.floor(tiempoMaximoReservaValue / 60);
      const minutosRestantes = tiempoMaximoReservaValue % 60;

      let tiempoMaximoTexto = "";
      if (horasMaximas > 0 && minutosRestantes > 0) {
        tiempoMaximoTexto = `${horasMaximas}h ${minutosRestantes}min`;
      } else if (horasMaximas > 0) {
        tiempoMaximoTexto = `${horasMaximas} horas`;
      } else {
        tiempoMaximoTexto = `${tiempoMaximoReservaValue} minutos`;
      }

      showToast(
        `La duración máxima es de ${tiempoMaximoTexto}. Reduce el tiempo de tu reserva.`,
        "error"
      );
      return;
    }

    const tiempoAntelacion = Number(tiempoReserva) || 24;
    const ahora = new Date();
    const fechaHoraReserva = new Date(
      `${fechaSeleccionada}T${dayjs(horaInicio).format("HH:mm")}:00`
    );
    const tiempoMinimoRequerido = new Date(
      ahora.getTime() + tiempoAntelacion * 60 * 60 * 1000
    );

    if (fechaHoraReserva < tiempoMinimoRequerido) {
      const horasRestantes = Math.ceil(
        (tiempoMinimoRequerido.getTime() - fechaHoraReserva.getTime()) /
          (1000 * 60 * 60)
      );

      const fechaMinima = new Date(tiempoMinimoRequerido);
      const fechaMinimaTexto = dayjs(fechaMinima).format(
        "DD/MM/YYYY [a las] HH:mm"
      );

      let mensaje = "";
      if (horasRestantes <= 1) {
        mensaje = `No puedes reservar con tan poca antelación. Intenta seleccionar un horario desde mañana.`;
      } else if (horasRestantes <= 24) {
        mensaje = `Necesitas reservar con ${tiempoAntelacion}h de antelación. Puedes reservar desde el ${fechaMinimaTexto}.`;
      } else {
        const diasRestantes = Math.ceil(horasRestantes / 24);
        mensaje = `Necesitas reservar con ${tiempoAntelacion}h de antelación (${diasRestantes} días). Intenta seleccionar una fecha futura.`;
      }

      showToast(mensaje, "error");
      return;
    }

    setValidandoDisponibilidad(true);

    try {
      const response = await reservaService.validarDisponibilidad({
        espacio_id: Number(espacioId),
        fecha_reserva: fechaSeleccionada,
        hora_inicio: dayjs(horaInicio).format("HH:mm"),
        hora_fin: dayjs(calcularHoraFin()).format("HH:mm"),
      });

      if (response?.success) {
        if (response.en_revision) {
          showToast(
            "Tu solicitud está siendo revisada por el administrador. Te notificaremos el resultado.",
            "warning"
          );
        } else if (response.disponible) {
          router.push({
            pathname: "/(screens)/reservas/confirmar-reserva" as any,
            params: {
              espacioId,
              espacioNombre,
              fechaSeleccionada,
              horaInicio: dayjs(horaInicio).format("HH:mm"),
              horaFin: dayjs(calcularHoraFin()).format("HH:mm"),
              duracionMinutos,
              precioTotal: calcularPrecioMinutos(),
              requiereAprobacion,
            },
          });
        } else {
          if (!response.alternativas || response.alternativas.length === 0) {
            const sugerencias = [];
            if (duracionMinutos > 60) {
              sugerencias.push("reduce la duración");
            }
            sugerencias.push("selecciona otra fecha");
            sugerencias.push("prueba un horario diferente");

            const textoSugerencias = sugerencias.join(", ");
            showToast(
              `No hay horarios disponibles para esta selección. Intenta: ${textoSugerencias}.`,
              "warning"
            );
            return;
          }

          const modalData = {
            visible: true,
            horarioSolicitado: {
              inicio: dayjs(horaInicio).format("HH:mm"),
              fin: dayjs(calcularHoraFin()).format("HH:mm"),
              duracion: duracionMinutos,
            },
            conflicto:
              response.reservas_conflictivas &&
              response.reservas_conflictivas.length > 0
                ? response.reservas_conflictivas[0]
                : {
                    hora_inicio: "06:00",
                    hora_fin: "12:00",
                    estado: "Confirmada",
                  },
            conflictos_adicionales: response.reservas_conflictivas || [],
            todas_reservas_dia: response.todas_reservas_dia || [],
            alternativas: response.alternativas || [],
          };

          setConflictoModal(modalData);
        }
      } else if (
        !response?.success &&
        response?.error === "Espacio no disponible"
      ) {
        showToast(
          "Este espacio acaba de entrar en mantenimiento. Por favor selecciona otro espacio.",
          "warning"
        );
        setTimeout(() => {
          router.back();
        }, 2500);
      } else {
        showToast(
          "No pudimos verificar la disponibilidad. Inténtalo nuevamente.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error en validarDisponibilidadMinutos:", error);
      showToast(
        "Problema de conexión. Verifica tu internet e inténtalo nuevamente.",
        "error"
      );
    } finally {
      setValidandoDisponibilidad(false);
    }
  };

  return (
    <>
      <Text style={styles.sectionTitle}>Seleccionar horario</Text>

      <View style={styles.timePickerContainer}>
        <Text style={styles.label}>Hora de inicio:</Text>
        <TouchableOpacity
          style={styles.timeButton}
          onPress={() => setShowTimePicker(true)}
        >
          <Ionicons name="time" size={20} color="#10B981" />
          <Text style={styles.timeText}>
            {dayjs(horaInicio).format("HH:mm")}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.duracionContainer}>
        <Text style={styles.label}>
          Duración (minutos) - Máximo: {tiempoMaximoReservaValue} min
        </Text>
        <View style={styles.duracionGrid}>
          {duracionesDisponibles.map((minutos) => {
            const excedeTiempo = minutos > tiempoMaximoReservaValue;
            return (
              <TouchableOpacity
                key={minutos}
                style={[
                  styles.duracionChip,
                  duracionMinutos === minutos &&
                    !usandoDuracionPersonalizada &&
                    styles.duracionChipSelected,
                  excedeTiempo && styles.duracionChipDisabled,
                ]}
                onPress={() => {
                  if (excedeTiempo) {
                    showToast(
                      `Duración máxima permitida: ${tiempoMaximoReservaValue} minutos`,
                      "error"
                    );
                    return;
                  }
                  setDuracionMinutos(minutos);
                  setUsandoDuracionPersonalizada(false);
                  setDuracionPersonalizada("");
                }}
                disabled={excedeTiempo}
              >
                <Text
                  style={[
                    styles.duracionText,
                    duracionMinutos === minutos &&
                      !usandoDuracionPersonalizada &&
                      styles.duracionTextSelected,
                    excedeTiempo && styles.duracionTextDisabled,
                  ]}
                >
                  {minutos} min
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={[
              styles.duracionChip,
              styles.duracionChipPersonalizada,
              usandoDuracionPersonalizada && styles.duracionChipSelected,
            ]}
            onPress={() => {
              setUsandoDuracionPersonalizada(true);
              setDuracionPersonalizada(duracionMinutos.toString());
            }}
          >
            <Text
              style={[
                styles.duracionText,
                usandoDuracionPersonalizada && styles.duracionTextSelected,
              ]}
            >
              Otro
            </Text>
          </TouchableOpacity>
        </View>

        {usandoDuracionPersonalizada && (
          <View style={styles.inputPersonalizadoContainer}>
            <TextInput
              style={styles.inputPersonalizado}
              value={duracionPersonalizada}
              onChangeText={(text) => {
                setDuracionPersonalizada(text);
                const minutos = parseInt(text);
                if (minutos > 0 && minutos <= tiempoMaximoReservaValue) {
                  setDuracionMinutos(minutos);
                } else if (minutos > tiempoMaximoReservaValue) {
                  showToast(
                    `Duración máxima: ${tiempoMaximoReservaValue} minutos`,
                    "error"
                  );
                }
              }}
              placeholder="Ej: 300"
              keyboardType="numeric"
              maxLength={4}
            />
            <Text style={styles.labelMinutos}>minutos</Text>
          </View>
        )}
      </View>

      <View style={styles.resumenContainer}>
        <Text style={styles.resumenTitle}>Resumen de reserva</Text>
        <Text style={styles.resumenHorarios}>
          {dayjs(horaInicio).format("HH:mm")} -{" "}
          {dayjs(calcularHoraFin()).format("HH:mm")}
        </Text>
        <Text style={styles.resumenHorarios}>
          Duración: {duracionMinutos} minutos
        </Text>
        {tienePrecioEspecial() && (
          <Text style={styles.precioEspecial}>
            Precio especial del día: $
            {(() => {
              const [year, month, dayNum] = fechaSeleccionada
                .split("-")
                .map(Number);
              const fechaReserva = new Date(year, month - 1, dayNum);
              const diaSemana =
                fechaReserva.getDay() === 0 ? 7 : fechaReserva.getDay();
              const horarioDelDia = espacio.horarios.find(
                (h: any) => h.dia_semana === diaSemana && h.activo
              );
              return horarioDelDia?.precio_especial?.toLocaleString() || "0";
            })()}{" "}
            /min
          </Text>
        )}
        <Text style={styles.resumenPrecio}>
          Total: ${calcularPrecioMinutos().toLocaleString()}
        </Text>

        <TouchableOpacity
          style={styles.continuarButton}
          onPress={validarDisponibilidadMinutos}
          disabled={validandoDisponibilidad}
        >
          {validandoDisponibilidad ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Text style={styles.continuarButtonText}>Confirmar Reserva</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {showTimePicker && (
        <DateTimePicker
          value={horaInicio}
          mode="time"
          is24Hour={true}
          display="spinner"
          onChange={handleTimeChange}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
  },
  timePickerContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  timeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  timeText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#0F172A",
  },
  duracionContainer: {
    marginBottom: 20,
  },
  duracionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  duracionChip: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  duracionChipSelected: {
    backgroundColor: "#10B981",
    borderColor: "#10B981",
  },
  duracionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  duracionTextSelected: {
    color: "#FFFFFF",
  },
  duracionChipPersonalizada: {
    borderStyle: "dashed",
    borderWidth: 2,
    borderColor: "#10B981",
  },
  inputPersonalizadoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputPersonalizado: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
    textAlign: "center",
  },
  labelMinutos: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "500",
    marginLeft: 8,
  },
  duracionChipDisabled: {
    backgroundColor: "#F1F5F9",
    borderColor: "#E2E8F0",
    opacity: 0.5,
  },
  duracionTextDisabled: {
    color: "#9CA3AF",
  },
  resumenContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  resumenTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 8,
  },
  resumenHorarios: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 4,
  },
  resumenPrecio: {
    fontSize: 20,
    fontWeight: "700",
    color: "#10B981",
    marginBottom: 16,
  },
  continuarButton: {
    flexDirection: "row",
    backgroundColor: "#10B981",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  continuarButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  precioEspecial: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F59E0B",
    marginBottom: 8,
  },
});
