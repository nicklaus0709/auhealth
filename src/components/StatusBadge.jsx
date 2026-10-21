import { cn } from "@/lib/utils";

const ESTILOS = {
  pendiente: "bg-brand-amber/10 text-[#B87400]",
  confirmado: "bg-brand-teal/10 text-brand-teal",
  atendido: "bg-brand-emerald/10 text-[#1E8552]",
  cancelado: "bg-brand-danger/10 text-brand-danger",
  activo: "bg-brand-emerald/10 text-[#1E8552]",
  inactivo: "bg-brand-danger/10 text-brand-danger",
};

const ETIQUETAS = {
  pendiente: "Pendiente",
  confirmado: "Confirmado",
  atendido: "Atendido",
  cancelado: "Cancelado",
  activo: "Activo",
  inactivo: "Inactivo",
};

export default function StatusBadge({ estado, className }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
        ESTILOS[estado] || "bg-muted text-muted-foreground",
        className
      )}
    >
      {ETIQUETAS[estado] || estado}
    </span>
  );
}