import { addDays, format, isSameDay, isToday, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DIAS_CORTOS } from "@/lib/format";
import { cn } from "@/lib/utils";

const COLOR_ESTADO = {
  pendiente: "border-l-brand-amber bg-brand-amber/10",
  confirmado: "border-l-brand-teal bg-brand-teal/10",
  atendido: "border-l-brand-emerald bg-brand-emerald/10",
  cancelado: "border-l-brand-danger bg-brand-danger/10 opacity-70",
};

export default function WeekCalendar({ dia, turnos, cargando, onDia, onElegirDia }) {
  const inicio = startOfWeek(dia, { weekStartsOn: 1 });
  const dias = Array.from({ length: 7 }, (_, i) => addDays(inicio, i));

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="Semana anterior"
          onClick={() => onDia(addDays(inicio, -7))}
          className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-brand-teal"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="font-heading text-sm font-semibold text-foreground sm:text-base">
          {format(dias[0], "dd/MM")} al {format(dias[6], "dd/MM/yyyy")}
        </h2>
        <button
          type="button"
          aria-label="Semana siguiente"
          onClick={() => onDia(addDays(inicio, 7))}
          className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-brand-teal"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {cargando ? (
        <div className="flex justify-center py-14">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-brand-teal" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="grid min-w-[760px] grid-cols-7 gap-2">
            {dias.map((d) => {
              const iso = format(d, "yyyy-MM-dd");
              const delDia = turnos.filter((t) => t.fecha === iso);
              return (
                <div key={iso} className="flex min-h-[220px] flex-col rounded-xl border border-border bg-background/60">
                  <button
                    type="button"
                    onClick={() => onElegirDia(d)}
                    className={cn(
                      "rounded-t-xl border-b border-border px-2 py-2 text-center transition-colors hover:bg-brand-teal/5",
                      isSameDay(d, dia) && "bg-brand-teal/10"
                    )}
                  >
                    <span className="block text-[11px] uppercase text-muted-foreground">{DIAS_CORTOS[d.getDay()]}</span>
                    <span
                      className={cn(
                        "tabular text-base font-semibold",
                        isToday(d) ? "text-brand-teal" : "text-foreground"
                      )}
                    >
                      {format(d, "d")}
                    </span>
                  </button>

                  <div className="flex-1 space-y-1.5 p-1.5">
                    {delDia.length === 0 ? (
                      <p className="pt-4 text-center text-[11px] text-muted-foreground">Sin turnos</p>
                    ) : (
                      delDia.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => onElegirDia(d)}
                          className={cn(
                            "w-full rounded-md border-l-4 px-2 py-1.5 text-left transition-shadow hover:shadow-soft",
                            COLOR_ESTADO[t.estado] || COLOR_ESTADO.pendiente
                          )}
                        >
                          <span className="tabular block text-[11px] font-semibold text-foreground">{t.hora_inicio}</span>
                          <span className="block truncate text-[11px] text-foreground">{t.paciente_nombre}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}