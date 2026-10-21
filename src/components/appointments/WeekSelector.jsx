import { addDays, format, isSameDay, isToday, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DIAS_CORTOS } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function WeekSelector({ dia, onDia }) {
  const inicio = startOfWeek(dia, { weekStartsOn: 1 });
  const dias = Array.from({ length: 7 }, (_, i) => addDays(inicio, i));

  return (
    <div className="mb-6 flex items-center gap-1.5 sm:gap-2">
      <button
        type="button"
        aria-label="Semana anterior"
        onClick={() => onDia(addDays(inicio, -7))}
        className="grid h-10 w-9 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-brand-teal"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="grid flex-1 grid-cols-7 gap-1.5 sm:gap-2">
        {dias.map((d) => {
          const elegido = isSameDay(d, dia);
          const hoy = isToday(d);
          return (
            <button
              key={format(d, "yyyy-MM-dd")}
              type="button"
              onClick={() => onDia(d)}
              className={cn(
                "flex flex-col items-center rounded-xl border px-1 py-2.5 transition-colors",
                elegido
                  ? "border-brand-teal bg-brand-teal/10"
                  : "glass border-white/60 hover:border-brand-teal/40"
              )}
            >
              <span className={cn("text-[11px] uppercase", elegido ? "text-brand-teal" : "text-muted-foreground")}>
                {DIAS_CORTOS[d.getDay()]}
              </span>
              <span
                className={cn(
                  "tabular mt-0.5 text-base font-semibold",
                  elegido || hoy ? "text-brand-teal" : "text-foreground"
                )}
              >
                {format(d, "d")}
              </span>
              {hoy && (
                <span className={cn("mt-1 h-1 w-1 rounded-full", elegido ? "bg-brand-teal" : "bg-brand-teal/50")} />
              )}
            </button>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Semana siguiente"
        onClick={() => onDia(addDays(inicio, 7))}
        className="grid h-10 w-9 shrink-0 place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:text-brand-teal"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}