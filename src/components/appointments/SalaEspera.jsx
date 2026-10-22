import { DoorOpen, LogIn, Stethoscope, CheckCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import { fechaHora } from "@/lib/format";

const minutosDesde = (iso) => (iso ? Math.max(Math.round((Date.now() - new Date(iso).getTime()) / 60000), 0) : null);

/**
 * Flujo del día en recepción: quién falta llegar, quién está en sala (con minutos de espera) y quién está en consulta.
 * Los cambios son estados del turno: pendiente/confirmado → en_espera → en_consulta → atendido.
 */
export default function SalaEspera({ turnos, onEstado, onElegirTurno }) {
  const activos = turnos.filter((t) => !["cancelado"].includes(t.estado));
  const porLlegar = activos.filter((t) => ["pendiente", "confirmado"].includes(t.estado));
  const enSala = activos.filter((t) => t.estado === "en_espera").sort((a, b) => String(a.llegada).localeCompare(String(b.llegada)));
  const enConsulta = activos.filter((t) => t.estado === "en_consulta");

  const Columna = ({ titulo, icono: Icono, items, vacio, acciones }) => (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <h2 className="flex items-center gap-2 font-heading text-sm font-semibold text-foreground">
        <Icono className="h-4 w-4 text-brand-teal-700" />
        {titulo} ({items.length})
      </h2>
      {items.length === 0 ? (
        <p className="py-8 text-center text-xs text-muted-foreground">{vacio}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((t) => {
            const espera = t.estado === "en_espera" ? minutosDesde(t.llegada) : null;
            return (
              <li key={t.id} className="rounded-xl border border-border p-3">
                <button type="button" onClick={() => onElegirTurno(t)} className="w-full text-left">
                  <p className="text-sm font-medium text-foreground">{t.paciente_nombre}</p>
                  <p className="tabular text-xs text-muted-foreground">
                    {t.hora_inicio} · {t.profesional_nombre || "Sin profesional"}
                    {espera !== null && ` · espera ${espera} min`}
                  </p>
                </button>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge estado={t.estado} />
                  <div className="ml-auto flex gap-1.5">{acciones(t)}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );

  if (turnos.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <EmptyState icon={DoorOpen} titulo="No hay turnos para este día" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Columna
        titulo="Por llegar"
        icono={LogIn}
        items={porLlegar}
        vacio="Llegaron todos"
        acciones={(t) => (
          <>
            <Button size="sm" variant="outline" onClick={() => onEstado(t, "ausente")} aria-label={`Marcar ausente a ${t.paciente_nombre}`}>
              <UserX className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" className="btn-gradient" onClick={() => onEstado(t, "en_espera", { llegada: new Date().toISOString() })}>
              Llegó
            </Button>
          </>
        )}
      />
      <Columna
        titulo="En sala de espera"
        icono={DoorOpen}
        items={enSala}
        vacio="No hay nadie esperando"
        acciones={(t) => (
          <Button size="sm" className="btn-gradient" onClick={() => onEstado(t, "en_consulta")}>
            <Stethoscope className="mr-1 h-3.5 w-3.5" />
            Pasar
          </Button>
        )}
      />
      <Columna
        titulo="En consulta"
        icono={Stethoscope}
        items={enConsulta}
        vacio="Consultorios libres"
        acciones={(t) => (
          <Button size="sm" variant="outline" onClick={() => onEstado(t, "atendido")} title={t.llegada ? `Llegó ${fechaHora(t.llegada)}` : undefined}>
            <CheckCheck className="mr-1 h-3.5 w-3.5" />
            Atendido
          </Button>
        )}
      />
    </div>
  );
}
