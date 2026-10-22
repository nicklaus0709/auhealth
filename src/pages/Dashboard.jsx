import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { addDays, format, startOfMonth, endOfMonth } from "date-fns";
import { Activity, ArrowRight, CalendarDays, DoorOpen, FileText, LayoutDashboard, Receipt, UserPlus, UserX, Users, Wallet } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import StatusBadge from "@/components/StatusBadge";
import BarrasHorizontales from "@/components/dashboard/BarrasHorizontales";
import RecordatorioBotones from "@/components/appointments/RecordatorioBotones";
import useSesion from "@/hooks/useSesion";
import { useMiProfesional } from "@/hooks/useDatos";
import { METODOS, moneda, resumir } from "@/lib/earnings";
import { hoyISO } from "@/lib/format";
import { log } from "@/lib/log";

const lista = (res) => res?.items ?? res ?? [];
const ahoraHHmm = () => format(new Date(), "HH:mm");

function TurnosDeHoy({ turnos, titulo, vacio }) {
  const proximos = turnos.filter((t) => !["atendido", "cancelado", "ausente"].includes(t.estado));
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-sm font-semibold text-foreground">{titulo}</h2>
        <Link to="/appointments" className="inline-flex items-center gap-1 text-xs font-medium text-brand-teal-700 hover:underline">
          Ver agenda <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
      {proximos.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{vacio}</p>
      ) : (
        <ul className="mt-3 divide-y divide-border">
          {proximos.slice(0, 8).map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-2.5 text-sm">
              <span className="tabular w-12 shrink-0 font-medium text-foreground">{t.hora_inicio}</span>
              <Link to={`/patients/${t.paciente}`} className="min-w-0 flex-1 truncate text-foreground hover:text-brand-teal-700 hover:underline">
                {t.paciente_nombre}
                {t.profesional_nombre && <span className="text-muted-foreground"> · {t.profesional_nombre}</span>}
              </Link>
              <StatusBadge estado={t.estado} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Dashboard() {
  const { esAdmin, esMedico, user, nombre } = useSesion();
  const { data: miProfesional } = useMiProfesional();
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const hoy = hoyISO();
      const inicioMes = format(startOfMonth(new Date()), "yyyy-MM-dd");
      const finMes = format(endOfMonth(new Date()), "yyyy-MM-dd");
      try {
        const manana = format(addDays(new Date(), 1), "yyyy-MM-dd");
        const [turnosHoy, turnosManana, pacientesActivos, turnosMes, pacientesNuevos, pagosMes, atencionesMes] = await Promise.all([
          base44.entities.Turno.filter({ fecha: hoy }, { sort: "hora_inicio", limit: 300 }),
          base44.entities.Turno.filter({ fecha: manana, estado: { $in: ["pendiente", "confirmado"] } }, { sort: "hora_inicio", limit: 300 }),
          base44.entities.Paciente.count({ activo: true }),
          esAdmin ? base44.entities.Turno.filter({ fecha: { $gte: inicioMes, $lte: finMes } }, { limit: 2000 }) : [],
          esAdmin ? base44.entities.Paciente.count({ created_date: { $gte: `${inicioMes}T00:00:00` } }) : 0,
          esAdmin ? base44.entities.Pago.filter({ fecha: { $gte: inicioMes, $lte: finMes } }, { limit: 2000 }) : [],
          esMedico ? base44.entities.HistorialClinico.count({ medico: user?.id, fecha_atencion: { $gte: `${inicioMes}T00:00:00` } }) : 0,
        ]);
        if (vivo) {
          setDatos({
            turnosHoy: lista(turnosHoy),
            turnosManana: lista(turnosManana),
            pacientesActivos,
            turnosMes: lista(turnosMes),
            pacientesNuevos,
            pagosMes: lista(pagosMes),
            atencionesMes,
          });
        }
      } catch (error) {
        log.error("No se pudo cargar el dashboard", error, { pantalla: "Dashboard" });
        if (vivo) setDatos({ turnosHoy: [], turnosManana: [], pacientesActivos: 0, turnosMes: [], pacientesNuevos: 0, pagosMes: [], atencionesMes: 0 });
      }
    })();
    return () => {
      vivo = false;
    };
  }, [esAdmin, esMedico, user?.id]);

  const cargando = !datos;
  const turnosHoy = datos?.turnosHoy || [];
  const misTurnos = miProfesional ? turnosHoy.filter((t) => t.profesional === miProfesional.id) : turnosHoy;
  const enSala = turnosHoy.filter((t) => t.estado === "en_espera").length;
  const sinConfirmar = turnosHoy.filter((t) => t.estado === "pendiente").length;
  const proximoPaciente = misTurnos.find((t) => ["en_espera", "confirmado", "pendiente"].includes(t.estado) && t.hora_fin >= ahoraHHmm());

  // Admin: ingresos y ausentismo del mes
  const resumen = resumir(datos?.pagosMes || []);
  const porObraSocial = Object.entries(
    (datos?.pagosMes || []).reduce((acc, p) => {
      const clave = p.obra_social?.trim() || "Particular";
      acc[clave] = (acc[clave] || 0) + (Number(p.cobrado) || 0);
      return acc;
    }, {})
  ).map(([etiqueta, valor]) => ({ etiqueta, valor }));
  const turnosPasados = (datos?.turnosMes || []).filter((t) => t.fecha < hoyISO() && t.estado !== "cancelado");
  const ausentismo = turnosPasados.length
    ? Math.round((turnosPasados.filter((t) => t.estado === "ausente").length / turnosPasados.length) * 100)
    : 0;

  return (
    <div>
      <PageHeader icon={LayoutDashboard} titulo={`Hola${nombre ? `, ${nombre.split(" ")[0]}` : ""}`} subtitulo="Lo importante de hoy en el consultorio" />

      {/* Recepción y todos: el día */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard etiqueta="Turnos hoy" valor={turnosHoy.filter((t) => t.estado !== "cancelado").length} icon={CalendarDays} to="/appointments" tono="amber" cargando={cargando} delay={0} />
        <StatCard etiqueta="En sala de espera" valor={enSala} icon={DoorOpen} to="/appointments" tono="blue" cargando={cargando} delay={80} />
        <StatCard etiqueta="Sin confirmar hoy" valor={sinConfirmar} icon={Activity} to="/appointments" tono="teal" cargando={cargando} delay={160} />
        <StatCard etiqueta="Pacientes activos" valor={datos?.pacientesActivos ?? 0} icon={Users} to="/patients" tono="emerald" cargando={cargando} delay={240} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <TurnosDeHoy
          turnos={misTurnos}
          titulo={miProfesional ? "Tu agenda de hoy" : "Próximos turnos de hoy"}
          vacio="No quedan turnos pendientes hoy"
        />

        {esMedico ? (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-heading text-sm font-semibold text-foreground">Próximo paciente</h2>
            {proximoPaciente ? (
              <div className="mt-4">
                <p className="text-lg font-semibold text-foreground">{proximoPaciente.paciente_nombre}</p>
                <p className="tabular text-sm text-muted-foreground">
                  {proximoPaciente.hora_inicio} · {proximoPaciente.tipo_consulta}
                </p>
                <div className="mt-2">
                  <StatusBadge estado={proximoPaciente.estado} />
                </div>
                <Link
                  to={`/patients/${proximoPaciente.paciente}`}
                  className="btn-gradient mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white"
                >
                  <FileText className="h-4 w-4" />
                  Abrir ficha
                </Link>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">No tenés más pacientes por hoy</p>
            )}
            <p className="mt-5 border-t border-border pt-3 text-xs text-muted-foreground">
              Atenciones registradas este mes: <span className="tabular font-semibold text-foreground">{datos?.atencionesMes ?? "—"}</span>
            </p>
          </section>
        ) : (
          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-heading text-sm font-semibold text-foreground">Accesos rápidos</h2>
            <div className="mt-3 grid gap-2">
              <Link to="/appointments" className="rounded-xl border border-border px-3 py-3 text-sm font-medium text-foreground hover:bg-muted">
                Sala de espera y agenda
              </Link>
              <Link to="/patients" className="rounded-xl border border-border px-3 py-3 text-sm font-medium text-foreground hover:bg-muted">
                Pacientes
              </Link>
              <Link to="/earnings" className="rounded-xl border border-border px-3 py-3 text-sm font-medium text-foreground hover:bg-muted">
                Registrar un cobro
              </Link>
            </div>
          </section>
        )}
      </div>

      {(datos?.turnosManana || []).length > 0 && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h2 className="font-heading text-sm font-semibold text-foreground">
            Recordatorios para mañana ({datos.turnosManana.filter((t) => !t.recordatorio_enviado).length} sin enviar)
          </h2>
          <ul className="mt-3 divide-y divide-border">
            {datos.turnosManana.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
                <span className="tabular w-12 shrink-0 font-medium">{t.hora_inicio}</span>
                <span className="min-w-0 flex-1 truncate">
                  {t.paciente_nombre}
                  {t.profesional_nombre && <span className="text-muted-foreground"> · {t.profesional_nombre}</span>}
                </span>
                <RecordatorioBotones
                  turno={t}
                  compacto
                  onRecordado={(turno, medio) =>
                    setDatos((d) => ({
                      ...d,
                      turnosManana: d.turnosManana.map((x) => (x.id === turno.id ? { ...x, recordatorio_enviado: new Date().toISOString(), recordatorio_medio: medio } : x)),
                    }))
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {esAdmin && (
        <>
          <h2 className="mb-1 mt-8 font-heading text-base font-semibold text-foreground">Este mes</h2>
          {/* Hoy cada usuario ve sólo los cobros que registró (RLS de Pago): ver si el admin debe ver todos */}
          <p className="mb-3 text-xs text-muted-foreground">Los importes incluyen los cobros que registraste vos.</p>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard etiqueta="Cobrado" valor={cargando ? 0 : moneda(resumen.cobrado)} icon={Wallet} to="/earnings" tono="emerald" cargando={cargando} />
            <StatCard etiqueta="Cobrado sin facturar" valor={cargando ? 0 : moneda(resumen.sinFacturar)} icon={Receipt} to="/earnings" tono="amber" cargando={cargando} />
            <StatCard etiqueta="Ausentismo" valor={`${ausentismo}%`} icon={UserX} to="/appointments" tono="blue" cargando={cargando} />
            <StatCard etiqueta="Pacientes nuevos" valor={datos?.pacientesNuevos ?? 0} icon={UserPlus} to="/patients" tono="teal" cargando={cargando} />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <BarrasHorizontales titulo="Cobrado por medio de pago" datos={METODOS.map(({ campo, label }) => ({ etiqueta: label, valor: resumen[campo] }))} />
            <BarrasHorizontales titulo="Cobrado por obra social" datos={porObraSocial} />
          </div>
        </>
      )}
    </div>
  );
}
