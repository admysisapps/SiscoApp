import { useMemo } from "react";
import { useApartment } from "@/contexts/ApartmentContext";
import { mockCuentaCobro1, mockCuentaCobro2 } from "@/data/cuentaCobroMock";
import { CuentaCobro } from "@/types/cuentaCobro";

export function useCuentaCobro(): { cuentaCobro: CuentaCobro | null } {
  const { selectedApartment } = useApartment();

  const cuentaCobro = useMemo(() => {
    if (!selectedApartment?.codigo_apt) return null;

    const numero = parseInt(
      selectedApartment.codigo_apt.replace(/\D/g, ""),
      10
    );
    const base =
      isNaN(numero) || numero % 2 === 0 ? mockCuentaCobro1 : mockCuentaCobro2;

    return {
      ...base,
      unidad:
        parseInt(selectedApartment.numero, 10) || selectedApartment.numero,
    } as unknown as CuentaCobro;
  }, [selectedApartment?.codigo_apt]);

  return { cuentaCobro };
}
