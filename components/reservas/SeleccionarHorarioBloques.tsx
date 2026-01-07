import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { reservaService } from "@/services/reservaService";

interface Props {
  espacioId: string;
  espacioNombre: string;
  fechaSeleccionada: string;
  espacioCosto: string;
  tipoReserva: string;
  tiempoReserva: string;
  requiereAprobacion: string;
  tiempoMaximoReserva: number;
  espacio: any;
  showToast: (message: string, type?: "success" | "error" | "warning") => void;
}

export default function SeleccionarHorarioBloques({
  espacioId,
  espacioNombre,
  fechaSeleccionada,
  espacioCosto,
  tipoReserva,
  tiempoReserva,
  requiereAprobacion,
  tiempoMaximoReserva,
  espacio,
  showToast,
}: Props) {
  const [horariosSeleccionados, setHorariosSeleccionados] = useState<string[]>(
    []
  );
  const [estadosHorarios, setEstadosHorarios] = useState<{
    [key: string]: string;
  }>({});
  const [estadosHorariosSiguienteDia, setEstadosHorariosSiguienteDia] =
    useState<{
      [key: string]: string;
    }>({});
  const [loading, setLoading] = useState(true);

  const cargarHorariosDelDia = useCallback(async () => {
    try {
      setLoading(true);
      const response = await reservaService.obtenerHorariosDia({
        espacio_id: Number(espacioId),
        fecha_reserva: fechaSeleccionada,
        tipo_reserva: tipoReserva,
      });

      if (response?.success) {
        setEstadosHorarios(response.horarios);
        setEstadosHorariosSiguienteDia({});
      } else if (
        !response?.success &&
        response?.error === "Espacio no disponible"
      ) {
        showToast(
          "Este espacio está temporalmente en mantenimiento.",
          "warning"
        );
        setTimeout(() => router.back(), 3000);
      } else {
        showToast("Error cargando horarios", "error");
      }
    } catch {
      showToast("Error cargando horarios", "error");
    } finally {
      setLoading(false);
    }
  }, [espacioId, fechaSeleccionada, tipoReserva, showToast]);

  useEffect(() => {
    cargarHorariosDelDia();
  }, [cargarHorariosDelDia]);

  useEffect(() => {
    const tiene23Seleccionado = horariosSeleccionados.includes("23:00");
    const tiene23Disponible = estadosHorarios["23:00"] === "disponible";

    if (
      tiene23Seleccionado &&
      tiene23Disponible &&
      Object.keys(estadosHorariosSiguienteDia).length === 0
    ) {
      const cargarHorariosSiguienteDia = async () => {
        try {
          const fechaSiguiente = new Date(fechaSeleccionada);
          fechaSiguiente.setDate(fechaSiguiente.getDate() + 1);
          const fechaSiguienteStr = fechaSiguiente.toISOString().split("T")[0];

          const responseSiguiente = await reservaService.obtenerHorariosDia({
            espacio_id: Number(espacioId),
            fecha_reserva: fechaSiguienteStr,
            tipo_reserva: tipoReserva,
          });

          if (responseSiguiente?.success) {
            const horariosDelDia = Object.keys(responseSiguiente.horarios);
            const primeraHora =
              horariosDelDia.length > 0
                ? Math.min(
                    ...horariosDelDia.map((h) => parseInt(h.split(":")[0]))
                  )
                : 6;

            const horariosMadrugada: { [key: string]: string } = {};
            for (let hora = 0; hora < primeraHora; hora++) {
              horariosMadrugada[`${hora.toString().padStart(2, "0")}:00`] =
                "disponible";
            }

            setEstadosHorariosSiguienteDia(horariosMadrugada);
          } else {
            const horariosMadrugadaDefault: { [key: string]: string } = {};
            for (let hora = 0; hora < 6; hora++) {
              horariosMadrugadaDefault[
                `${hora.toString().padStart(2, "0")}:00`
              ] = "disponible";
            }
            setEstadosHorariosSiguienteDia(horariosMadrugadaDefault);
          }
        } catch (error) {
          console.error("Error cargando horarios del día siguiente:", error);
        }
      };

      cargarHorariosSiguienteDia();
    }
  }, [
    horariosSeleccionados,
    estadosHorarios,
    fechaSeleccionada,
    espacioId,
    tipoReserva,
    estadosHorariosSiguienteDia,
  ]);

  const generarHorarios = () => {
    const todosLosHorarios = Object.keys(estadosHorarios).sort();
    const tiempoAntelacion = Number(tiempoReserva);
    const ahora = new Date();

    let horariosValidos = todosLosHorarios.filter((hora) => {
      const [horaNum] = hora.split(":").map(Number);
      const [year, month, day] = fechaSeleccionada.split("-").map(Number);
      const fechaHoraReserva = new Date(year, month - 1, day, horaNum, 0);
      const tiempoMinimoRequerido = new Date(
        ahora.getTime() + tiempoAntelacion * 60 * 60 * 1000
      );
      return fechaHoraReserva >= tiempoMinimoRequerido;
    });

    const tiene23Seleccionado = horariosSeleccionados.includes("23:00");
    const tiene23Disponible = estadosHorarios["23:00"] === "disponible";

    if (tiene23Seleccionado && tiene23Disponible) {
      const horariosSiguienteDia = Object.keys(estadosHorariosSiguienteDia).map(
        (hora) => `next_${hora}`
      );
      horariosValidos = [...horariosValidos, ...horariosSiguienteDia];
    }

    return horariosValidos;
  };

  const handleSeleccionarHorario = (hora: string) => {
    const esHorarioSiguienteDia = hora.startsWith("next_");
    const horaReal = esHorarioSiguienteDia ? hora.replace("next_", "") : hora;
    const estado = esHorarioSiguienteDia
      ? estadosHorariosSiguienteDia[horaReal]
      : estadosHorarios[hora];

    if (estado === "ocupado") {
      showToast("Este horario no está disponible.", "error");
      return;
    }
    if (estado === "revision") {
      showToast("Este horario está siendo revisado.", "warning");
      return;
    }
    if (estado === "disponible") {
      if (horariosSeleccionados.includes(hora)) {
        // Si se deselecciona 23:00, quitar también todos los horarios del día siguiente
        if (hora === "23:00") {
          setHorariosSeleccionados((prev) =>
            prev.filter((h) => !h.startsWith("next_") && h !== hora)
          );
        } else {
          setHorariosSeleccionados((prev) => prev.filter((h) => h !== hora));
        }
      } else {
        // Validar tiempo máximo antes de agregar (solo para reservas que no sean bloque_fijo)
        if (tipoReserva !== "bloque_fijo") {
          const nuevosHorarios = [...horariosSeleccionados, hora];
          const tiempoMaximoHoras = Math.floor(tiempoMaximoReserva / 60); // Convertir minutos a horas

          if (nuevosHorarios.length > tiempoMaximoHoras) {
            showToast(
              `Máximo ${tiempoMaximoHoras} horas por reserva.`,
              "warning"
            );
            return;
          }
        }

        setHorariosSeleccionados((prev) => [...prev, hora].sort());
      }
    }
  };

  const getEstiloHorario = (hora: string) => {
    const esHorarioSiguienteDia = hora.startsWith("next_");
    const horaReal = esHorarioSiguienteDia ? hora.replace("next_", "") : hora;
    const estado = esHorarioSiguienteDia
      ? estadosHorariosSiguienteDia[horaReal]
      : estadosHorarios[hora];
    const seleccionado = horariosSeleccionados.includes(hora);
    if (seleccionado) return styles.horarioSeleccionado;
    if (estado === "ocupado") return styles.horarioOcupado;
    if (estado === "revision") return styles.horarioRevision;
    if (estado === "disponible") return styles.horarioDisponible;
    return styles.horarioDefault;
  };

  const getTextoEstado = (hora: string) => {
    const esHorarioSiguienteDia = hora.startsWith("next_");
    const horaReal = esHorarioSiguienteDia ? hora.replace("next_", "") : hora;
    const estado = esHorarioSiguienteDia
      ? estadosHorariosSiguienteDia[horaReal]
      : estadosHorarios[hora];
    if (estado === "ocupado") return "Ocupado";
    if (estado === "revision") return "En revisión";
    if (estado === "disponible") return "Disponible";
    return "Cargando...";
  };

  const getTextoHorario = (hora: string) => {
    const esHorarioSiguienteDia = hora.startsWith("next_");
    const horaReal = esHorarioSiguienteDia ? hora.replace("next_", "") : hora;

    if (tipoReserva === "bloque_fijo" && espacio?.duracion_bloque) {
      const [h, m] = horaReal.split(":").map(Number);
      const inicioMinutos = h * 60 + m;
      const finMinutos = inicioMinutos + espacio.duracion_bloque;
      const horaFin = Math.floor(finMinutos / 60);
      const minutosFin = finMinutos % 60;

      return `${horaReal} - ${horaFin.toString().padStart(2, "0")}:${minutosFin.toString().padStart(2, "0")}`;
    }

    return horaReal;
  };

  const obtenerPrecioPorDia = () => {
    if (!espacio?.horarios) return Number(espacioCosto);

    const [year, month, dayNum] = fechaSeleccionada.split("-").map(Number);
    const fechaReserva = new Date(year, month - 1, dayNum);
    const diaSemana = fechaReserva.getDay() === 0 ? 7 : fechaReserva.getDay();

    const horarioDelDia = espacio.horarios.find(
      (h: any) => h.dia_semana === diaSemana
    );
    return horarioDelDia?.precio_especial || Number(espacioCosto);
  };

  const calcularPrecioTotal = () => {
    const precioPorBloque = obtenerPrecioPorDia();
    return horariosSeleccionados.length * precioPorBloque;
  };

  const formatearFecha = (fecha: string) => {
    const date = new Date(fecha);
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (generarHorarios().length === 0) {
    return (
      <View style={styles.emptyStateContainer}>
        <Ionicons name="time-outline" size={48} color="#9CA3AF" />
        <Text style={styles.emptyStateTitle}>No hay horarios disponibles</Text>
        <Text style={styles.emptyStateMessage}>
          Debes reservar con al menos {tiempoReserva || 24} horas de antelación.
        </Text>
      </View>
    );
  }

  const horariosDiaActual = generarHorarios().filter(
    (h) => !h.startsWith("next_")
  );
  const horariosDiaSiguiente = generarHorarios().filter((h) =>
    h.startsWith("next_")
  );
  const fechaSiguiente = new Date(fechaSeleccionada);
  fechaSiguiente.setDate(fechaSiguiente.getDate() + 1);
  const fechaSiguienteStr = fechaSiguiente.toISOString().split("T")[0];

  return (
    <>
      <Text style={styles.sectionTitle}>Horarios disponibles</Text>
      <View style={styles.horariosGrid}>
        {horariosDiaActual.map((hora) => (
          <TouchableOpacity
            key={hora}
            style={[styles.horarioButton, getEstiloHorario(hora)]}
            onPress={() => handleSeleccionarHorario(hora)}
          >
            <Text style={styles.horarioHora}>{getTextoHorario(hora)}</Text>
            <Text style={styles.horarioEstado}>{getTextoEstado(hora)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {horariosDiaSiguiente.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>
            {formatearFecha(fechaSiguienteStr)}
          </Text>
          <View style={styles.horariosGrid}>
            {horariosDiaSiguiente.map((hora) => (
              <TouchableOpacity
                key={hora}
                style={[styles.horarioButton, getEstiloHorario(hora)]}
                onPress={() => handleSeleccionarHorario(hora)}
              >
                <Text style={styles.horarioHora}>{getTextoHorario(hora)}</Text>
                <Text style={styles.horarioEstado}>{getTextoEstado(hora)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {horariosSeleccionados.length > 0 && (
        <View style={styles.resumenContainer}>
          <Text style={styles.resumenTitle}>Resumen de reserva</Text>
          <Text style={styles.resumenHorarios}>
            {horariosSeleccionados.length} hora
            {horariosSeleccionados.length > 1 ? "s" : ""} seleccionada
            {horariosSeleccionados.length > 1 ? "s" : ""}
          </Text>
          {obtenerPrecioPorDia() !== Number(espacioCosto) && (
            <Text style={styles.precioEspecial}>
              Precio especial del día: ${obtenerPrecioPorDia().toLocaleString()}
            </Text>
          )}
          <Text style={styles.resumenPrecio}>
            Total: ${calcularPrecioTotal().toLocaleString()}
          </Text>
          <TouchableOpacity
            style={styles.continuarButton}
            onPress={() => {
              const primeraHora = horariosSeleccionados[0];
              const ultimaHora =
                horariosSeleccionados[horariosSeleccionados.length - 1];

              // Limpiar prefijo 'next_' si existe
              const ultimaHoraLimpia = ultimaHora.startsWith("next_")
                ? ultimaHora.replace("next_", "")
                : ultimaHora;

              const horaFin =
                tipoReserva === "bloque_fijo"
                  ? (() => {
                      const [hora] = ultimaHoraLimpia.split(":").map(Number);
                      const duracionHoras = 2;
                      let horaFinCalculada = hora + duracionHoras;
                      if (horaFinCalculada >= 24) {
                        horaFinCalculada = horaFinCalculada - 24;
                      }
                      return `${horaFinCalculada.toString().padStart(2, "0")}:00`;
                    })()
                  : (() => {
                      const [hora] = ultimaHoraLimpia.split(":").map(Number);
                      let horaFinCalculada = hora + 1;
                      if (horaFinCalculada >= 24) {
                        horaFinCalculada = horaFinCalculada - 24;
                      }
                      return `${horaFinCalculada.toString().padStart(2, "0")}:00`;
                    })();

              // Limpiar prefijo 'next_' de la primera hora también
              const primeraHoraLimpia = primeraHora.startsWith("next_")
                ? primeraHora.replace("next_", "")
                : primeraHora;

              router.push({
                pathname: "/(screens)/reservas/confirmar-reserva" as any,
                params: {
                  espacioId,
                  espacioNombre,
                  fechaSeleccionada,
                  horaInicio: primeraHoraLimpia,
                  horaFin: horaFin,
                  horarios: horariosSeleccionados
                    .map((h) =>
                      h.startsWith("next_")
                        ? h.replace("next_", "") + " (+1 día)"
                        : h
                    )
                    .join(", "),
                  precioTotal: calcularPrecioTotal(),
                  tiempoReserva: tiempoReserva || 24,
                  requiereAprobacion,
                  tipoReserva,
                },
              });
            }}
          >
            <Text style={styles.continuarButtonText}>Continuar</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </TouchableOpacity>
        </View>
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
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  horariosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  horarioButton: {
    width: "30%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E2E8F0",
  },
  horarioDefault: {
    borderColor: "#E2E8F0",
  },
  horarioDisponible: {
    borderColor: "#10B981",
    backgroundColor: "#ECFDF5",
  },
  horarioOcupado: {
    borderColor: "#EF4444",
    backgroundColor: "#FEF2F2",
  },
  horarioRevision: {
    borderColor: "#F59E0B",
    backgroundColor: "#FFFBEB",
  },
  horarioSeleccionado: {
    borderColor: "#10B981",
    backgroundColor: "#10B981",
  },
  horarioHora: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
    textAlign: "center",
  },
  horarioEstado: {
    fontSize: 10,
    color: "#64748B",
    textAlign: "center",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateMessage: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  resumenContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  resumenTitle: {
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: "600",
    color: "#10B981",
    marginBottom: 16,
  },
  precioEspecial: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F59E0B",
    marginBottom: 8,
  },
  continuarButton: {
    backgroundColor: "#10B981",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  continuarButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});
