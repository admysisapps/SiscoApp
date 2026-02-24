import React, { useState, useCallback } from "react";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { reservaService } from "@/services/reservaService";
import { s3Service } from "@/services/s3Service";
import { useProject } from "@/contexts/ProjectContext";
import { THEME } from "@/constants/theme";
import ZonaDetailSkeleton from "@/components/reservas/ZonaDetailSkeleton";
const { width } = Dimensions.get("window");

const DIAS_SEMANA = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export default function DetalleZonaScreen() {
  const { id, imagen_nombre } = useLocalSearchParams();
  const [zona, setZona] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [finalImageUrl, setFinalImageUrl] = useState<string | null>(null);
  const { selectedProject } = useProject();

  const cargarDetalle = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);

      const response = await reservaService.obtenerEspacio(Number(id));

      if (response.success) {
        setZona(response.espacio);

        // Regenerar URL desde imagen_nombre
        if (imagen_nombre && selectedProject?.nit) {
          const result = await s3Service.getEspacioImageUrl(
            selectedProject.nit,
            imagen_nombre as string
          );
          if (result.success && result.url) {
            setFinalImageUrl(result.url);
          } else {
            setFinalImageUrl(null);
          }
        } else {
          setFinalImageUrl(null);
        }
      } else {
        console.error("Error cargando detalle:", response.error);
        setError("No se pudo cargar la información del espacio");
      }
    } catch (error) {
      console.error("Error cargando detalle:", error);
      setError("Error de conexión. Verifica tu internet e intenta nuevamente");
    } finally {
      setLoading(false);
    }
  }, [id, imagen_nombre, selectedProject?.nit]);

  useFocusEffect(
    useCallback(() => {
      cargarDetalle();
    }, [cargarDetalle])
  );

  const handleBackPress = useCallback(() => {
    router.back();
  }, []);

  const handleReservar = useCallback(() => {
    // Navegar a crear reserva con zona preseleccionada
    router.push({
      pathname: "/(screens)/reservas/crear-reserva",
      params: {
        espacioId: zona.id,
        espacioNombre: zona.nombre,
        espacioDescripcion: zona.descripcion,
        espacioCosto: zona.costo,
        capacidadMaxima: zona.capacidad_maxima,
        tipoReserva: zona.tipo_reserva,
        requiereAprobacion: zona.requiere_aprobacion.toString(),
      },
    });
  }, [zona]);

  const formatCosto = (costo: number) => {
    if (zona.tipo_reserva === "gratuito") return "Gratis";
    if (zona.tipo_reserva === "por_minutos")
      return `$${costo.toLocaleString()}/min`;
    if (zona.tipo_reserva === "bloque_fijo")
      return `$${costo.toLocaleString()}/bloque`;
    return `$${costo.toLocaleString()}/hora`;
  };

  const getHorarioTexto = (horario: {
    activo: boolean;
    hora_inicio: string;
    hora_fin: string;
  }) => {
    if (!horario.activo) return "Cerrado";
    return `${horario.hora_inicio} - ${horario.hora_fin}`;
  };

  const getTipoReservaTexto = (tipoReserva: string) => {
    switch (tipoReserva) {
      case "por_minutos":
        return "Reserva por minutos";
      case "por_horas":
        return "Reserva por horas";
      case "bloque_fijo":
        return "Reserva por bloques de tiempo";
      case "gratuito":
        return "Reserva gratuita";
      default:
        return "Reserva por bloques de tiempo";
    }
  };

  const getUnidadPrecio = (tipoReserva: string) => {
    switch (tipoReserva) {
      case "por_minutos":
        return "/min";
      case "por_horas":
        return "/h";
      case "bloque_fijo":
        return "/bloque";
      default:
        return "/h";
    }
  };

  const getTiempoReservaTexto = () => {
    if (zona.tipo_reserva === "bloque_fijo" && zona.duracion_bloque) {
      const horas = Math.floor(zona.duracion_bloque / 60);
      const minutos = zona.duracion_bloque % 60;
      if (horas > 0 && minutos > 0) {
        return `Bloques de ${horas}h ${minutos}min`;
      } else if (horas > 0) {
        return `Bloques de ${horas}h`;
      } else {
        return `Bloques de ${minutos}min`;
      }
    }
    return `Mínimo ${zona.tiempo_minimo_reserva} min - Máximo ${zona.tiempo_maximo_reserva} min`;
  };

  // Mostrar skeleton mientras carga
  if (loading && !zona) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
        </View>
        <ZonaDetailSkeleton />
      </SafeAreaView>
    );
  }

  // Mostrar error si existe
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={THEME.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              cargarDetalle();
            }}
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Fallback si no hay zona cargada
  if (!zona && !error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons
            name="search"
            size={48}
            color={THEME.colors.text.secondary}
          />
          <Text style={styles.errorText}>Espacio no encontrado</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!zona) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header flotante */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Imagen principal */}
        <View style={styles.imageContainer}>
          <Image
            source={
              finalImageUrl
                ? { uri: finalImageUrl }
                : require("@/assets/images/zonas_comunes.webp")
            }
            style={styles.image}
            resizeMode="cover"
            onError={() => {
              setFinalImageUrl(null); // Cambiar a placeholder
            }}
          />
          <LinearGradient
            colors={["transparent", "rgba(255,255,255,0.8)", "white"]}
            style={styles.imageGradient}
          />
        </View>

        {/* Información principal */}
        <View style={styles.mainInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{zona.nombre}</Text>
            <Text style={styles.price}>{formatCosto(zona.costo)}</Text>
          </View>

          <View style={styles.capacityRow}>
            <Ionicons
              name="people"
              size={16}
              color={THEME.colors.text.secondary}
            />
            <Text style={styles.capacityText}>
              Hasta {zona.capacidad_maxima} personas
            </Text>
          </View>

          <Text style={styles.description}>{zona.descripcion}</Text>
        </View>

        {/* Horarios */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horarios de Disponibilidad</Text>
          <View style={styles.horariosContainer}>
            {zona.horarios.map(
              (
                horario: {
                  dia_semana: number;
                  activo: boolean;
                  hora_inicio: string;
                  hora_fin: string;
                  precio_especial?: number;
                },
                index: number
              ) => (
                <View
                  key={`horario-${horario.dia_semana}`}
                  style={styles.horarioRow}
                >
                  <Text style={styles.diaText}>
                    {
                      DIAS_SEMANA[
                        horario.dia_semana === 7 ? 0 : horario.dia_semana
                      ]
                    }
                  </Text>
                  <Text
                    style={[
                      styles.horarioText,
                      !horario.activo && styles.horarioInactivo,
                    ]}
                  >
                    {getHorarioTexto(horario)}
                  </Text>
                  {horario.precio_especial && (
                    <Text style={styles.precioEspecial}>
                      ${horario.precio_especial.toLocaleString()}
                      {getUnidadPrecio(zona.tipo_reserva)}
                    </Text>
                  )}
                </View>
              )
            )}
          </View>
        </View>

        {/* Reglas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reglas de Uso</Text>
          <Text style={styles.reglasText}>{zona.reglas}</Text>
        </View>

        {/* Información de reserva */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información de Reserva</Text>
          <View style={styles.infoReserva}>
            <View style={styles.infoRow}>
              <Ionicons
                name="time"
                size={16}
                color={THEME.colors.text.secondary}
              />
              <Text style={styles.infoText}>{getTiempoReservaTexto()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons
                name="calendar"
                size={16}
                color={THEME.colors.text.secondary}
              />
              <Text style={styles.infoText}>
                {getTipoReservaTexto(zona.tipo_reserva)}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <AntDesign
                name="notification"
                size={16}
                color={THEME.colors.success}
              />
              <Text style={[styles.infoText, styles.antelacionText]}>
                {zona.tiempo_reserva || 24}h de antelación requerida
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons
                name={
                  zona.requiere_aprobacion
                    ? "shield-checkmark"
                    : "checkmark-circle"
                }
                size={16}
                color={THEME.colors.success}
              />
              <Text
                style={[
                  styles.infoText,
                  zona.requiere_aprobacion
                    ? styles.antelacionText
                    : styles.aprobacionText,
                ]}
              >
                {zona.requiere_aprobacion
                  ? "Requiere aprobación del administrador"
                  : "Aprobación automática"}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Botón flotante de reserva */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.reservarButton}
          onPress={handleReservar}
        >
          <Text style={styles.reservarButtonText}>Reservar Ahora</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.surface,
  },
  header: {
    position: "absolute",
    top: 50,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  image: {
    width: width,
    height: 300,
  },
  mainInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: THEME.colors.header.title,
    flex: 1,
    marginRight: 16,
  },
  price: {
    fontSize: 20,
    fontWeight: "700",
    color: THEME.colors.success,
  },
  capacityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  capacityText: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    fontWeight: "500",
  },
  description: {
    fontSize: 16,
    color: THEME.colors.text.secondary,
    lineHeight: 24,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.colors.header.title,
    marginBottom: 16,
  },
  horariosContainer: {
    gap: 12,
  },
  horarioRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  diaText: {
    fontSize: 14,
    fontWeight: "600",
    color: THEME.colors.header.title,
    width: 40,
  },
  horarioText: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    flex: 1,
    marginLeft: 16,
  },
  horarioInactivo: {
    color: THEME.colors.text.muted,
  },
  precioEspecial: {
    fontSize: 12,
    fontWeight: "600",
    color: THEME.colors.success,
  },
  reglasText: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
    lineHeight: 22,
  },
  infoReserva: {
    gap: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: THEME.colors.text.secondary,
  },
  antelacionText: {
    color: THEME.colors.text.secondary,
    fontWeight: "500",
  },
  aprobacionText: {
    color: THEME.colors.text.secondary,
    fontWeight: "500",
  },
  bottomBar: {
    padding: THEME.spacing.md,
    backgroundColor: THEME.colors.surface,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
  },
  reservarButton: {
    flexDirection: "row",
    backgroundColor: THEME.colors.success,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  reservarButtonText: {
    color: THEME.colors.text.inverse,
    fontSize: 16,
    fontWeight: "600",
  },
  imageContainer: {
    height: 300,
    position: "relative",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: THEME.colors.text.secondary,
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: THEME.colors.success,
    fontWeight: "600",
  },
  retryButton: {
    backgroundColor: THEME.colors.success,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 16,
  },
  retryButtonText: {
    color: THEME.colors.text.inverse,
    fontSize: 16,
    fontWeight: "600",
  },
});
