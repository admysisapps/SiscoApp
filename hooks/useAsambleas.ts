import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { asambleaService } from "@/services/asambleaService";
import { useProject } from "@/contexts/ProjectContext";
import { Asamblea } from "@/types/Asamblea";

export const useAsambleas = () => {
  const { selectedProject } = useProject();

  return useQuery({
    queryKey: ["asambleas", selectedProject?.nit],
    queryFn: async () => {
      if (!selectedProject) {
        throw new Error("No hay proyecto seleccionado");
      }

      const response = await asambleaService.getAsambleas(selectedProject.nit);

      if (!response?.success) {
        throw new Error("No se pudieron cargar las asambleas");
      }

      return (response.asambleas || []) as Asamblea[];
    },
    enabled: !!selectedProject,
    refetchOnMount: "always",
    staleTime: 0,
  });
};

export const useCrearAsamblea = () => {
  const queryClient = useQueryClient();
  const { selectedProject } = useProject();

  return useMutation({
    mutationFn: (asambleaData: any) =>
      asambleaService.crearAsamblea(asambleaData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["asambleas", selectedProject?.nit],
      });
    },
  });
};

export const useCambiarEstadoAsamblea = () => {
  const queryClient = useQueryClient();
  const { selectedProject } = useProject();

  return useMutation({
    mutationFn: ({
      asambleaId,
      nuevoEstado,
    }: {
      asambleaId: number;
      nuevoEstado: string;
    }) => asambleaService.cambiarEstadoAsamblea(asambleaId, nuevoEstado),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["asambleas", selectedProject?.nit],
      });
    },
  });
};
