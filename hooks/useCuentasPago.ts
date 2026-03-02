import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cuentasPagoService } from "@/services/cuentasPagoService";
import { useProject } from "@/contexts/ProjectContext";
import { CuentaPago } from "@/types/CuentaPago";

export const useCuentasPago = () => {
  const { selectedProject } = useProject();

  return useQuery({
    queryKey: ["cuentas-pago", selectedProject?.nit],
    queryFn: async () => {
      const response = await cuentasPagoService.obtenerCuentasPago();

      if (!response?.success) {
        throw new Error("Error al cargar métodos de pago");
      }

      return (response.cuentas || []) as CuentaPago[];
    },
    enabled: !!selectedProject,
  });
};

export const useCrearCuentaPago = () => {
  const queryClient = useQueryClient();
  const { selectedProject } = useProject();

  return useMutation({
    mutationFn: (cuentaData: Omit<CuentaPago, "id">) =>
      cuentasPagoService.crearCuentaPago(cuentaData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cuentas-pago", selectedProject?.nit],
      });
    },
  });
};

export const useEditarCuentaPago = () => {
  const queryClient = useQueryClient();
  const { selectedProject } = useProject();

  return useMutation({
    mutationFn: ({
      cuentaId,
      cuentaData,
    }: {
      cuentaId: number;
      cuentaData: Partial<CuentaPago>;
    }) => cuentasPagoService.editarCuentaPago(cuentaId, cuentaData),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cuentas-pago", selectedProject?.nit],
      });
    },
  });
};

export const useEliminarCuentaPago = () => {
  const queryClient = useQueryClient();
  const { selectedProject } = useProject();

  return useMutation({
    mutationFn: (cuentaId: number) =>
      cuentasPagoService.eliminarCuentaPago(cuentaId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["cuentas-pago", selectedProject?.nit],
      });
    },
  });
};
