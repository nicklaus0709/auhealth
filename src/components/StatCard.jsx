import { cn } from "@/lib/utils";

const TONOS = {
  teal: "bg-brand-teal/10 text-brand-teal",
  emerald: "bg-brand-emerald/10 text-brand-emerald",
  blue: "bg-brand-blue/10 text-brand-blue",
  amber: "bg-brand-amber/10 text-[#B87400]",
};

export default function StatCard({ etiqueta, valor, icon: Icon, tono = "teal", cargando = false, delay = 0 }) {
  return (
    <div
      className="animate-slide-up rounded-2xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-soft-lg"
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className={cn("grid h-11 w-11 place-items-center rounded-xl", TONOS[tono])}>
        <Icon className="h-5 w-5" strokeWidth={2.1} />
      </span>
      <p className="tabular mt-4 font-heading text-[32px] font-bold leading-none text-foreground">
        {cargando ? "—" : valor}
      </p>
      <p className="mt-1.5 text-sm text-muted-foreground">{etiqueta}</p>
    </div>
  );
}