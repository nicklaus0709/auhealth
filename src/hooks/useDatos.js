import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import useSesion from "@/hooks/useSesion";

const lista = (res) => res?.items ?? res ?? [];

// Datos de configuración que usan varias pantallas: se cachean con React Query en vez de pedirlos en cada una.

export function useProfesionales({ incluirInactivos = false } = {}) {
  return useQuery({
    queryKey: ["profesionales", incluirInactivos],
    queryFn: async () =>
      lista(
        await base44.entities.Profesional.filter(incluirInactivos ? {} : { activo: true }, {
          sort: "nombre_completo",
          limit: 100,
        })
      ),
    staleTime: 5 * 60 * 1000,
  });
}

/** Ficha profesional vinculada al usuario logueado (si es médico y el admin la cargó). */
export function useMiProfesional() {
  const { user } = useSesion();
  const { data: profesionales = [], ...resto } = useProfesionales({ incluirInactivos: true });
  return { data: profesionales.find((p) => p.usuario && p.usuario === user?.id) || null, ...resto };
}

export function useConsultorio() {
  return useQuery({
    queryKey: ["consultorio"],
    queryFn: async () => lista(await base44.entities.Consultorio.list({ limit: 1 }))[0] || null,
    staleTime: 10 * 60 * 1000,
  });
}

export function useRefrescar() {
  const cliente = useQueryClient();
  return (...claves) => Promise.all(claves.map((clave) => cliente.invalidateQueries({ queryKey: [clave] })));
}
