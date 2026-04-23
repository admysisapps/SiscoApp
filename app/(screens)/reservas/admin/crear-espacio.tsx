import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { THEME } from "@/constants/theme";
import { reservaService } from "@/services/reservaService";
import { s3Service } from "@/services/s3Service";
import Toast from "@/components/Toast";
import { useProject } from "@/contexts/ProjectContext";
import DiaHorarioItem from "@/components/zonasComunes/DiaHorarioItem";
import dayjs from "dayjs";
import ScreenHeader from "@/components/shared/ScreenHeader";
import { Button } from "@/components/reacticx/button";
import { useCargarEspacio } from "@/hooks/useCargarEspacio";
import { SelectField, SelectOption } from "@/components/reservas/SelectField";

const OPCIONES_ESTADO: SelectOption<"activa" | "inactiva" | "mantenimiento">[] =
  [
    {
      label: "Activa (disponible para reservas)",
      value: "activa",
      icon: "checkmark-circle-outline",
    },
    {
      label: "Inactiva (no disponible)",
      value: "inactiva",
      icon: "close-circle-outline",
    },
    {
      label: "En Mantenimiento",
      value: "mantenimiento",
      icon: "construct-outline",
    },
  ];

const OPCIONES_TIPO_RESERVA: SelectOption<
  "por_minutos" | "por_horas" | "bloque_fijo" | "gratuito"
>[] = [
  {
    label: "Por Minutos (máxima precisión)",
    value: "por_minutos",
    icon: "timer-outline",
  },
  { label: "Por Horas (flexible)", value: "por_horas", icon: "time-outline" },
  {
    label: "Bloque Fijo (ej: 4 horas)",
    value: "bloque_fijo",
    icon: "calendar-outline",
  },
  { label: "Gratuito (sin costo)", value: "gratuito", icon: "gift-outline" },
];

const OPCIONES_ANTELACION: SelectOption[] = [
  { label: "6 horas de antelación", value: "6" },
  { label: "12 horas de antelación", value: "12" },
  { label: "24 horas de antelación (1 día)", value: "24" },
  { label: "48 horas de antelación (2 días)", value: "48" },
];

export default function CrearEspacioScreen() {
  const { id } = useLocalSearchParams();
  const isEditMode = !!id;
  const [loading, setLoading] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showTimePicker, setShowTimePicker] = useState<{
    dia: number;
    tipo: "inicio" | "fin";
  } | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [toast, setToast] = useState<{
    visible: boolean;
    message: string;
    type: "success" | "error" | "warning";
  }>({ visible: false, message: "", type: "success" });

  const showToast = useCallback(
    (message: string, type: "success" | "error" | "warning" = "success") => {
      setToast({ visible: true, message, type });
    },
    []
  );

  const {
    formData,
    setFormData,
    configuracion,
    setConfiguracion,
    horariosSemanales,
    setHorariosSemanales,
    imagen,
    setImagen,
    imagenUrl,
    setImagenUrl,
    imagenEliminada,
    setImagenEliminada,
    imagenNombreOriginal,
  } = useCargarEspacio({ id, isEditMode, showToast });

  const { selectedProject } = useProject();
  const scrollViewRef = useRef<ScrollView>(null);

  // Validaciones divididas en funciones específicas
  const validateBasicInfo = (errors: { [key: string]: string }) => {
    if (!formData.nombre.trim()) {
      errors.nombre = "Ingresa un nombre para la zona común (ej: Salón Social)";
    }
    if (!formData.descripcion.trim()) {
      errors.descripcion =
        "Describe las características y servicios de la zona";
    }
    if (parseInt(formData.capacidad_maxima) < 1) {
      errors.capacidad_maxima =
        "Indica cuántas personas pueden usar la zona al mismo tiempo";
    }
  };

  const validateCosts = (errors: { [key: string]: string }) => {
    if (configuracion.tipo_reserva !== "gratuito") {
      if (!formData.costo.trim()) {
        errors.costo = "Ingresa el precio que cobrarás por usar esta zona";
      } else if (isNaN(Number(formData.costo))) {
        errors.costo = "El precio debe ser un número (ej: 15000)";
      } else if (Number(formData.costo) <= 0) {
        errors.costo = "El precio debe ser mayor a cero";
      }
    }
  };

  const validateSchedules = (errors: { [key: string]: string }) => {
    const hayDiaActivo = Object.values(horariosSemanales).some(
      (horario) => horario.activo
    );
    if (!hayDiaActivo) {
      errors.dias =
        "Activa al menos un día para que los usuarios puedan reservar";
    }

    Object.entries(horariosSemanales).forEach(([dia, horario]) => {
      if (horario.activo && horario.hora_inicio >= horario.hora_fin) {
        const nombreDia = getDiaNombre(parseInt(dia));
        errors[`horario_${dia}`] =
          `El horario de ${nombreDia} no es válido. La hora de cierre debe ser después de la apertura`;
      }
    });
  };

  const validateMaintenance = (errors: { [key: string]: string }) => {
    if (
      configuracion.estado === "mantenimiento" &&
      !configuracion.fecha_mantenimiento.trim()
    ) {
      errors.fecha_mantenimiento =
        "Selecciona hasta cuándo estará en mantenimiento la zona";
    }
  };

  const validateReservationLimits = (errors: { [key: string]: string }) => {
    if (
      configuracion.tipo_reserva === "por_minutos" ||
      configuracion.tipo_reserva === "por_horas"
    ) {
      const tiempoMin = parseInt(formData.tiempo_minimo_reserva);
      const tiempoMax = parseInt(formData.tiempo_maximo_reserva);

      if (isNaN(tiempoMin) || tiempoMin < 15) {
        errors.tiempo_minimo =
          "El tiempo mínimo debe ser al menos 15 minutos para evitar reservas muy cortas";
      }
      if (isNaN(tiempoMax) || tiempoMax < 15) {
        errors.tiempo_maximo = "El tiempo máximo debe ser al menos 15 minutos";
      }
      if (!isNaN(tiempoMin) && !isNaN(tiempoMax) && tiempoMax <= tiempoMin) {
        errors.tiempo_maximo =
          "El tiempo máximo debe ser mayor que el mínimo para dar flexibilidad a los usuarios";
      }

      // Validaciones específicas por tipo
      if (configuracion.tipo_reserva === "por_minutos" && tiempoMin < 15) {
        errors.tiempo_minimo =
          "Para reservas por minutos, recomendamos mínimo 15 minutos";
      }
      if (configuracion.tipo_reserva === "por_horas" && tiempoMin < 60) {
        errors.tiempo_minimo =
          "Para reservas por horas, el mínimo debe ser 1 hora (60 minutos)";
      }
    }
  };

  const scrollToFirstError = (errors: { [key: string]: string }) => {
    if (Object.keys(errors).length === 0) return;

    setTimeout(() => {
      const firstError = Object.keys(errors)[0];
      const errorPositions: { [key: string]: number } = {
        nombre: 20,
        descripcion: 20,
        capacidad_maxima: 20,
        fecha_mantenimiento: 600,
        tiempo_minimo: 1000,
        tiempo_maximo: 1100,
        dias: 1400,
        costo: 3000,
      };
      const scrollPosition = errorPositions[firstError] || 0;
      scrollViewRef.current?.scrollTo({ y: scrollPosition, animated: true });
    }, 100);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    validateBasicInfo(newErrors);
    validateCosts(newErrors);
    validateSchedules(newErrors);
    validateMaintenance(newErrors);
    validateReservationLimits(newErrors);

    setErrors(newErrors);
    scrollToFirstError(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSelectImage = async () => {
    if (!selectedProject?.nit) {
      Alert.alert(
        "Error de configuración",
        "No pudimos identificar tu proyecto. Cierra y vuelve a abrir la aplicación."
      );
      return;
    }

    try {
      setUploadingFile(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const selectedFile = result.assets[0];

        // Guardar archivo con compresión aplicada
        setImagen({
          name: selectedFile.fileName || `imagen_${Date.now()}.jpg`,
          uri: selectedFile.uri,
          mimeType: "image/jpeg", // ImagePicker convierte a JPEG
          size: selectedFile.fileSize,
          uploaded: false,
        });
      }
    } catch (e) {
      console.error("[CrearEspacio] handleSelectImage ERROR", e);
      showToast(
        "No pudimos abrir el selector de imágenes. Inténtalo nuevamente.",
        "error"
      );
    } finally {
      setUploadingFile(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!selectedProject?.nit) {
      Alert.alert(
        "Error de configuración",
        "No pudimos identificar tu proyecto. Cierra y vuelve a abrir la aplicación."
      );
      return;
    }

    try {
      setLoading(true);
      let imagenS3Key = null;

      if (imagenEliminada && isEditMode) {
        const imagenExistente = imagenNombreOriginal;

        if (imagenExistente && selectedProject?.nit) {
          try {
            await s3Service.deleteEspacioImage(
              selectedProject.nit,
              imagenExistente
            );
          } catch {
            // Error silencioso
          }
        }
      }

      if (imagen && !imagen.uploaded && imagen.uri) {
        let nombreArchivo;

        if (isEditMode) {
          const nombreExistente = imagenNombreOriginal;
          if (nombreExistente) {
            nombreArchivo = nombreExistente;
          } else {
            nombreArchivo = `${Date.now()}_${imagen.name}`;
          }
        } else {
          nombreArchivo = `${Date.now()}_${imagen.name}`;
        }

        const uploadResult = await s3Service.uploadEspacioImage(
          selectedProject.nit,
          {
            uri: imagen.uri,
            name: imagen.name,
            type: imagen.mimeType,
          },
          nombreArchivo
        );

        if (uploadResult.success) {
          imagenS3Key = uploadResult.key;
        } else {
          showToast(
            `No pudimos subir la imagen: ${uploadResult.error}. Inténtalo nuevamente.`,
            "error"
          );
          return;
        }
      }

      const espacioData = {
        ...formData,
        ...configuracion,
        horarios_semanales: Object.fromEntries(
          Object.entries(horariosSemanales).map(([dia, horario]) => [
            dia,
            {
              ...horario,
              precio_especial: horario.precio_especial || "",
            },
          ])
        ),
        costo: formData.costo || "0",
        imagen_s3_key: imagenS3Key || null,
        imagen_nombre: imagenEliminada
          ? null
          : imagenS3Key
            ? imagenS3Key.split("/").pop()
            : imagen?.name || null,
        fecha_mantenimiento:
          configuracion.estado === "mantenimiento"
            ? configuracion.fecha_mantenimiento || null
            : null,
      };

      const response = isEditMode
        ? await reservaService.editarEspacio(Number(id), espacioData)
        : await reservaService.crearEspacio(espacioData);

      if (response.success) {
        showToast(
          isEditMode
            ? `¡Zona "${espacioData.nombre}" actualizada correctamente!`
            : `¡Zona "${espacioData.nombre}" creada exitosamente!`,
          "success"
        );
        setTimeout(() => router.back(), 1500);
      } else {
        const mensajeError =
          response.error ||
          (isEditMode
            ? "No pudimos guardar los cambios. Verifica los datos e inténtalo nuevamente."
            : "No pudimos crear la zona. Verifica los datos e inténtalo nuevamente.");
        showToast(mensajeError, "error");
      }
    } catch (e) {
      console.error("[CrearEspacio] handleSubmit ERROR", e);
      showToast(
        "Problema de conexión. Verifica tu internet e inténtalo nuevamente.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const toggleDiaActivo = (diaSemana: number) => {
    setHorariosSemanales((prev) => ({
      ...prev,
      [diaSemana]: {
        ...prev[diaSemana],
        activo: !prev[diaSemana].activo,
      },
    }));
  };

  const updateHorarioDia = (
    diaSemana: number,
    campo: "hora_inicio" | "hora_fin" | "precio_especial",
    valor: string
  ) => {
    setHorariosSemanales((prev) => ({
      ...prev,
      [diaSemana]: {
        ...prev[diaSemana],
        [campo]: valor,
      },
    }));
  };

  const handleTimePickerChange = (event: any, selectedTime?: Date) => {
    if (selectedTime && showTimePicker) {
      const timeString = selectedTime.toTimeString().slice(0, 5); // HH:mm
      const campo =
        showTimePicker.tipo === "inicio" ? "hora_inicio" : "hora_fin";
      updateHorarioDia(showTimePicker.dia, campo, timeString);
    }
    setShowTimePicker(null);
  };

  // Convertir fecha local para guardar (sin conversión de zona horaria)
  const toLocalDateString = (localDate: Date) => {
    return dayjs(localDate).format("YYYY-MM-DD");
  };

  // Convertir fecha para mostrar (sin conversión de zona horaria)
  const toDisplayDate = (dateString: string) => {
    if (!dateString) return "";
    return dayjs(dateString).format("DD/MM/YYYY");
  };

  const datePickerOpenRef = useRef(false);

  const handleDatePickerChange = (event: any, selectedDate?: Date) => {
    if (!datePickerOpenRef.current) return; // ignorar disparo automático de Android
    datePickerOpenRef.current = false;
    setShowDatePicker(false);
    if (event?.type === "set" && selectedDate) {
      const dateString = toLocalDateString(selectedDate);
      setConfiguracion({ ...configuracion, fecha_mantenimiento: dateString });
    }
  };

  const openTimePicker = (dia: number, tipo: "inicio" | "fin") => {
    setShowTimePicker({ dia, tipo });
  };

  const createTimeFromString = useCallback((timeString: string): Date => {
    const [hours, minutes] = timeString.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }, []);

  const handleBackPress = useCallback(() => {
    router.back();
  }, []);

  const datePickerValue = useMemo(
    () =>
      configuracion.fecha_mantenimiento
        ? new Date(configuracion.fecha_mantenimiento)
        : new Date(),
    [configuracion.fecha_mantenimiento]
  );

  const getDiaNombre = (diaSemana: number): string => {
    const nombres = {
      1: "Lunes",
      2: "Martes",
      3: "Miércoles",
      4: "Jueves",
      5: "Viernes",
      6: "Sábado",
      7: "Domingo",
    };
    return nombres[diaSemana as keyof typeof nombres] || "";
  };

  const getDiaCorto = (diaSemana: number): string => {
    const cortos = {
      1: "L",
      2: "M",
      3: "MI",
      4: "J",
      5: "V",
      6: "S",
      7: "D",
    };
    return cortos[diaSemana as keyof typeof cortos] || "";
  };

  const hideToast = () => {
    setToast({ visible: false, message: "", type: "success" });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title={`${isEditMode ? "Editar" : "Crear"} Zona Común`}
        onBackPress={handleBackPress}
      />

      <LinearGradient colors={["#FAFAFA", "#F5F5F5"]} style={styles.gradient}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Información Básica */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="document-text"
                size={20}
                color={THEME.colors.success}
              />
              <Text style={styles.sectionTitle}>Información Básica</Text>
            </View>

            <Text style={styles.label}>Nombre de la zona comun *</Text>
            <TextInput
              style={[styles.input, errors.nombre && styles.inputError]}
              value={formData.nombre}
              onChangeText={(text) =>
                setFormData({ ...formData, nombre: text })
              }
              placeholder="Ej: Salón Social, Cancha Múltiple"
              placeholderTextColor={THEME.colors.text.muted}
            />
            {errors.nombre && (
              <Text style={styles.errorText}>{errors.nombre}</Text>
            )}

            <Text style={styles.label}>Descripción *</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                errors.descripcion && styles.inputError,
              ]}
              value={formData.descripcion}
              onChangeText={(text) =>
                setFormData({ ...formData, descripcion: text })
              }
              placeholder="Describe el espacio y sus características"
              placeholderTextColor={THEME.colors.text.muted}
              multiline
              numberOfLines={3}
            />
            {errors.descripcion && (
              <Text style={styles.errorText}>{errors.descripcion}</Text>
            )}

            <Text style={styles.label}>Reglas de Uso (Opcional)</Text>
            <TextInput
              style={[styles.input, styles.textAreaLarge]}
              value={formData.reglas}
              onChangeText={(text) =>
                setFormData({ ...formData, reglas: text })
              }
              placeholder="Ej: No fumar, No mascotas,
            Limpiar después del uso, etc."
              placeholderTextColor={THEME.colors.text.muted}
              multiline
              numberOfLines={4}
              maxLength={2500}
            />
            <Text style={styles.characterCount}>
              {formData.reglas.length}/2500 caracteres
            </Text>
            <Text style={styles.hint}>
              Especifica reglas claras: horarios especiales, restricciones,
              limpieza, etc.
            </Text>

            <Text style={styles.label}>Capacidad Máxima *</Text>
            <TextInput
              style={[
                styles.input,
                errors.capacidad_maxima && styles.inputError,
              ]}
              value={formData.capacidad_maxima}
              onChangeText={(text) =>
                setFormData({ ...formData, capacidad_maxima: text })
              }
              placeholder="Número de personas"
              placeholderTextColor={THEME.colors.text.muted}
              keyboardType="number-pad"
            />
            {errors.capacidad_maxima && (
              <Text style={styles.errorText}>{errors.capacidad_maxima}</Text>
            )}
          </View>

          {/* Configuración de Reservas */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="settings"
                size={20}
                color={THEME.colors.success}
              />
              <Text style={styles.sectionTitle}>Configuración de Reservas</Text>
            </View>

            <Text style={styles.label}>Estado del Espacio</Text>
            <SelectField
              label="Estado del Espacio"
              value={configuracion.estado}
              options={OPCIONES_ESTADO}
              onChange={(value) => {
                setConfiguracion({ ...configuracion, estado: value });
              }}
            />

            {configuracion.estado === "mantenimiento" && (
              <>
                <Text style={styles.label}>Fecha de Mantenimiento *</Text>
                <TouchableOpacity
                  style={[
                    styles.datePickerButton,
                    errors.fecha_mantenimiento && styles.inputError,
                  ]}
                  onPress={() => {
                    datePickerOpenRef.current = true;
                    setShowDatePicker(true);
                  }}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={THEME.colors.primary}
                  />
                  <Text style={styles.datePickerText}>
                    {configuracion.fecha_mantenimiento
                      ? toDisplayDate(configuracion.fecha_mantenimiento)
                      : "Seleccionar fecha"}
                  </Text>
                </TouchableOpacity>
                {errors.fecha_mantenimiento && (
                  <Text style={styles.errorText}>
                    {errors.fecha_mantenimiento}
                  </Text>
                )}
                <Text style={styles.hint}>
                  Fecha requerida para indicar cuándo estará en mantenimiento.
                </Text>
              </>
            )}

            <Text style={styles.label}>Tipo de Reserva</Text>
            <SelectField
              label="Tipo de Reserva"
              value={configuracion.tipo_reserva}
              options={OPCIONES_TIPO_RESERVA}
              onChange={(value) => {
                setConfiguracion({ ...configuracion, tipo_reserva: value });
                if (value === "por_horas") {
                  setFormData({ ...formData, tiempo_minimo_reserva: "60" });
                }
              }}
            />

            {configuracion.tipo_reserva === "bloque_fijo" && (
              <>
                <Text style={styles.label}>Duración del Bloque (minutos)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.duracion_bloque}
                  onChangeText={(text) =>
                    setFormData({ ...formData, duracion_bloque: text })
                  }
                  keyboardType="number-pad"
                  placeholder="Ej: 240 (4 horas)"
                />
              </>
            )}

            {/* Límites de Reserva - Solo para por_minutos y por_horas */}
            {(configuracion.tipo_reserva === "por_minutos" ||
              configuracion.tipo_reserva === "por_horas") && (
              <>
                <Text style={styles.sectionSubtitle}>Límites de Reserva</Text>

                <View style={styles.timeRow}>
                  <View style={styles.timeInput}>
                    <Text style={styles.label}>Tiempo Mínimo (min)</Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors.tiempo_minimo && styles.inputError,
                        configuracion.tipo_reserva === "por_horas" &&
                          styles.inputDisabled,
                      ]}
                      value={formData.tiempo_minimo_reserva}
                      onChangeText={(text) =>
                        setFormData({
                          ...formData,
                          tiempo_minimo_reserva: text,
                        })
                      }
                      keyboardType="number-pad"
                      placeholder="60"
                      placeholderTextColor={THEME.colors.text.muted}
                      editable={configuracion.tipo_reserva !== "por_horas"}
                    />
                    <Text style={styles.hint}>
                      {configuracion.tipo_reserva === "por_minutos"
                        ? "Mín: 15 min"
                        : "Fijo: 60 min (1 hora)"}
                    </Text>
                    {errors.tiempo_minimo && (
                      <Text style={styles.errorText}>
                        {errors.tiempo_minimo}
                      </Text>
                    )}
                  </View>

                  <View style={styles.timeInput}>
                    <Text style={styles.label}>Tiempo Máximo (min)</Text>
                    <TextInput
                      style={[
                        styles.input,
                        errors.tiempo_maximo && styles.inputError,
                      ]}
                      value={formData.tiempo_maximo_reserva}
                      onChangeText={(text) =>
                        setFormData({
                          ...formData,
                          tiempo_maximo_reserva: text,
                        })
                      }
                      keyboardType="number-pad"
                      placeholder="240"
                      placeholderTextColor={THEME.colors.text.muted}
                    />
                    <Text style={styles.hint}>
                      {configuracion.tipo_reserva === "por_minutos"
                        ? "Máx: 120 min (2h)"
                        : "Máx: 240 min (4h)"}
                    </Text>
                    {errors.tiempo_maximo && (
                      <Text style={styles.errorText}>
                        {errors.tiempo_maximo}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.limitsPreview}>
                  <Text style={styles.limitsPreviewTitle}>
                    Resumen de Límites:
                  </Text>
                  <Text style={styles.limitsPreviewText}>
                    • Reserva mínima: {formData.tiempo_minimo_reserva || "60"}{" "}
                    minutos (
                    {Math.floor(
                      (parseInt(formData.tiempo_minimo_reserva) || 60) / 60
                    )}
                    h {(parseInt(formData.tiempo_minimo_reserva) || 60) % 60}
                    min)
                  </Text>
                  <Text style={styles.limitsPreviewText}>
                    • Reserva máxima: {formData.tiempo_maximo_reserva || "240"}{" "}
                    minutos (
                    {Math.floor(
                      (parseInt(formData.tiempo_maximo_reserva) || 240) / 60
                    )}
                    h {(parseInt(formData.tiempo_maximo_reserva) || 240) % 60}
                    min)
                  </Text>
                </View>
              </>
            )}

            <Text style={styles.label}>Tiempo Mínimo de Antelación</Text>
            <SelectField
              label="Tiempo Mínimo de Antelación"
              value={formData.tiempo_reserva}
              options={OPCIONES_ANTELACION}
              onChange={(value) =>
                setFormData({ ...formData, tiempo_reserva: value })
              }
            />
            <Text style={styles.hint}>
              Los usuarios solo podrán reservar horarios disponibles después de
              este tiempo. Ejemplo: Si seleccionas 24 horas, solo verán horarios
              desde mañana en adelante.
            </Text>

            <View style={styles.switchRow}>
              <Text style={styles.label}>Requiere Aprobación del Admin</Text>
              <Switch
                value={configuracion.requiere_aprobacion}
                onValueChange={(value) =>
                  setConfiguracion({
                    ...configuracion,
                    requiere_aprobacion: value,
                  })
                }
                trackColor={{
                  false: THEME.colors.border,
                  true: THEME.colors.success,
                }}
              />
            </View>
          </View>

          {/* Horarios por Día de la Semana */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={20} color={THEME.colors.success} />
              <Text style={styles.sectionTitle}>Horarios por Día</Text>
            </View>

            <Text style={styles.sectionDescription}>
              Configura horarios específicos para cada día de la semana. Puedes
              tener horarios diferentes por día.
            </Text>

            {/* Vista rápida de días activos */}
            <Text style={styles.label}>Días Activos:</Text>
            <View style={styles.diasGrid}>
              {Object.entries(horariosSemanales).map(([diaSemana, horario]) => (
                <TouchableOpacity
                  key={diaSemana}
                  style={[
                    styles.diaButton,
                    horario.activo && styles.diaButtonActive,
                  ]}
                  onPress={() => toggleDiaActivo(parseInt(diaSemana))}
                >
                  <Text
                    style={[
                      styles.diaText,
                      horario.activo && styles.diaTextActive,
                    ]}
                  >
                    {getDiaCorto(parseInt(diaSemana))}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.dias && <Text style={styles.errorText}>{errors.dias}</Text>}

            {/* Configuración detallada por día */}
            <Text style={styles.label}>Configuración Detallada:</Text>
            {Object.entries(horariosSemanales).map(([diaSemana, horario]) => (
              <DiaHorarioItem
                key={diaSemana}
                diaSemana={parseInt(diaSemana)}
                horario={horario}
                onToggle={() => toggleDiaActivo(parseInt(diaSemana))}
                onUpdateHorario={(campo, valor) =>
                  updateHorarioDia(parseInt(diaSemana), campo, valor)
                }
                onOpenTimePicker={(tipo) =>
                  openTimePicker(parseInt(diaSemana), tipo)
                }
                error={errors[`horario_${diaSemana}`]}
                mostrarPrecio={configuracion.tipo_reserva !== "gratuito"}
              />
            ))}
          </View>

          {/* Costos */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cash" size={20} color={THEME.colors.success} />
              <Text style={styles.sectionTitle}>Configuración de Costos</Text>
            </View>

            {/* Costo según tipo de reserva */}
            {configuracion.tipo_reserva === "por_minutos" && (
              <>
                <Text style={styles.label}>Costo por Minuto *</Text>
                <TextInput
                  style={[styles.input, errors.costo && styles.inputError]}
                  value={formData.costo}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, "");
                    setFormData({ ...formData, costo: cleaned });
                  }}
                  placeholder="250"
                  placeholderTextColor={THEME.colors.text.muted}
                  keyboardType="number-pad"
                />
                <Text style={styles.hint}>
                  Los usuarios pagarán ${formData.costo || "250"} por cada
                  minuto
                </Text>
                {formData.costo && (
                  <View style={styles.examples}>
                    <Text style={styles.exampleTitle}>Ejemplos:</Text>
                    <Text style={styles.exampleText}>
                      • 30 min = $
                      {(Number(formData.costo) * 30).toLocaleString()}
                    </Text>
                    <Text style={styles.exampleText}>
                      • 60 min = $
                      {(Number(formData.costo) * 60).toLocaleString()}
                    </Text>
                    <Text style={styles.exampleText}>
                      • 90 min = $
                      {(Number(formData.costo) * 90).toLocaleString()}
                    </Text>
                  </View>
                )}
              </>
            )}

            {configuracion.tipo_reserva === "por_horas" && (
              <>
                <Text style={styles.label}>Costo por Hora *</Text>
                <TextInput
                  style={[styles.input, errors.costo && styles.inputError]}
                  value={formData.costo}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, "");
                    setFormData({ ...formData, costo: cleaned });
                  }}
                  placeholder="15000"
                  placeholderTextColor={THEME.colors.text.muted}
                  keyboardType="number-pad"
                />
                <Text style={styles.hint}>
                  Los usuarios pagarán ${formData.costo || "15,000"} por cada
                  hora
                </Text>
                {formData.costo && (
                  <View style={styles.examples}>
                    <Text style={styles.exampleTitle}>Ejemplos:</Text>
                    <Text style={styles.exampleText}>
                      • 1 hora = ${Number(formData.costo).toLocaleString()}
                    </Text>
                    <Text style={styles.exampleText}>
                      • 2 horas = $
                      {(Number(formData.costo) * 2).toLocaleString()}
                    </Text>
                    <Text style={styles.exampleText}>
                      • 2.5 horas = $
                      {(Number(formData.costo) * 3).toLocaleString()} (3 horas)
                    </Text>
                  </View>
                )}
              </>
            )}

            {configuracion.tipo_reserva === "bloque_fijo" && (
              <>
                <Text style={styles.label}>Costo por Bloque *</Text>
                <TextInput
                  style={[styles.input, errors.costo && styles.inputError]}
                  value={formData.costo}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, "");
                    setFormData({ ...formData, costo: cleaned });
                  }}
                  placeholder="50000"
                  placeholderTextColor={THEME.colors.text.muted}
                  keyboardType="number-pad"
                />
                <Text style={styles.hint}>
                  Los usuarios pagarán ${formData.costo || "50,000"} por cada
                  bloque de {Math.floor(Number(formData.duracion_bloque) / 60)}{" "}
                  horas
                </Text>
                {formData.costo && formData.duracion_bloque && (
                  <View style={styles.examples}>
                    <Text style={styles.exampleTitle}>Ejemplos:</Text>
                    <Text style={styles.exampleText}>
                      • 1 bloque (
                      {Math.floor(Number(formData.duracion_bloque) / 60)}h) = $
                      {Number(formData.costo).toLocaleString()}
                    </Text>
                    <Text style={styles.exampleText}>
                      • 2 bloques = $
                      {(Number(formData.costo) * 2).toLocaleString()}
                    </Text>
                  </View>
                )}
              </>
            )}

            {configuracion.tipo_reserva === "gratuito" && (
              <>
                <View style={styles.gratuitoContainer}>
                  <Ionicons
                    name="gift"
                    size={24}
                    color={THEME.colors.success}
                  />
                  <Text style={styles.gratuitoText}>
                    Este espacio será gratuito
                  </Text>
                </View>
                <Text style={styles.hint}>
                  Los usuarios podrán reservar sin ningún costo
                </Text>
              </>
            )}

            {errors.costo && configuracion.tipo_reserva !== "gratuito" && (
              <Text style={styles.errorText}>{errors.costo}</Text>
            )}
          </View>

          {/* Imagen */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="image" size={20} color={THEME.colors.success} />
              <Text style={styles.sectionTitle}>Imagen de la zona comun</Text>
            </View>

            {!imagen || (!imagen.uri && !imagenUrl) ? (
              <TouchableOpacity
                style={[
                  styles.imageButton,
                  uploadingFile && styles.imageButtonDisabled,
                ]}
                onPress={handleSelectImage}
                disabled={uploadingFile}
              >
                {uploadingFile ? (
                  <ActivityIndicator
                    size="small"
                    color={THEME.colors.success}
                  />
                ) : (
                  <Ionicons
                    name="camera"
                    size={24}
                    color={THEME.colors.success}
                  />
                )}
                <Text style={styles.imageButtonText}>
                  {uploadingFile ? "Seleccionando..." : "Seleccionar Imagen"}
                </Text>
                <Text style={styles.imageHint}>
                  Opcional - JPG, PNG (Max 5MB)
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={
                    imagen.uri ? { uri: imagen.uri } : { uri: imagenUrl || "" }
                  }
                  style={styles.imagePreview}
                  contentFit="cover"
                  transition={200}
                />
                <View style={styles.imageOverlay}>
                  <TouchableOpacity
                    style={styles.imageActionButton}
                    onPress={handleSelectImage}
                  >
                    <Ionicons name="camera" size={20} color="white" />
                    <Text style={styles.imageActionText}>Cambiar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.imageActionButton, styles.imageDeleteButton]}
                    onPress={() => {
                      setImagenEliminada(true);
                      setImagen(null);
                      setImagenUrl(null);
                    }}
                  >
                    <>
                      <Ionicons name="trash" size={20} color="white" />
                      <Text style={styles.imageActionText}>Eliminar</Text>
                    </>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Time Picker Modal */}
          {showTimePicker && (
            <DateTimePicker
              value={createTimeFromString(
                showTimePicker.tipo === "inicio"
                  ? horariosSemanales[showTimePicker.dia].hora_inicio
                  : horariosSemanales[showTimePicker.dia].hora_fin
              )}
              mode="time"
              is24Hour={true}
              display="spinner"
              onChange={handleTimePickerChange}
            />
          )}

          {/* Date Picker Modal */}
          {showDatePicker && (
            <DateTimePicker
              value={datePickerValue}
              mode="date"
              display="default"
              onChange={handleDatePickerChange}
              minimumDate={new Date()} // No permitir fechas pasadas
            />
          )}

          {/* Botón Crear */}
          <View style={styles.createButtonContainer}>
            <Button
              isLoading={loading}
              onPress={handleSubmit}
              loadingText="Guardando..."
              loadingTextColor="#fff"
              backgroundColor={THEME.colors.success}
              loadingTextBackgroundColor={THEME.colors.success}
              height={56}
              borderRadius={12}
              fullWidth
            >
              <Text style={styles.createButtonText}>
                {isEditMode ? "Guardar Cambios" : "Crear Zona Común"}
              </Text>
            </Button>
          </View>
        </ScrollView>
      </LinearGradient>

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
    backgroundColor: "#FAFAFA",
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingBottom: 20,
  },
  section: {
    backgroundColor: THEME.colors.surface,
    borderRadius: 0,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: THEME.colors.surfaceLight,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: THEME.spacing.md,
    gap: THEME.spacing.sm,
  },
  sectionTitle: {
    fontSize: THEME.fontSize.lg,
    fontWeight: "600",
    color: THEME.colors.text.primary,
  },
  sectionSubtitle: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.text.primary,
    marginTop: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
    paddingBottom: THEME.spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  limitsPreview: {
    backgroundColor: THEME.colors.successLight,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
  },
  limitsPreviewTitle: {
    fontSize: THEME.fontSize.sm,
    fontWeight: "600",
    color: THEME.colors.success,
    marginBottom: THEME.spacing.xs,
  },
  limitsPreviewText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    marginBottom: 2,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: THEME.colors.text.heading,
    marginBottom: 8,
    marginTop: THEME.spacing.sm,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.heading,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  inputError: {
    borderColor: THEME.colors.error,
  },
  inputDisabled: {
    backgroundColor: THEME.colors.surfaceLight,
    borderColor: THEME.colors.input.border,
    color: THEME.colors.text.muted,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  textAreaLarge: {
    minHeight: 120,
    textAlignVertical: "top",
  },
  characterCount: {
    fontSize: THEME.fontSize.xs,
    color: THEME.colors.text.muted,
    textAlign: "right",
    marginTop: THEME.spacing.xs,
  },
  errorText: {
    fontSize: 14,
    color: THEME.colors.error,
    marginTop: 6,
  },
  switchRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: THEME.spacing.sm,
  },
  timeRow: {
    flexDirection: "row",
    gap: THEME.spacing.md,
  },
  timeInput: {
    flex: 1,
  },
  sectionDescription: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    marginBottom: THEME.spacing.md,
    fontStyle: "italic",
  },
  diasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: THEME.spacing.sm,
    marginBottom: THEME.spacing.md,
  },

  diaButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: THEME.colors.input.background,
    borderWidth: 2,
    borderColor: THEME.colors.border,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  diaButtonActive: {
    backgroundColor: THEME.colors.success,
    borderColor: THEME.colors.success,
    shadowColor: THEME.colors.success,
    shadowOpacity: 0.3,
  },
  diaText: {
    fontSize: THEME.fontSize.sm,
    fontWeight: "600",
    color: THEME.colors.text.secondary,
  },
  diaTextActive: {
    color: THEME.colors.text.inverse,
  },
  imageButton: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.colors.successLight,
    borderWidth: 2,
    borderColor: THEME.colors.success,
    borderRadius: 12,
    padding: THEME.spacing.lg,
    gap: THEME.spacing.xs,
  },
  imageButtonDisabled: {
    opacity: 0.6,
  },
  imageButtonText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.success,
    fontWeight: "600",
  },
  imageHint: {
    color: THEME.colors.text.muted,
    fontSize: THEME.fontSize.xs,
  },
  imagePreviewContainer: {
    position: "relative",
    borderRadius: 12,
    overflow: "hidden",
    height: 200,
  },
  imagePreview: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: THEME.spacing.sm,
    gap: THEME.spacing.sm,
  },
  imageActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: THEME.colors.success,
    borderRadius: 8,
    padding: THEME.spacing.sm,
    gap: THEME.spacing.xs,
  },
  imageDeleteButton: {
    backgroundColor: THEME.colors.error,
  },
  imageActionText: {
    color: THEME.colors.text.inverse,
    fontSize: THEME.fontSize.sm,
    fontWeight: "600",
  },
  createButtonContainer: {
    paddingHorizontal: THEME.spacing.md,
    paddingVertical: THEME.spacing.lg,
    alignItems: "center",
  },
  createButtonText: {
    color: THEME.colors.text.inverse,
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
  },
  hint: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    fontStyle: "italic",
    marginTop: THEME.spacing.xs,
    marginBottom: THEME.spacing.sm,
  },
  examples: {
    backgroundColor: THEME.colors.successLight,
    borderRadius: THEME.borderRadius.md,
    padding: THEME.spacing.sm,
    marginTop: THEME.spacing.sm,
  },
  exampleTitle: {
    fontSize: THEME.fontSize.sm,
    fontWeight: "600",
    color: THEME.colors.success,
    marginBottom: THEME.spacing.xs,
  },
  exampleText: {
    fontSize: THEME.fontSize.sm,
    color: THEME.colors.text.secondary,
    marginBottom: 2,
  },
  gratuitoContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: THEME.colors.successLight,
    borderRadius: 12,
    padding: THEME.spacing.lg,
    marginBottom: THEME.spacing.sm,
    gap: THEME.spacing.sm,
    borderWidth: 1,
    borderColor: THEME.colors.success + "40",
  },
  gratuitoText: {
    fontSize: THEME.fontSize.md,
    fontWeight: "600",
    color: THEME.colors.success,
    flex: 1,
    flexWrap: "wrap",
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 0,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: THEME.spacing.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  datePickerText: {
    fontSize: THEME.fontSize.md,
    color: THEME.colors.text.heading,
    flex: 1,
  },
});
