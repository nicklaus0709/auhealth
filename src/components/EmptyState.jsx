import { cn } from "@/lib/utils";

export default function EmptyState({ icon: Icon, titulo, descripcion, accion, className }) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      {Icon && (
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-teal/10 text-brand-teal-700">
          <Icon className="h-6 w-6" strokeWidth={2} />
        </span>
      )}
      <p className="mt-4 font-heading text-base font-semibold text-foreground">{titulo}</p>
      {descripcion && <p className="mt-1 max-w-sm text-sm text-muted-foreground">{descripcion}</p>}
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  );
}