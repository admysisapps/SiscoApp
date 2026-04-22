import { useState, useEffect, useRef } from "react";
import { router } from "expo-router";
import { reservaService } from "@/services/reservaService";
import { s3Service } from "@/services/s3Service";
import { useLoading } from "@/contexts/LoadingContext";
import { useProject } from "@/contexts/ProjectContext";
import {
  HorarioAPI,
  EspacioAPI,
  ImagenSeleccionada,
  HorariosSemanalesMap,
  FormDataEspacio,
  ConfiguracionEspacio,
} from "@/types/Espacio";

const HORARIOS_DEFAULT: HorariosSemanalesMap = {
  1: {
    activo: true,
    hora_inicio: "06:00",
    hora_fin: "22:00",
    precio_especial: "",
  },
  2: {
    activo: true,
    hora_inicio: "06:00",
    hora_fin: "22:00",
    precio_especial: "",
  },
  3: {
    activo: true,
    hora_inicio: "06:00",
    hora_fin: "22:00",
    precio_especial: "",
  },
  4: {
    activo: true,
    hora_inicio: "06:00",
    hora_fin: "22:00",
    precio_especial: "",
  },
  5: {
    activo: true,
    hora_inicio: "06:00",
    hora_fin: "22:00",
    precio_especial: "",
  },
  6: {
    activo: true,
    hora_inicio: "07:00",
    hora_fin: "23:59",
    precio_especial: "",
  },
  7: {
    activo: false,
    hora_inicio: "08:00",
    hora_fin: "20:00",
    precio_especial: "",
  },
};

const FORM_DATA_DEFAULT: FormDataEspacio = {
  nombre: "",
  descripcion: "",
  reglas: "",
  capacidad_maxima: "1",
  costo: "",
  hora_inicio: "06:00",
  hora_fin: "22:00",
  tiempo_minimo_reserva: "60",
  tiempo_maximo_reserva: "240",
  duracion_bloque: "240",
  tiempo_reserva: "24",
};

const CONFIGURACION_DEFAULT: ConfiguracionEspacio = {
  estado: "activa",
  tipo_reserva: "por_horas",
  requiere_aprobacion: false,
  fecha_mantenimiento: "",
};

interface UseCargarEspacioProps {
  id: string | string[] | undefined;
  isEditMode: boolean;
  showToast: (message: string, type: "success" | "error" | "warning") => void;
}

export function useCargarEspacio({
  id,
  isEditMode,
  showToast,
}: UseCargarEspacioProps) {
  const { showLoading, hideLoading } = useLoading();
  const { selectedProject } = useProject();

  const [formData, setFormData] = useState<FormDataEspacio>(FORM_DATA_DEFAULT);
  const [configuracion, setConfiguracion] = useState<ConfiguracionEspacio>(
    CONFIGURACION_DEFAULT
  );
  const [horariosSemanales, setHorariosSemanales] =
    useState<HorariosSemanalesMap>(HORARIOS_DEFAULT);
  const [imagen, setImagen] = useState<ImagenSeleccionada | null>(null);
  const [imagenUrl, setImagenUrl] = useState<string | null>(null);
  const [imagenEliminada, setImagenEliminada] = useState(false);
  const imagenNombreOriginalRef = useRef<string | null>(null);

  // Resetear estado de imagen cuando cambia el espacio que se edita.
  // Necesario porque Expo Router reutiliza la instancia del componente
  // al navegar entre espacios sin desmontarlo.
  useEffect(() => {
    setImagen(null);
    setImagenUrl(null);
    setImagenEliminada(false);
    imagenNombreOriginalRef.current = null;
  }, [id]);

  useEffect(() => {
    if (!isEditMode || !id) return;

    const cargarEspacio = async () => {
      try {
        showLoading("Cargando zona común...");
        const response = await reservaService.obtenerEspacio(Number(id));

        if (!response.success || !response.espacio) {
          showToast(
            "No pudimos cargar la información de esta zona. Verifica tu conexión e inténtalo nuevamente.",
            "error"
          );
          router.back();
          return;
        }

        const espacio: EspacioAPI = response.espacio;

        setFormData({
          nombre: espacio.nombre || "",
          descripcion: espacio.descripcion || "",
          reglas: espacio.reglas || "",
          capacidad_maxima: espacio.capacidad_maxima?.toString() || "1",
          costo: espacio.costo?.toString() || "",
          hora_inicio: "06:00",
          hora_fin: "22:00",
          tiempo_minimo_reserva:
            espacio.tiempo_minimo_reserva?.toString() || "60",
          tiempo_maximo_reserva:
            espacio.tiempo_maximo_reserva?.toString() || "240",
          duracion_bloque: espacio.duracion_bloque?.toString() || "240",
          tiempo_reserva: espacio.tiempo_reserva?.toString() || "24",
        });

        setConfiguracion({
          estado: espacio.estado || "activa",
          tipo_reserva: espacio.tipo_reserva || "por_horas",
          requiere_aprobacion: espacio.requiere_aprobacion || false,
          fecha_mantenimiento: espacio.fecha_mantenimiento || "",
        });

        if (espacio.horarios && espacio.horarios.length > 0) {
          const horariosMap: HorariosSemanalesMap = {
            1: {
              activo: false,
              hora_inicio: "06:00",
              hora_fin: "22:00",
              precio_especial: "",
            },
            2: {
              activo: false,
              hora_inicio: "06:00",
              hora_fin: "22:00",
              precio_especial: "",
            },
            3: {
              activo: false,
              hora_inicio: "06:00",
              hora_fin: "22:00",
              precio_especial: "",
            },
            4: {
              activo: false,
              hora_inicio: "06:00",
              hora_fin: "22:00",
              precio_especial: "",
            },
            5: {
              activo: false,
              hora_inicio: "06:00",
              hora_fin: "22:00",
              precio_especial: "",
            },
            6: {
              activo: false,
              hora_inicio: "07:00",
              hora_fin: "23:59",
              precio_especial: "",
            },
            7: {
              activo: false,
              hora_inicio: "08:00",
              hora_fin: "20:00",
              precio_especial: "",
            },
          };
          espacio.horarios.forEach((horario: HorarioAPI) => {
            horariosMap[horario.dia_semana] = {
              activo: horario.activo,
              hora_inicio: horario.hora_inicio,
              hora_fin: horario.hora_fin,
              precio_especial: horario.precio_especial?.toString() || "",
            };
          });
          setHorariosSemanales(horariosMap);
        }

        if (espacio.imagen_nombre && selectedProject?.nit) {
          imagenNombreOriginalRef.current = espacio.imagen_nombre;
          setImagen({
            name: espacio.imagen_nombre,
            uploaded: true,
            existing: true,
          });
          const result = await s3Service.getEspacioImageUrl(
            selectedProject.nit,
            espacio.imagen_nombre
          );
          if (result.success && result.url) {
            setImagenUrl(result.url);
          }
        }
      } catch (e) {
        console.error("[useCargarEspacio] ERROR", e);
        showToast(
          "Problema de conexión. No pudimos cargar los datos de la zona.",
          "error"
        );
        router.back();
      } finally {
        hideLoading();
      }
    };

    cargarEspacio();
  }, [
    isEditMode,
    id,
    selectedProject?.nit,
    showLoading,
    hideLoading,
    showToast,
  ]);

  return {
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
    imagenNombreOriginal: imagenNombreOriginalRef.current,
  };
}
