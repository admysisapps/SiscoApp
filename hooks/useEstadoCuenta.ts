import { useQuery } from "@tanstack/react-query";
import { useProject } from "@/contexts/ProjectContext";
import { useApartment } from "@/contexts/ApartmentContext";
import { swService } from "@/services/swService";
import { CuentaCobro } from "@/types/cuentaCobro";

const CURRENT_YEAR = new Date().getFullYear().toString();
const PREV_YEAR = (new Date().getFullYear() - 1).toString();

export function useEstadoCuenta(): {
  estadoCuenta: CuentaCobro | null;
  isLoading: boolean;
  error: Error | null;
} {
  const { selectedProject } = useProject();
  const { selectedApartment } = useApartment();

  const nit = selectedProject?.nit ?? null;
  const codigo = selectedApartment?.codigo_apt ?? null;

  const { data, isLoading, error } = useQuery({
    queryKey: ["estado-cuenta", nit, codigo, CURRENT_YEAR],
    queryFn: () => swService.getEstadoCuenta(CURRENT_YEAR, nit!, codigo!),
    enabled: !!nit && !!codigo,
    staleTime: 5 * 60 * 1000,
  });

  return {
    estadoCuenta: data ?? null,
    isLoading,
    error: error as Error | null,
  };
}

export function useEstadoCuentaAnioAnterior(): {
  estadoCuenta: CuentaCobro | null;
  isLoading: boolean;
  error: Error | null;
  fetch: () => void;
} {
  const { selectedProject } = useProject();
  const { selectedApartment } = useApartment();

  const nit = selectedProject?.nit ?? null;
  const codigo = selectedApartment?.codigo_apt ?? null;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["estado-cuenta", nit, codigo, PREV_YEAR],
    queryFn: () => swService.getEstadoCuenta(PREV_YEAR, nit!, codigo!),
    enabled: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    estadoCuenta: data ?? null,
    isLoading,
    error: error as Error | null,
    fetch: () => {
      void refetch();
    },
  };
}
