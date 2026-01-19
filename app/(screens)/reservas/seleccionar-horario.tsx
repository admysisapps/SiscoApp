import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import Toast from "@/components/Toast";
import { ConflictoHorarioModal } from "@/components/reservas/ConflictoHorarioModal";
import SeleccionarHorarioMinutos from "@/components/reservas/SeleccionarHorarioMinutos";
import SeleccionarHorarioBloques from "@/components/reservas/SeleccionarHorarioBloques";
import { reservaService } from "@/services/reservaService";
import { THEME } from "@/constants/theme";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

export default function SeleccionarHorarioScreen() {
  const {
    espacioId,
    espacioNombre,
    fechaSeleccionada,
    espacioCosto,
    tipoReserva,
    tiempoReserva,
    tiempoMaximoReserva,
    requiereAprobacion,
    espacioCompleto,
  } = useLocalSearchParams();

  const [espacio, setEspacio] = useState<any>(null);
  const [cargandoEspacio, setCargandoEspacio] = useState(true);

  const [conflictoModal, setConflictoModal] = useState<{
    visible: boolean;
    horarioSolicitado: any;
    conflicto: any;
    conflictos_adicionales?: any[];
    todas_reservas_dia?: any[];
    alternativas: any[];
  }>({
    visible: false,
    horarioSolicitado: null,
    conflicto: null,
    alternativas: [],
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

  const esPorMinutos = tipoReserva === "por_minutos";

  const obtenerEspacioAPI = useCallback(async () => {
    try {
      setCargandoEspacio(true);
      const response = await reservaService.obtenerEspacio(Number(espacioId));
      if (response?.success) {
        setEspacio(response.espacio);
      }
    } catch (error) {
      console.error("Error obteniendo espacio:", error);
      showToast("Error cargando datos del espacio", "error");
    } finally {
      setCargandoEspacio(false);
    }
  }, [espacioId, showToast]);

  useFocusEffect(
    useCallback(() => {
      if (espacioCompleto) {
        try {
          const espacioParsed = JSON.parse(espacioCompleto as string);
          setEspacio(espacioParsed);
          setCargandoEspacio(false);
        } catch (error) {
          console.error("Error parsing espacioCompleto:", error);
          obtenerEspacioAPI();
        }
      } else {
        obtenerEspacioAPI();
      }
    }, [espacioCompleto, obtenerEspacioAPI])
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons
            name="arrow-back"
            size={24}
            color={THEME.colors.header.title}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Seleccionar Horario</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.stepsIndicator}>
          {[1, 2, 3].map((stepNum) => (
            <View key={stepNum} style={styles.stepIndicatorContainer}>
              <View
                style={[
                  styles.stepCircle,
                  stepNum <= 2 && styles.stepCircleActive,
                ]}
              >
                <Text
                  style={[
                    styles.stepNumber,
                    stepNum <= 2 && styles.stepNumberActive,
                  ]}
                >
                  {stepNum}
                </Text>
              </View>
              {stepNum < 3 && <View style={styles.stepLine} />}
            </View>
          ))}
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.espacioNombre}>{espacioNombre}</Text>
          <Text style={styles.fechaSeleccionada}>
            {dayjs(fechaSeleccionada as string).format("dddd, DD [de] MMMM")}
          </Text>
          <Text style={styles.tiempoReserva}>
            • {tiempoReserva || 24}h antelación requerida
          </Text>
        </View>

        {cargandoEspacio ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.colors.success} />
            <Text style={styles.loadingText}>Cargando...</Text>
          </View>
        ) : esPorMinutos ? (
          <SeleccionarHorarioMinutos
            espacioId={espacioId as string}
            espacioNombre={espacioNombre as string}
            fechaSeleccionada={fechaSeleccionada as string}
            espacioCosto={espacioCosto as string}
            tiempoReserva={tiempoReserva as string}
            tiempoMaximoReserva={tiempoMaximoReserva as string}
            requiereAprobacion={requiereAprobacion as string}
            espacio={espacio}
            showToast={showToast}
            setConflictoModal={setConflictoModal}
          />
        ) : (
          <SeleccionarHorarioBloques
            espacioId={espacioId as string}
            espacioNombre={espacioNombre as string}
            fechaSeleccionada={fechaSeleccionada as string}
            espacioCosto={espacioCosto as string}
            tipoReserva={tipoReserva as string}
            tiempoReserva={tiempoReserva as string}
            requiereAprobacion={requiereAprobacion as string}
            tiempoMaximoReserva={Number(tiempoMaximoReserva)}
            espacio={espacio}
            showToast={showToast}
          />
        )}
      </ScrollView>

      <ConflictoHorarioModal
        visible={conflictoModal.visible}
        onClose={() => setConflictoModal({ ...conflictoModal, visible: false })}
        horarioSolicitado={
          conflictoModal.horarioSolicitado || {
            inicio: "00:00",
            fin: "00:00",
            duracion: 0,
          }
        }
        conflicto={
          conflictoModal.conflicto || {
            hora_inicio: "00:00",
            hora_fin: "00:00",
          }
        }
        conflictos_adicionales={conflictoModal.conflictos_adicionales || []}
        todas_reservas_dia={conflictoModal.todas_reservas_dia || []}
        alternativas={conflictoModal.alternativas || []}
        onSeleccionarAlternativa={(alternativa) => {
          if (!alternativa || !alternativa.inicio || !alternativa.fin) {
            showToast("Error con la alternativa seleccionada", "error");
            return;
          }

          try {
            setConflictoModal({ ...conflictoModal, visible: false });

            router.push({
              pathname: "/(screens)/reservas/confirmar-reserva" as any,
              params: {
                espacioId,
                espacioNombre,
                fechaSeleccionada,
                horaInicio: alternativa.inicio,
                horaFin: alternativa.fin,
                precioTotal: alternativa.precio || 0,
                tiempoReserva: tiempoReserva || 24,
                requiereAprobacion,
              },
            });
          } catch (error) {
            console.error("Error procesando alternativa:", error);
            showToast("Error procesando la alternativa", "error");
          }
        }}
      />

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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: THEME.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.colors.surfaceLight,
    borderRadius: THEME.borderRadius.md,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.header.title,
    flex: 1,
    textAlign: "center",
  },
  headerSpacer: { width: 40 },
  content: {
    flex: 1,
    padding: 16,
  },
  infoContainer: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  espacioNombre: {
    fontSize: 18,
    fontWeight: "700",
    color: THEME.colors.text.heading,
    marginBottom: 4,
  },
  fechaSeleccionada: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
  },
  tiempoReserva: {
    fontSize: 12,
    color: THEME.colors.warning,
    fontWeight: "500",
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: THEME.colors.text.heading,
    marginBottom: 16,
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
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: THEME.colors.text.secondary,
  },
  scrollContent: {
    paddingBottom: 20,
  },
});
