import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { avisosService } from "@/services/avisoService";
import { useProject } from "@/contexts/ProjectContext";
import { Aviso, CreateAvisoRequest } from "@/types/Avisos";

export const useAvisos = (limite: number = 10) => {
  const { selectedProject } = useProject();

  return useInfiniteQuery({
    queryKey: ["avisos", selectedProject?.nit, limite],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await avisosService.obtenerAvisos(pageParam, limite);

      if (!response?.success) {
        throw new Error("Error al cargar comunicados");
      }

      return {
        avisos: (response.avisos || []) as Aviso[],
        pagina: pageParam,
        total_paginas: response.total_paginas || 1,
      };
    },
    getNextPageParam: (lastPage) => {
      return lastPage.pagina < lastPage.total_paginas
        ? lastPage.pagina + 1
        : undefined;
    },
    initialPageParam: 1,
  });
};

export const useCrearAviso = () => {
  const queryClient = useQueryClient();
  const { selectedProject } = useProject();

  return useMutation({
    mutationFn: (avisoData: CreateAvisoRequest) =>
      avisosService.crearAviso(avisoData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["avisos", selectedProject?.nit],
      });
    },
  });
};
