import { useQuery } from "@tanstack/react-query";
import { useProject } from "@/contexts/ProjectContext";
import { useApartment } from "@/contexts/ApartmentContext";
import { swService } from "@/services/swService";
import { CuentaCobro } from "@/types/cuentaCobro";

const CURRENT_YEAR = new Date().getFullYear().toString();

export function useCuentaCobro(): {
  cuentaCobro: CuentaCobro | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
} {
  const { selectedProject } = useProject();
  const { selectedApartment } = useApartment();

  const nit = selectedProject?.nit ?? null;
  const codigo = selectedApartment?.codigo_apt ?? null;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["cuenta-cobro", nit, codigo, CURRENT_YEAR],
    queryFn: () => swService.getCuentaCobro(CURRENT_YEAR, nit!, codigo!),
    enabled: !!nit && !!codigo,
    staleTime: 5 * 60 * 1000,
  });

  return {
    cuentaCobro: data ?? null,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}
