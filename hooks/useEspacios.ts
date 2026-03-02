import { useQuery } from "@tanstack/react-query";
import { reservaService } from "@/services/reservaService";
import { EspacioAPI, Espacio } from "@/types/Espacio";
import { useProject } from "@/contexts/ProjectContext";

export const useEspacios = (params?: {
  solo_activos?: boolean;
  incluir_horarios?: boolean;
}) => {
  const { selectedProject } = useProject();

  return useQuery({
    queryKey: ["espacios", selectedProject?.nit, params],
    queryFn: async () => {
      const response = await reservaService.listarEspaciosFresh(params);

      if (!response?.success) {
        throw new Error("Error al cargar espacios");
      }

      return (response.espacios || []) as (EspacioAPI & { id: number })[];
    },
    select: (espacios: (EspacioAPI & { id: number })[]) => {
      const espaciosTransformados: Espacio[] = espacios.map((e) => ({
        id: e.id,
        nombre: e.nombre || "Sin nombre",
        descripcion: e.descripcion || "",
        tipo_reserva: e.tipo_reserva || "por_horas",
        costo: e.costo || 0,
        capacidad_maxima: e.capacidad_maxima || 0,
        estado: e.estado || "inactiva",
        imagen_nombre: e.imagen_nombre,
        duracion_bloque: e.duracion_bloque,
        fecha_mantenimiento: e.fecha_mantenimiento,
      }));

      return espaciosTransformados.filter((e) => e.estado !== "inactiva");
    },
  });
};
