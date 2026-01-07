import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { s3Service } from "@/services/s3Service";
import { useProject } from "@/contexts/ProjectContext";
import dayjs from "dayjs";

interface Espacio {
  id: number;
  nombre: string;
  descripcion: string;
  tipo_reserva: "por_minutos" | "por_horas" | "bloque_fijo" | "gratuito";
  costo: number;
  capacidad_maxima: number;
  estado: "activa" | "inactiva" | "mantenimiento";
  imagen_nombre?: string;
  duracion_bloque?: number;
  fecha_mantenimiento?: string;
}

interface EspacioCardProps {
  item: Espacio;
  onPress: (item: Espacio, imageUrl?: string) => void;
}

const getStatusColor = (status: Espacio["estado"]): string => {
  const colorMap = {
    activa: "#10B981",
    inactiva: "#6B7280",
    mantenimiento: "#F59E0B",
  };
  return colorMap[status] || "#6B7280";
};

const getStatusText = (status: Espacio["estado"]): string => {
  const textMap = {
    activa: "Disponible",
    inactiva: "No disponible",
    mantenimiento: "Mantenimiento",
  };
  return textMap[status] || status;
};

const getTipoReservaText = (tipo: Espacio["tipo_reserva"]): string => {
  const textMap = {
    por_minutos: "Por minutos",
    por_horas: "Por horas",
    bloque_fijo: "Bloque fijo",
    gratuito: "Gratuito",
  };
  return textMap[tipo] || tipo;
};

const formatCosto = (
  costo: number,
  tipo: Espacio["tipo_reserva"],
  duracion_bloque?: number
): string => {
  if (tipo === "gratuito") {
    return "Gratis";
  }

  const costoFormateado = `$${costo.toLocaleString()}`;

  switch (tipo) {
    case "por_minutos":
      return `${costoFormateado}/min`;
    case "por_horas":
      return `${costoFormateado}/hora`;
    case "bloque_fijo":
      const horas = duracion_bloque ? Math.floor(duracion_bloque / 60) : 4;
      return `${costoFormateado}/${horas}h`;
    default:
      return costoFormateado;
  }
};

const EspacioCardComponent: React.FC<EspacioCardProps> = ({
  item,
  onPress,
}) => {
  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [imageLoading, setImageLoading] = React.useState(true);
  const { selectedProject } = useProject();

  const loadImage = useCallback(async () => {
    if (item.imagen_nombre && selectedProject?.NIT) {
      try {
        const result = await s3Service.getEspacioImageUrl(
          selectedProject.NIT,
          item.imagen_nombre
        );
        if (result.success && result.url) {
          setImageUrl(result.url);
        }
      } catch {
        // Error silencioso al cargar imagen
      }
    }
    setImageLoading(false);
  }, [item.imagen_nombre, selectedProject?.NIT]);

  React.useEffect(() => {
    // Cargar imagen con un pequeño delay para evitar cargas simultáneas
    const timer = setTimeout(() => {
      if (item.imagen_nombre && selectedProject?.NIT && imageLoading) {
        loadImage();
      } else {
        setImageLoading(false);
      }
    }, Math.random() * 200); // Delay aleatorio entre 0-200ms

    return () => clearTimeout(timer);
  }, [item.imagen_nombre, selectedProject?.NIT, imageLoading, loadImage]);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        (item.estado !== "activa" || item.fecha_mantenimiento) &&
          styles.cardDisabled,
      ]}
      onPress={() => onPress(item, imageUrl || undefined)}
      activeOpacity={0.9}
      disabled={item.estado !== "activa" || !!item.fecha_mantenimiento}
    >
      {/* Imagen con overlay */}
      <View style={styles.imageContainer}>
        {imageLoading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.loadingPlaceholder} />
          </View>
        ) : imageUrl ? (
          <>
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.7)"]}
              style={styles.imageOverlay}
            />
          </>
        ) : (
          <View style={styles.placeholderContainer}>
            <Image
              source={require("@/assets/images/zonas_comunes.png")}
              style={styles.placeholderImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Badge de estado */}
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.estado) },
          ]}
        >
          <Text style={styles.statusBadgeText}>
            {getStatusText(item.estado)}
          </Text>
        </View>

        {/* Badge de tipo gratuito */}
        {item.tipo_reserva === "gratuito" && (
          <View style={styles.freeBadge}>
            <Ionicons name="gift" size={12} color="white" />
            <Text style={styles.freeBadgeText}>GRATIS</Text>
          </View>
        )}
      </View>

      {/* Contenido */}
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {item.nombre}
          </Text>
          <Text
            style={[
              styles.price,
              item.tipo_reserva === "gratuito" && styles.priceGratis,
            ]}
          >
            {formatCosto(item.costo, item.tipo_reserva, item.duracion_bloque)}
          </Text>
        </View>

        <Text style={styles.description} numberOfLines={2}>
          {item.descripcion}
        </Text>

        {item.estado === "mantenimiento" && item.fecha_mantenimiento && (
          <Text style={styles.maintenanceDate}>
            Mantenimiento aproximado hasta:{" "}
            {dayjs(item.fecha_mantenimiento).format("DD/MM/YYYY")}
          </Text>
        )}

        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Ionicons name="people" size={14} color="#64748B" />
            <Text style={styles.detailText}>Máx. {item.capacidad_maxima}</Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="time" size={14} color="#64748B" />
            <Text style={styles.detailText}>
              {getTipoReservaText(item.tipo_reserva)}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

EspacioCardComponent.displayName = "EspacioCard";

export const EspacioCard = React.memo(EspacioCardComponent);

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
    overflow: "hidden",
  },
  cardDisabled: {
    opacity: 0.7,
  },
  imageContainer: {
    position: "relative",
    height: 200,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  statusBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  freeBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#059669",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  freeBadgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "700",
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    flex: 1,
    marginRight: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10B981",
  },
  priceGratis: {
    color: "#059669",
  },
  description: {
    fontSize: 14,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 12,
  },
  maintenanceDate: {
    fontSize: 12,
    color: "#F59E0B",
    fontWeight: "600",
    marginBottom: 12,
  },
  details: {
    flexDirection: "row",
    gap: 16,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  detailText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "500",
  },
  placeholderContainer: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
  },
  loadingContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F3F4F6",
  },
});
