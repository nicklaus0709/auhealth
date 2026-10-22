import { Ban, Check, CheckCheck, CircleDashed, Clock, DoorOpen, Stethoscope, UserX } from "lucide-react";
import { cn } from "@/lib/utils";

// Cada estado lleva color e ícono: así no depende sólo del color (daltonismo, pantallas con poco brillo).
export const ESTADOS_INFO = {
  pendiente: { label: "Pendiente", clase: "bg-brand-amber/10 text-brand-amber-700", icono: Clock },
  confirmado: { label: "Confirmado", clase: "bg-brand-teal/10 text-brand-teal-700", icono: Check },
  en_espera: { label: "En sala de espera", clase: "bg-brand-blue/10 text-brand-blue-700", icono: DoorOpen },
  en_consulta: { label: "En consulta", clase: "bg-brand-teal/15 text-brand-teal-700", icono: Stethoscope },
  atendido: { label: "Atendido", clase: "bg-brand-emerald/10 text-brand-emerald-700", icono: CheckCheck },
  ausente: { label: "Ausente", clase: "bg-muted text-muted-foreground", icono: UserX },
  cancelado: { label: "Cancelado", clase: "bg-brand-danger/10 text-brand-danger-700", icono: Ban },
  activo: { label: "Activo", clase: "bg-brand-emerald/10 text-brand-emerald-700", icono: Check },
  inactivo: { label: "Inactivo", clase: "bg-brand-danger/10 text-brand-danger-700", icono: Ban },
  pagado: { label: "Pagado", clase: "bg-brand-emerald/10 text-brand-emerald-700", icono: CheckCheck },
  parcial: { label: "Parcial", clase: "bg-brand-amber/10 text-brand-amber-700", icono: CircleDashed },
};

// Estados que se eligen para un turno, en el orden del flujo del día
export const ESTADOS_TURNO = ["pendiente", "confirmado", "en_espera", "en_consulta", "atendido", "ausente", "cancelado"].map(
  (value) => ({ value, label: ESTADOS_INFO[value].label })
);

export default function StatusBadge({ estado, className }) {
  const info = ESTADOS_INFO[estado];
  const Icono = info?.icono;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
        info?.clase || "bg-muted text-muted-foreground",
        className
      )}
    >
      {Icono && <Icono className="h-3 w-3" aria-hidden="true" />}
      {info?.label || estado}
    </span>
  );
}
