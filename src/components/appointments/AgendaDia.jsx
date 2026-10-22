import { Ban, Plus } from "lucide-react";
import { ESTADOS_INFO } from "@/components/StatusBadge";
import { aMinutos, atiende, bloqueoDe, franjas } from "@/lib/agenda";
import { cn } from "@/lib/utils";

const ALTO_FRANJA = 44; // px por franja de la grilla
const SIN_ASIGNAR = { id: "", nombre_completo: "Sin profesional", color: "#64748B" };

/**
 * Vista día con grilla horaria: una columna por profesional, los huecos libres a la vista y
 * clic en un hueco para crear el turno ya con fecha, hora y profesional.
 */
export default function AgendaDia({ fecha, turnos, profesionales, bloqueos, consultorio, paso = 30, onNuevo, onElegirTurno }) {
  const apertura = consultorio?.hora_apertura || "08:00";
  const cierre = consultorio?.hora_cierre || "20:00";
  const filas = franjas(apertura, cierre, paso);
  const inicioGrilla = aMinutos(apertura);
  const pxPorMinuto = ALTO_FRANJA / paso;

  // Si hay turnos viejos sin profesional (o no hay profesionales cargados), se muestran en su propia columna
  const haySinAsignar = turnos.some((t) => !t.profesional || !profesionales.some((p) => p.id === t.profesional));
  const columnas = profesionales.length === 0 || haySinAsignar ? [...profesionales, SIN_ASIGNAR] : profesionales;

  const turnosDe = (col) =>
    turnos.filter((t) => (col.id ? t.profesional === col.id : !t.profesional || !profesionales.some((p) => p.id === t.profesional)));

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-soft">
      <div className="grid" style={{ gridTemplateColumns: `64px repeat(${columnas.length}, minmax(180px, 1fr))` }}>
        {/* Encabezados */}
        <div className="sticky left-0 z-10 border-b border-border bg-card" />
        {columnas.map((col) => {
          const bloqueo = col.id ? bloqueoDe(bloqueos, fecha, col.id) : bloqueoDe(bloqueos, fecha, null);
          return (
            <div key={col.id || "sin"} className="border-b border-l border-border px-3 py-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: col.color || "#259D91" }} />
                <p className="truncate text-sm font-semibold text-foreground">{col.nombre_completo}</p>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {bloqueo ? `Bloqueado: ${bloqueo.motivo || "sin atención"}` : col.especialidad || `${turnosDe(col).length} turno(s)`}
              </p>
            </div>
          );
        })}

        {/* Columna de horas */}
        <div className="sticky left-0 z-10 bg-card">
          {filas.map((hora) => (
            <div key={hora} className="tabular border-b border-border pr-2 pt-1 text-right text-[11px] text-muted-foreground" style={{ height: ALTO_FRANJA }}>
              {hora}
            </div>
          ))}
        </div>

        {/* Columnas por profesional */}
        {columnas.map((col) => {
          const bloqueo = bloqueoDe(bloqueos, fecha, col.id || null);
          return (
            <div key={col.id || "sin"} className="relative border-l border-border">
              {filas.map((hora) => {
                const disponible = !bloqueo && (!col.id || atiende(col, fecha, hora));
                return (
                  <button
                    key={hora}
                    type="button"
                    disabled={!disponible}
                    onClick={() => onNuevo({ fecha, hora, profesional: col.id ? col : null })}
                    aria-label={disponible ? `Nuevo turno ${hora} con ${col.nombre_completo}` : `${hora} sin atención`}
                    className={cn(
                      "group block w-full border-b border-border text-left transition-colors",
                      disponible ? "hover:bg-brand-teal/5" : "cursor-not-allowed bg-muted/60 [background-image:repeating-linear-gradient(45deg,transparent,transparent_6px,rgba(0,0,0,.03)_6px,rgba(0,0,0,.03)_12px)]"
                    )}
                    style={{ height: ALTO_FRANJA }}
                  >
                    {disponible && <Plus className="ml-2 h-3.5 w-3.5 text-brand-teal-700 opacity-0 group-hover:opacity-100" />}
                  </button>
                );
              })}

              {bloqueo && (
                <div className="pointer-events-none absolute inset-x-2 top-2 flex items-center gap-1.5 rounded-lg bg-card/90 px-2 py-1 text-xs font-medium text-muted-foreground shadow-soft">
                  <Ban className="h-3.5 w-3.5" />
                  {bloqueo.motivo || "Bloqueado"}
                </div>
              )}

              {turnosDe(col).map((t) => {
                const top = Math.max(aMinutos(t.hora_inicio) - inicioGrilla, 0) * pxPorMinuto;
                const alto = Math.max((aMinutos(t.hora_fin) - aMinutos(t.hora_inicio)) * pxPorMinuto - 2, 22);
                const info = ESTADOS_INFO[t.estado] || ESTADOS_INFO.pendiente;
                const Icono = info.icono;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onElegirTurno(t)}
                    className={cn(
                      "absolute inset-x-1 overflow-hidden rounded-lg border-l-4 px-2 py-1 text-left shadow-soft transition-shadow hover:shadow-soft-lg",
                      info.clase,
                      t.estado === "cancelado" && "opacity-60 line-through"
                    )}
                    style={{ top, height: alto, borderLeftColor: col.color || "#259D91" }}
                  >
                    <span className="flex items-center gap-1 text-[11px] font-semibold">
                      <Icono className="h-3 w-3 shrink-0" aria-label={info.label} />
                      <span className="tabular">{t.hora_inicio}</span>
                      <span className="truncate text-foreground">{t.paciente_nombre}</span>
                    </span>
                    {alto > 30 && <span className="block truncate text-[11px] text-muted-foreground">{t.tipo_consulta}</span>}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
