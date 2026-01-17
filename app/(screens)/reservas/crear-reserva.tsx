import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { THEME } from "@/constants/theme";
import { reservaService } from "@/services/reservaService";
import Toast from "@/components/Toast";
import dayjs from "dayjs";
import "dayjs/locale/es";
import ScreenHeader from "@/components/shared/ScreenHeader";

dayjs.locale("es");

// Configurar calendario en español
LocaleConfig.locales["es"] = {
  monthNames: [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ],
  monthNamesShort: [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ],
  dayNames: [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ],
  dayNamesShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
  today: "Hoy",
};
LocaleConfig.defaultLocale = "es";

interface Espacio {
  id: number;
  nombre: string;
  descripcion: string;
  estado: "activa" | "inactiva" | "mantenimiento";
  tipo_reserva: string;
  costo: number;
  capacidad_maxima: number;
  tiempo_reserva?: 6 | 12 | 24 | 48;
  imagen_nombre?: string;
}

export default function CrearReservaScreen() {
  const {
    espacioId,
    espacioNombre,
    espacioDescripcion,
    espacioCosto,
    capacidadMaxima,
    tipoReserva,
  } = useLocalSearchParams();
  const [step] = useState(1);
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [espacioSeleccionado, setEspacioSeleccionado] =
    useState<Espacio | null>(null);
  const [fechaSeleccionada, setFechaSeleccionada] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [inicializado, setInicializado] = useState(false);
  const [cargandoEspacios, setCargandoEspacios] = useState(true);
  const [diasDisponibles, setDiasDisponibles] = useState<number[]>([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [horariosEspacio, setHorariosEspacio] = useState<any[]>([]);
  const [espacioCompleto, setEspacioCompleto] = useState<any>(null);
  const scrollViewRef = React.useRef<ScrollView>(null);
  const lastSelectedEspacioId = useRef<number | null>(null);

  const skeletonAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(skeletonAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(skeletonAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [skeletonAnim]);

  const skeletonOpacity = skeletonAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const [toast, setToast] = useState({
    visible: false,
    message: "",
    type: "success" as "success" | "error" | "warning",
  });

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "warning" = "success") => {
      setToast({ visible: true, message, type });
    },
    []
  );

  const hideToast = useCallback(() => {
    setToast({ visible: false, message: "", type: "success" });
  }, []);

  const handleBackPress = useCallback(() => {
    router.back();
  }, []);

  const todayDate = useMemo(() => new Date().toISOString().split("T")[0], []);

  const cargarEspacios = React.useCallback(async () => {
    try {
      setCargandoEspacios(true);
      const response = await reservaService.listarEspaciosFresh({
        solo_activos: true,
      });

      if (response?.success) {
        setEspacios(response.espacios || []);
      } else {
        showToast(
          "No pudimos cargar las zonas comunes. Inténtalo nuevamente.",
          "error"
        );
      }
    } catch (error) {
      console.error("Error cargando espacios:", error);
      showToast(
        "Problema de conexión. Verifica tu internet e inténtalo nuevamente.",
        "error"
      );
    } finally {
      setCargandoEspacios(false);
      setInicializado(true);
    }
  }, [showToast]);

  const handleSeleccionarEspacio = React.useCallback(
    async (espacio: Espacio) => {
      // Evitar llamadas duplicadas
      if (lastSelectedEspacioId.current === espacio.id) {
        return;
      }

      lastSelectedEspacioId.current = espacio.id;
      setEspacioSeleccionado(espacio);
      setCargandoHorarios(true);
      setFechaSeleccionada(""); // Limpiar fecha seleccionada

      try {
        const response = await reservaService.obtenerEspacio(espacio.id);

        if (response?.success && response.espacio?.horarios) {
          const horariosActivos = response.espacio.horarios.filter(
            (h: any) => h.activo
          );
          const diasActivos = horariosActivos.map((h: any) => h.dia_semana);
          setDiasDisponibles(diasActivos);
          setHorariosEspacio(horariosActivos);
          setEspacioCompleto(response.espacio);

          // Actualizar tiempo_reserva del espacio
          if (response.espacio.tiempo_reserva) {
            setEspacioSeleccionado((prev) =>
              prev
                ? {
                    ...prev,
                    tiempo_reserva: response.espacio.tiempo_reserva,
                  }
                : null
            );
          }
        }
      } catch (error) {
        console.error("Error obteniendo horarios del espacio:", error);
        showToast("Error al cargar horarios del espacio", "error");
      } finally {
        setCargandoHorarios(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    cargarEspacios();
  }, [cargarEspacios]);

  // Efecto separado para espacio preseleccionado
  useEffect(() => {
    if (espacioId && espacioNombre && espacios.length > 0) {
      const espacioPreseleccionado: Espacio = {
        id: Number(espacioId),
        nombre: Array.isArray(espacioNombre) ? espacioNombre[0] : espacioNombre,
        descripcion: Array.isArray(espacioDescripcion)
          ? espacioDescripcion[0]
          : espacioDescripcion || "",
        costo: Number(espacioCosto) || 0,
        capacidad_maxima: Number(capacidadMaxima) || 0,
        estado: "activa",
        tipo_reserva:
          (Array.isArray(tipoReserva) ? tipoReserva[0] : tipoReserva) ||
          "por_horas",
        tiempo_reserva: 24,
        imagen_nombre: undefined,
      };

      // Solo establecer si no hay espacio seleccionado ya y no está cargando
      if (
        !espacioSeleccionado ||
        (espacioSeleccionado.id !== Number(espacioId) && !cargandoHorarios)
      ) {
        setEspacioSeleccionado(espacioPreseleccionado);
        handleSeleccionarEspacio(espacioPreseleccionado);
      }
    }
  }, [
    espacioId,
    espacioNombre,
    espacioDescripcion,
    espacioCosto,
    capacidadMaxima,
    tipoReserva,
    espacios.length,
    espacioSeleccionado,
    cargandoHorarios,
    handleSeleccionarEspacio,
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    await cargarEspacios();
    setRefreshing(false);
  };

  const handleDateSelect = (day: any) => {
    // Asegurar formato YYYY-MM-DD sin conversión de zona horaria
    const fechaLocal = day.dateString; // Ya viene en formato YYYY-MM-DD
    setFechaSeleccionada(fechaLocal);

    // Scroll inmediato hacia abajo para mostrar el botón
    scrollViewRef.current?.scrollTo({ x: 0, y: 400, animated: true });
  };

  const getMarkedDates = useMemo(() => {
    const marked: any = {};

    if (fechaSeleccionada) {
      marked[fechaSeleccionada] = {
        selected: true,
        selectedColor: THEME.colors.success,
        selectedTextColor: "white",
      };
    }

    return marked;
  }, [fechaSeleccionada]);

  const isDayDisabled = useCallback(
    (day: any) => {
      const today = todayDate;

      // Solo deshabilitar fechas pasadas (permitir hoy si hay horarios válidos)
      if (day.dateString < today) {
        return true;
      }

      // Verificar días disponibles del espacio
      if (diasDisponibles.length === 0) return false;

      const [year, month, dayNum] = day.dateString.split("-").map(Number);
      const fechaLocal = new Date(year, month - 1, dayNum);
      const dayOfWeek = fechaLocal.getDay();
      const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;

      return !diasDisponibles.includes(adjustedDay);
    },
    [todayDate, diasDisponibles]
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.stepsIndicator}>
          {[1, 2, 3].map((stepNum) => (
            <View key={stepNum} style={styles.stepIndicatorContainer}>
              <View
                style={[
                  styles.stepCircle,
                  step >= stepNum && styles.stepCircleActive,
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    step >= stepNum && styles.stepNumberActive,
                  ]}
                >
                  {stepNum}
                </Text>
              </View>
              {stepNum < 3 && <View style={styles.stepLine} />}
            </View>
          ))}
        </View>

        <View style={styles.headerSection}>
          <Text style={styles.mainTitle}>
            {espacioSeleccionado
              ? "¿Cuándo quieres reservar?"
              : "¿Qué zona quieres reservar?"}
          </Text>
          <Text style={styles.subtitle}>
            {espacioSeleccionado
              ? `Selecciona la fecha para ${espacioSeleccionado.nombre}`
              : "Selecciona la zona común a reservar."}
          </Text>
        </View>
        <View style={styles.filtrosContainer}>
          {cargandoEspacios ? (
            // Skeleton loading
            [1, 2, 3].map((i) => (
              <Animated.View
                key={i}
                style={[styles.skeletonChip, { opacity: skeletonOpacity }]}
              />
            ))
          ) : espacios.length === 0 && inicializado ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons
                name="park"
                size={80}
                color={THEME.colors.text.secondary}
              />
              <Text style={styles.emptyTitle}>
                No hay zonas comunes configuradas
              </Text>
              <Text style={styles.emptySubtitle}>
                Aún no se han creado Zonas comunes para reservar. Contacta con
                la administración.
              </Text>
            </View>
          ) : (
            espacios.map((espacio) => (
              <TouchableOpacity
                key={espacio.id}
                style={[
                  styles.filtroChip,
                  espacioSeleccionado?.id === espacio.id &&
                    styles.filtroChipSelected,
                ]}
                onPress={() => handleSeleccionarEspacio(espacio)}
              >
                <Text
                  style={[
                    styles.filtroText,
                    espacioSeleccionado?.id === espacio.id &&
                      styles.filtroTextSelected,
                  ]}
                >
                  {espacio.nombre}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {espacioSeleccionado && (
          <View style={styles.selectedEspacioContainer}>
            <View style={styles.espacioInfo}>
              <Text style={styles.espacioNombre}>
                {espacioSeleccionado.nombre}
              </Text>

              <View style={styles.espacioMeta}>
                <Text style={styles.espacioPrecio}>
                  ${espacioSeleccionado.costo.toLocaleString()}
                  {espacioSeleccionado.tipo_reserva === "por_minutos"
                    ? "/min"
                    : espacioSeleccionado.tipo_reserva === "bloque_fijo"
                      ? "/bloque"
                      : "/hora"}
                </Text>
                <Text style={styles.espacioCapacidad}>
                  • {espacioSeleccionado.capacidad_maxima} personas
                </Text>
                <Text style={styles.espacioTiempo}>
                  • {espacioSeleccionado.tiempo_reserva || 24}h antelación
                </Text>
              </View>
            </View>

            {/* Calendario */}
            <View style={styles.calendarSection}>
              <Text style={styles.sectionTitle}>¿Cuándo quieres reservar?</Text>
              {cargandoHorarios ? (
                <View style={styles.loadingCalendar}>
                  <ActivityIndicator
                    size="large"
                    color={THEME.colors.success}
                  />
                </View>
              ) : (
                <Calendar
                  onDayPress={(day) => {
                    if (!isDayDisabled(day)) {
                      handleDateSelect(day);
                    }
                  }}
                  markedDates={getMarkedDates}
                  minDate={todayDate}
                  firstDay={1}
                  disableAllTouchEventsForDisabledDays={true}
                  theme={{
                    selectedDayBackgroundColor: THEME.colors.success,
                    todayTextColor: THEME.colors.success,
                    arrowColor: THEME.colors.success,
                    monthTextColor: THEME.colors.text.heading,
                    textDayFontWeight: "600",
                    textMonthFontWeight: "700",
                    textDayHeaderFontWeight: "600",
                    textDayFontSize: 16,
                    textMonthFontSize: 18,
                    textDisabledColor: THEME.colors.text.disabled,
                  }}
                  dayComponent={({ date, state }) => {
                    if (!date) return null;
                    const isDisabled = isDayDisabled(date);
                    const isSelected = fechaSeleccionada === date?.dateString;

                    return (
                      <TouchableOpacity
                        style={[
                          styles.dayContainer,
                          isSelected && styles.selectedDay,
                          isDisabled && styles.disabledDay,
                        ]}
                        onPress={() =>
                          !isDisabled && date && handleDateSelect(date)
                        }
                        disabled={isDisabled}
                      >
                        <Text
                          style={[
                            styles.dayText,
                            isSelected && styles.selectedDayText,
                            isDisabled && styles.disabledDayText,
                          ]}
                        >
                          {date?.day}
                        </Text>
                      </TouchableOpacity>
                    );
                  }}
                />
              )}
            </View>

            {fechaSeleccionada && (
              <View style={styles.selectedDateContainer}>
                <View style={styles.selectedDateHeader}>
                  <Ionicons
                    name="calendar"
                    size={20}
                    color={THEME.colors.success}
                  />
                  <Text style={styles.selectedDateText}>
                    {dayjs(fechaSeleccionada).format("dddd, DD [de] MMMM")}
                  </Text>
                </View>

                {/* Mostrar horario del día seleccionado */}
                {(() => {
                  // CORREGIR: Usar fecha local sin conversión de zona horaria
                  const [year, month, dayNum] = fechaSeleccionada
                    .split("-")
                    .map(Number);
                  const fechaLocal = new Date(year, month - 1, dayNum);
                  const dayOfWeek = fechaLocal.getDay();
                  const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
                  const horarioDelDia = horariosEspacio.find(
                    (h) => h.dia_semana === adjustedDay
                  );

                  if (horarioDelDia) {
                    return (
                      <View style={styles.horarioInfo}>
                        <Ionicons name="time" size={16} color="#64748B" />
                        <Text style={styles.horarioText}>
                          Horario: {horarioDelDia.hora_inicio} -{" "}
                          {horarioDelDia.hora_fin}
                        </Text>
                      </View>
                    );
                  }
                  return null;
                })()}

                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => {
                    router.push({
                      pathname:
                        "/(screens)/reservas/seleccionar-horario" as any,
                      params: {
                        espacioId: espacioSeleccionado.id,
                        espacioNombre: espacioSeleccionado.nombre,
                        espacioDescripcion: espacioSeleccionado.descripcion,
                        espacioCosto: espacioSeleccionado.costo,
                        tipoReserva: espacioSeleccionado.tipo_reserva,
                        tiempoReserva: espacioSeleccionado.tiempo_reserva || 24,
                        tiempoMaximoReserva:
                          espacioCompleto?.tiempo_maximo_reserva || 240,
                        fechaSeleccionada,
                        requiereAprobacion:
                          espacioCompleto?.requiere_aprobacion?.toString() ||
                          "false",
                        espacioCompleto: JSON.stringify(espacioCompleto),
                      },
                    });
                  }}
                >
                  <Text style={styles.continueButtonText}>
                    Seleccionar horario
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader title="Nueva Reserva" onBackPress={handleBackPress} />

      <View style={styles.content}>{renderStep1()}</View>

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
    backgroundColor: THEME.colors.background,
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
    shadowColor: THEME.colors.success,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
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
  content: {
    flex: 1,
    padding: 16,
  },
  stepContainer: { flex: 1 },
  headerSection: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: THEME.colors.text.heading,
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
  },
  filtrosContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 20,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: THEME.colors.text.heading,
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  filtroChip: {
    backgroundColor: THEME.colors.surface,
    borderWidth: 1,
    borderColor: THEME.colors.border,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  filtroChipSelected: {
    backgroundColor: THEME.colors.success,
    borderColor: THEME.colors.success,
    shadowColor: THEME.colors.success,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  filtroText: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.text.secondary,
  },
  filtroTextSelected: {
    color: THEME.colors.text.inverse,
  },
  skeletonChip: {
    backgroundColor: THEME.colors.surfaceLight,
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 40,
    width: 120,
  },
  selectedEspacioContainer: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 16,
    padding: 20,
  },
  espacioInfo: {
    marginBottom: 16,
  },
  espacioNombre: {
    fontSize: 20,
    fontWeight: "700",
    color: THEME.colors.text.heading,
    marginBottom: 6,
  },
  espacioDescripcion: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    lineHeight: 20,
    marginBottom: 12,
  },

  espacioMeta: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  espacioPrecio: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.colors.success,
    marginRight: 12,
  },
  espacioCapacidad: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
  },
  espacioTiempo: {
    fontSize: 14,
    color: THEME.colors.warning,
    fontWeight: "500",
  },
  calendarSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.colors.text.heading,
    marginBottom: 12,
  },
  selectedDateContainer: {
    backgroundColor: THEME.colors.background,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: THEME.colors.border,
  },
  selectedDateHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  selectedDateText: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.text.heading,
    flex: 1,
  },
  continueButton: {
    flexDirection: "row",
    backgroundColor: THEME.colors.success,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: THEME.colors.success,
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
    gap: 8,
  },
  continueButtonText: {
    color: THEME.colors.text.inverse,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  dayContainer: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  selectedDay: {
    backgroundColor: THEME.colors.success,
  },
  disabledDay: {
    backgroundColor: THEME.colors.surfaceLight,
  },
  dayText: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.text.heading,
  },
  selectedDayText: {
    color: THEME.colors.text.inverse,
  },
  disabledDayText: {
    color: THEME.colors.text.disabled,
  },
  loadingCalendar: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  horarioInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 6,
  },
  horarioText: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
  },
});
