import { cn } from "@/lib/utils";

const OPCIONES = [
  { value: "dia", label: "Día" },
  { value: "semana", label: "Semana" },
];

export default function ViewToggle({ vista, onVista }) {
  return (
    <div className="mb-4 inline-flex rounded-xl border border-border bg-card p-1">
      {OPCIONES.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onVista(o.value)}
          className={cn(
            "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
            vista === o.value ? "bg-brand-teal text-white" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}