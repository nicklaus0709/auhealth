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

export function useObrasSociales({ incluirInactivas = false } = {}) {
  return useQuery({
    queryKey: ["obras-sociales", incluirInactivas],
    queryFn: async () =>
      lista(await base44.entities.ObraSocial.filter(incluirInactivas ? {} : { activo: true }, { sort: "nombre", limit: 300 })),
    staleTime: 10 * 60 * 1000,
  });
}

export function usePrestaciones({ incluirInactivas = false } = {}) {
  return useQuery({
    queryKey: ["prestaciones", incluirInactivas],
    queryFn: async () =>
      lista(await base44.entities.Prestacion.filter(incluirInactivas ? {} : { activo: true }, { sort: "nombre", limit: 300 })),
    staleTime: 10 * 60 * 1000,
  });
}

/** Valor que paga la obra social y coseguro del paciente para una prestación (o el precio particular). */
export function arancelDe(obraSocial, prestacion) {
  if (!prestacion) return { valor: 0, coseguro: 0 };
  if (!obraSocial) return { valor: 0, coseguro: Number(prestacion.precio_particular) || 0 };
  const a = (obraSocial.aranceles || []).find((x) => x.prestacion === prestacion.id);
  return { valor: Number(a?.valor) || 0, coseguro: Number(a?.coseguro) || 0 };
}
