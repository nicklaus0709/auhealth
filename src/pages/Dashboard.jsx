import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Activity, FileText, CalendarDays, ArrowRight, LayoutDashboard } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { hoyISO } from "@/lib/format";
import { cn } from "@/lib/utils";
import useSesion from "@/hooks/useSesion";

const ACCESOS = [
  {
    to: "/patients",
    icon: Users,
    tono: "bg-brand-teal/10 text-brand-teal",
    titulo: "Gestionar Pacientes",
    texto: "Ver, agregar y editar pacientes",
  },
  {
    to: "/appointments",
    icon: CalendarDays,
    tono: "bg-brand-amber/10 text-[#B87400]",
    titulo: "Ver Agenda",
    texto: "Administrar turnos y citas",
  },
  {
    to: "/medical-records",
    icon: FileText,
    tono: "bg-brand-blue/10 text-brand-blue",
    titulo: "Historiales",
    texto: "Consultar registros médicos",
    soloMedico: true,
  },
];

const ALCANCES = [
  "Gestión de pacientes (ABM)",
  "Historiales médicos digitales",
  "Agenda de turnos con estados",
  "Control de acceso por roles",
  "Archivos adjuntos en historiales",
];

export default function Dashboard() {
  const { esMedico } = useSesion();
  const [stats, setStats] = useState({ total: 0, activos: 0, historiales: 0, turnos: 0 });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const [total, activos, historiales, turnos] = await Promise.all([
          base44.entities.Paciente.count(),
          base44.entities.Paciente.count({ activo: true }),
          esMedico ? base44.entities.HistorialClinico.count() : 0,
          base44.entities.Turno.count({ fecha: hoyISO() }),
        ]);
        if (vivo) setStats({ total, activos, historiales, turnos });
      } finally {
        if (vivo) setCargando(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [esMedico]);

  return (
    <div>
      <PageHeader
        icon={LayoutDashboard}
        titulo="Dashboard"
        subtitulo="Vista general del sistema de gestión médica"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard etiqueta="Total Pacientes" valor={stats.total} icon={Users} to="/patients" tono="teal" cargando={cargando} delay={0} />
        <StatCard etiqueta="Pacientes Activos" valor={stats.activos} icon={Activity} to="/patients" tono="emerald" cargando={cargando} delay={80} />
        {esMedico && <StatCard etiqueta="Historiales Médicos" valor={stats.historiales} icon={FileText} to="/medical-records" tono="blue" cargando={cargando} delay={160} />}
        <StatCard etiqueta="Turnos Hoy" valor={stats.turnos} icon={CalendarDays} to="/appointments" tono="amber" cargando={cargando} delay={240} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="animate-slide-up rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-heading text-base font-semibold text-foreground">Acceso Rápido</h2>
          <div className="mt-4 space-y-2">
            {ACCESOS.filter((acceso) => !acceso.soloMedico || esMedico).map((acceso) => {
              const Icon = acceso.icon;
              return (
                <Link
                  key={acceso.to}
                  to={acceso.to}
                  className="group flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 transition-colors hover:border-border hover:bg-muted/60"
                >
                  <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", acceso.tono)}>
                    <Icon className="h-5 w-5" strokeWidth={2.1} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground">{acceso.titulo}</p>
                    <p className="text-xs text-muted-foreground">{acceso.texto}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:text-brand-teal" />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="animate-slide-up rounded-2xl border border-border bg-card p-6 shadow-soft" style={{ animationDelay: "120ms" }}>
          <h2 className="font-heading text-base font-semibold text-foreground">Información del Sistema</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            AuHealth centraliza la operación diaria del consultorio: fichas de pacientes, historiales clínicos con
            archivos adjuntos y la agenda de turnos, con permisos diferenciados para cada rol del equipo.
          </p>
          <ul className="mt-4 space-y-2.5">
            {ALCANCES.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-foreground">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-teal" />
                {item}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}