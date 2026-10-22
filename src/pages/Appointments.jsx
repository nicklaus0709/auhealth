import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { addDays, format, startOfWeek } from "date-fns";
import { Ban, CalendarDays, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import WeekSelector from "@/components/appointments/WeekSelector";
import WeekCalendar from "@/components/appointments/WeekCalendar";
import ViewToggle from "@/components/appointments/ViewToggle";
import AgendaDia from "@/components/appointments/AgendaDia";
import SalaEspera from "@/components/appointments/SalaEspera";
import BloqueosModal from "@/components/appointments/BloqueosModal";
import TurnoDetalleModal from "@/components/appointments/TurnoDetalleModal";
import AppointmentFormModal from "@/components/appointments/AppointmentFormModal";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/components/ConfirmProvider";
import useSesion from "@/hooks/useSesion";
import { useConsultorio, useMiProfesional, useProfesionales } from "@/hooks/useDatos";
import { bloqueoDe, superpuestos } from "@/lib/agenda";
import { fechaLarga, hoyISO } from "@/lib/format";
import { auditar, log } from "@/lib/log";

const TODOS = "__todos__";
const lista = (res) => res?.items ?? res ?? [];

export default function Appointments() {
  const { toast } = useToast();
  const confirmar = useConfirm();
  const { esAdmin, esMedico, nombre } = useSesion();
  const [params, setParams] = useSearchParams();
  const { data: profesionales = [] } = useProfesionales();
  const { data: miProfesional } = useMiProfesional();
  const { data: consultorio } = useConsultorio();
  const [dia, setDia] = useState(new Date());
  const [vista, setVista] = useState("dia");
  const [filtro, setFiltro] = useState(TODOS);
  const [turnos, setTurnos] = useState([]);
  const [bloqueos, setBloqueos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState(null); // { turno } o { inicial }
  const [detalle, setDetalle] = useState(null);
  const [bloqueosAbierto, setBloqueosAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  // Un médico ve su agenda por defecto
  useEffect(() => {
    if (miProfesional?.id) setFiltro(miProfesional.id);
  }, [miProfesional?.id]);

  // /appointments?paciente=<id> abre "Nuevo turno" con el paciente ya elegido (desde la ficha)
  useEffect(() => {
    const id = params.get("paciente");
    if (!id) return;
    base44.entities.Paciente.get(id)
      .then((paciente) => setForm({ inicial: { paciente } }))
      .catch((error) => log.error("No se pudo abrir el paciente pedido", error, { pantalla: "Appointments" }))
      .finally(() => setParams({}, { replace: true }));
  }, [params]);

  const inicioSemana = startOfWeek(dia, { weekStartsOn: 1 });
  const desde = vista === "semana" ? format(inicioSemana, "yyyy-MM-dd") : format(dia, "yyyy-MM-dd");
  const hasta = vista === "semana" ? format(addDays(inicioSemana, 6), "yyyy-MM-dd") : desde;

  const cargar = async () => {
    setCargando(true);
    try {
      const [ts, bs] = await Promise.all([
        base44.entities.Turno.filter({ fecha: { $gte: desde, $lte: hasta } }, { sort: "hora_inicio", limit: 500 }),
        base44.entities.Bloqueo.filter({ hasta: { $gte: hoyISO() < desde ? hoyISO() : desde } }, { sort: "desde", limit: 200 }),
      ]);
      setTurnos(lista(ts));
      setBloqueos(lista(bs));
    } catch (error) {
      log.error("No se pudo cargar la agenda", error, { pantalla: "Appointments" });
      toast({ variant: "destructive", title: "No pudimos cargar la agenda" });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [desde, hasta]);

  const visibles = useMemo(() => (filtro === TODOS ? turnos : turnos.filter((t) => t.profesional === filtro)), [turnos, filtro]);
  const columnas = filtro === TODOS ? profesionales : profesionales.filter((p) => p.id === filtro);
  const colorDe = (t) => profesionales.find((p) => p.id === t.profesional)?.color || null;

  const cambiarEstado = async (turno, estado, extra = {}) => {
    try {
      await base44.entities.Turno.update(turno.id, { estado, ...extra });
      setTurnos((ts) => ts.map((t) => (t.id === turno.id ? { ...t, estado, ...extra } : t)));
      setDetalle((d) => (d?.id === turno.id ? { ...d, estado, ...extra } : d));
      toast({ title: "Estado actualizado" });
    } catch (error) {
      log.error("No se pudo cambiar el estado del turno", error, { pantalla: "Appointments" });
      toast({ variant: "destructive", title: "No pudimos actualizar el estado" });
    }
  };

  const eliminar = async (turno) => {
    if (!(await confirmar({ titulo: `¿Eliminar el turno de ${turno.paciente_nombre}?`, confirmar: "Eliminar", peligro: true }))) return;
    try {
      await base44.entities.Turno.delete(turno.id);
      auditar("eliminar", "Turno", { registro: turno.id, paciente: turno.paciente, usuario_nombre: nombre });
      toast({ title: "Turno eliminado" });
      setDetalle(null);
      await cargar();
    } catch (error) {
      log.error("No se pudo eliminar el turno", error, { pantalla: "Appointments" });
      toast({ variant: "destructive", title: "No pudimos eliminar el turno" });
    }
  };

  const guardar = async (datos) => {
    const editando = form?.turno;
    setGuardando(true);
    try {
      const bloqueo = bloqueoDe(bloqueos, datos.fecha, datos.profesional || null);
      if (
        bloqueo &&
        !(await confirmar({
          titulo: "Ese día está bloqueado",
          descripcion: `${bloqueo.motivo || "Sin atención"}${bloqueo.profesional_nombre ? ` (${bloqueo.profesional_nombre})` : ""}. ¿Agendar igual?`,
          confirmar: "Agendar igual",
        }))
      ) {
        return;
      }
      const delDia = lista(await base44.entities.Turno.filter({ fecha: datos.fecha }, { limit: 300 }));
      const choques = superpuestos(delDia, { ...datos, id: editando?.id });
      if (
        choques.length &&
        !(await confirmar({
          titulo: "El horario se superpone",
          descripcion: `Ya hay ${choques.length} turno(s): ${choques.map((t) => `${t.hora_inicio} ${t.paciente_nombre}`).join(", ")}. ¿Agendarlo igual como sobreturno?`,
          confirmar: "Agendar igual",
        }))
      ) {
        return;
      }
      if (editando) {
        await base44.entities.Turno.update(editando.id, datos);
        toast({ title: "Turno actualizado" });
      } else {
        await base44.entities.Turno.create(datos);
        toast({ title: "Turno agendado" });
      }
      setForm(null);
      setDetalle(null);
      await cargar();
    } catch (error) {
      log.error("No se pudo guardar el turno", error, { pantalla: "Appointments" });
      toast({ variant: "destructive", title: "No pudimos guardar el turno", description: error?.message });
    } finally {
      setGuardando(false);
    }
  };

  const fechaDia = format(dia, "yyyy-MM-dd");

  return (
    <div>
      <PageHeader
        icon={CalendarDays}
        titulo="Agenda de Turnos"
        subtitulo="Gestiona las citas y turnos de pacientes"
        accion={
          <>
            <Button variant="outline" onClick={() => setBloqueosAbierto(true)}>
              <Ban className="mr-1.5 h-4 w-4" />
              Bloqueos
            </Button>
            <Button className="btn-gradient" onClick={() => setForm({ inicial: { fecha: fechaDia } })}>
              <Plus className="mr-1.5 h-4 w-4" />
              Nuevo Turno
            </Button>
          </>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <ViewToggle vista={vista} onVista={setVista} />
        {profesionales.length > 0 && (
          <Select value={filtro} onValueChange={setFiltro}>
            <SelectTrigger className="h-10 w-[240px] bg-card" aria-label="Filtrar por profesional">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={TODOS}>Todos los profesionales</SelectItem>
              {profesionales.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre_completo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {vista === "semana" ? (
        <WeekCalendar
          dia={dia}
          turnos={visibles}
          cargando={cargando}
          onDia={setDia}
          colorDe={colorDe}
          onElegirDia={(d) => {
            setDia(d);
            setVista("dia");
          }}
        />
      ) : (
        <>
          <WeekSelector dia={dia} onDia={setDia} />
          <h2 className="mb-3 font-heading text-base font-semibold text-foreground">
            {vista === "espera" ? "Sala de espera · " : "Turnos del "}
            {fechaLarga(dia)}
            {fechaDia === hoyISO() && <span className="ml-2 text-xs font-medium text-brand-teal-700">Hoy</span>}
          </h2>
          {cargando ? (
            <div className="flex justify-center py-14">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-brand-teal" />
            </div>
          ) : vista === "espera" ? (
            <SalaEspera turnos={visibles} onEstado={cambiarEstado} onElegirTurno={setDetalle} />
          ) : (
            <AgendaDia
              fecha={fechaDia}
              turnos={visibles}
              profesionales={columnas}
              bloqueos={bloqueos}
              consultorio={consultorio}
              onNuevo={(inicial) => setForm({ inicial })}
              onElegirTurno={setDetalle}
            />
          )}
        </>
      )}

      <TurnoDetalleModal
        turno={detalle}
        onOpenChange={(v) => !v && setDetalle(null)}
        onEstado={cambiarEstado}
        onEditar={(t) => {
          setDetalle(null);
          setForm({ turno: t });
        }}
        onEliminar={eliminar}
        esAdmin={esAdmin}
        esMedico={esMedico}
      />

      <AppointmentFormModal
        abierto={!!form}
        onOpenChange={(v) => !v && setForm(null)}
        turno={form?.turno || null}
        inicial={form?.inicial || null}
        dia={dia}
        profesionales={profesionales}
        onGuardar={guardar}
        guardando={guardando}
      />

      <BloqueosModal
        abierto={bloqueosAbierto}
        onOpenChange={setBloqueosAbierto}
        bloqueos={bloqueos}
        profesionales={profesionales}
        onCambio={cargar}
      />
    </div>
  );
}
