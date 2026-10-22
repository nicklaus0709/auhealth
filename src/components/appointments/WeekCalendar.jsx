import { addDays, format, isSameDay, isToday, startOfWeek } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DIAS_CORTOS } from "@/lib/format";
import { ESTADOS_INFO } from "@/components/StatusBadge";
import { cn } from "@/lib/utils";

const COLOR_ESTADO = {
  pendiente: "border-l-brand-amber bg-brand-amber/10",
  confirmado: "border-l-brand-teal bg-brand-teal/10",
  en_espera: "border-l-brand-blue bg-brand-blue/10",
  en_consulta: "border-l-brand-teal-700 bg-brand-teal/15",
  ausente: "border-l-muted-foreground bg-muted opacity-70",
  atendido: "border-l-brand-emerald bg-brand-emerald/10",
  cancelado: "border-l-brand-danger bg-brand-danger/10 opacity-70",
};

export default function WeekCalendar({ dia, turnos, cargando, onDia, onElegirDia, colorDe = () => null }) {
  const inicio = startOfWeek(dia, { weekStartsOn: 1 });
  const dias = Array.from({ length: 7 }, (_, i) => addDays(inicio, i));

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-soft sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          aria-label="Semana anterior"
          onClick={() => onDia(addDays(inicio, -7))}
          className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-brand-teal-700"
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
          className="grid h-9 w-9 place-items-center rounded-xl border border-border text-muted-foreground transition-colors hover:text-brand-teal-700"
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
          {/* En celular los días van uno debajo del otro en vez de obligar a scrollear de costado */}
          <div className="grid grid-cols-1 gap-2 sm:min-w-[760px] sm:grid-cols-7">
            {dias.map((d) => {
              const iso = format(d, "yyyy-MM-dd");
              const delDia = turnos.filter((t) => t.fecha === iso);
              return (
                <div key={iso} className="flex flex-col rounded-xl border border-border bg-background/60 sm:min-h-[220px]">
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
                        isToday(d) ? "text-brand-teal-700" : "text-foreground"
                      )}
                    >
                      {format(d, "d")}
                    </span>
                  </button>

                  <div className="flex-1 space-y-1.5 p-1.5">
                    {delDia.length === 0 ? (
                      <p className="pt-4 text-center text-[11px] text-muted-foreground">Sin turnos</p>
                    ) : (
                      delDia.map((t) => {
                        const Icono = ESTADOS_INFO[t.estado]?.icono;
                        const color = colorDe(t);
                        return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => onElegirDia(d)}
                          className={cn(
                            "w-full rounded-md border-l-4 px-2 py-1.5 text-left transition-shadow hover:shadow-soft",
                            COLOR_ESTADO[t.estado] || COLOR_ESTADO.pendiente
                          )}
                        >
                          <span className="tabular flex items-center gap-1 text-[11px] font-semibold text-foreground">
                            {Icono && <Icono className="h-3 w-3" aria-label={ESTADOS_INFO[t.estado].label} />}
                            {t.hora_inicio}
                            {color && <span className="ml-auto h-2 w-2 rounded-full" style={{ backgroundColor: color }} aria-hidden="true" />}
                          </span>
                          <span className="block truncate text-[11px] text-foreground">{t.paciente_nombre}</span>
                        </button>
                        );
                      })
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