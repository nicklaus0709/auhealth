import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useConsultorio } from "@/hooks/useDatos";

const EVENTOS = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];

/**
 * Cierra la sesión tras N minutos sin uso (configurable en Configuración → Consultorio; 0 = nunca).
 * Pensado para las PCs compartidas de recepción, donde queda la historia clínica abierta.
 */
export default function useInactividad() {
  const { data: consultorio } = useConsultorio();
  const minutos = Number(consultorio?.minutos_inactividad ?? 15);

  useEffect(() => {
    if (!minutos || minutos <= 0) return undefined;
    let timer;
    const reiniciar = () => {
      clearTimeout(timer);
      timer = setTimeout(() => base44.auth.logout("/auth?motivo=inactividad"), minutos * 60 * 1000);
    };
    EVENTOS.forEach((evento) => window.addEventListener(evento, reiniciar, { passive: true }));
    reiniciar();
    return () => {
      clearTimeout(timer);
      EVENTOS.forEach((evento) => window.removeEventListener(evento, reiniciar));
    };
  }, [minutos]);
}
