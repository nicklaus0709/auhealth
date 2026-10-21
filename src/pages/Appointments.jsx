import { useEffect, useState } from "react";
import { addDays, format, startOfWeek } from "date-fns";
import { base44 } from "@/api/base44Client";
import { CalendarDays, CalendarPlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import WeekSelector from "@/components/appointments/WeekSelector";
import AppointmentRow from "@/components/appointments/AppointmentRow";
import WeekCalendar from "@/components/appointments/WeekCalendar";
import ViewToggle from "@/components/appointments/ViewToggle";
import AppointmentFormModal from "@/components/appointments/AppointmentFormModal";
import { useToast } from "@/components/ui/use-toast";
import useSesion from "@/hooks/useSesion";
import { fechaLarga, hoyISO } from "@/lib/format";

export default function Appointments() {
  const { toast } = useToast();
  const { esAdmin } = useSesion();
  const [dia, setDia] = useState(new Date());
  const [vista, setVista] = useState("dia");
  const [turnos, setTurnos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await base44.entities.Paciente.filter({ activo: true }, { sort: "nombre_completo", limit: 300 });
      setPacientes(res.items ?? res);
    })();
  }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      const inicioSemana = startOfWeek(dia, { weekStartsOn: 1 });
      const consulta =
        vista === "semana"
          ? {
              fecha: {
                $gte: format(inicioSemana, "yyyy-MM-dd"),
                $lte: format(addDays(inicioSemana, 6), "yyyy-MM-dd"),
              },
            }
          : { fecha: format(dia, "yyyy-MM-dd") };
      const res = await base44.entities.Turno.filter(consulta, { sort: "hora_inicio", limit: 300 });
      setTurnos(res.items ?? res);
    } finally {
      setCargando(false);
    }
  };

  const semanaClave = format(startOfWeek(dia, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const claveCarga = vista === "semana" ? semanaClave : format(dia, "yyyy-MM-dd");

  useEffect(() => {
    cargar();
  }, [claveCarga, vista]);

  const cambiarEstado = async (turno, estado) => {
    try {
      await base44.entities.Turno.update(turno.id, { estado });
      toast({ title: "Estado actualizado" });
      await cargar();
    } catch (error) {
      toast({ variant: "destructive", title: "No pudimos actualizar el estado" });
    }
  };

  const eliminar = async (turno) => {
    const confirmado = window.confirm(`¿Eliminar el turno de ${turno.paciente_nombre}?`);
    if (!confirmado) return;
    try {
      await base44.entities.Turno.delete(turno.id);
      toast({ title: "Turno eliminado" });
      await cargar();
    } catch (error) {
      toast({ variant: "destructive", title: "No pudimos eliminar el turno" });
    }
  };

  const guardar = async (datos) => {
    setGuardando(true);
    try {
      await base44.entities.Turno.create(datos);
      toast({ title: "Turno agendado" });
      setModalAbierto(false);
      await cargar();
    } catch (error) {
      toast({ variant: "destructive", title: "No pudimos agendar el turno", description: error?.message });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div>
      <PageHeader
        icon={CalendarDays}
        titulo="Agenda de Turnos"
        subtitulo="Gestiona las citas y turnos de pacientes"
        accion={
          <Button className="btn-gradient" onClick={() => setModalAbierto(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo Turno
          </Button>
        }
      />

      <ViewToggle vista={vista} onVista={setVista} />

      {vista === "semana" && (
        <WeekCalendar
          dia={dia}
          turnos={turnos}
          cargando={cargando}
          onDia={setDia}
          onElegirDia={(d) => {
            setDia(d);
            setVista("dia");
          }}
        />
      )}

      {vista === "dia" && <WeekSelector dia={dia} onDia={setDia} />}

      {vista === "dia" && (
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <h2 className="font-heading text-base font-semibold text-foreground">Turnos del {fechaLarga(dia)}</h2>
        {format(dia, "yyyy-MM-dd") === hoyISO() && (
          <span className="mt-1 inline-block text-xs font-medium text-brand-teal">Hoy</span>
        )}

        <div className="mt-4">
          {cargando ? (
            <div className="flex justify-center py-14">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-brand-teal" />
            </div>
          ) : turnos.length === 0 ? (
            <EmptyState
              icon={CalendarPlus}
              titulo="No hay turnos agendados para esta fecha"
              accion={
                <Button className="btn-gradient" onClick={() => setModalAbierto(true)}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Nuevo Turno
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {turnos.map((turno) => (
                <AppointmentRow
                  key={turno.id}
                  turno={turno}
                  onEstado={cambiarEstado}
                  onEliminar={eliminar}
                  esAdmin={esAdmin}
                />
              ))}
            </div>
          )}
        </div>
      </section>
      )}

      <AppointmentFormModal
        abierto={modalAbierto}
        onOpenChange={setModalAbierto}
        pacientes={pacientes}
        dia={dia}
        onGuardar={guardar}
        guardando={guardando}
      />
    </div>
  );
}