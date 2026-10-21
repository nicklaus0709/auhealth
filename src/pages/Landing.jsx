import { Link, Navigate } from "react-router-dom";
import { HeartPulse, ArrowRight, Users, FileText, CalendarDays, ShieldCheck, Smartphone, Lock } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import AuvanceFooter from "@/components/AuvanceFooter";
import { cn } from "@/lib/utils";

const TARJETAS = [
  {
    icon: Users,
    tono: "bg-brand-teal/10 text-brand-teal",
    titulo: "Gestión de Pacientes",
    texto: "Administración completa de pacientes con fichas digitales, datos de contacto y obra social",
  },
  {
    icon: FileText,
    tono: "bg-brand-emerald/10 text-brand-emerald",
    titulo: "Historiales Clínicos",
    texto: "Registros médicos digitales con diagnósticos, tratamientos, notas y archivos adjuntos",
  },
  {
    icon: CalendarDays,
    tono: "bg-brand-amber/10 text-[#B87400]",
    titulo: "Agenda de Turnos",
    texto: "Calendario intuitivo para gestionar citas con estados en tiempo real y vista semanal",
  },
];

const EXTRAS = [
  { icon: ShieldCheck, titulo: "Control de Acceso", texto: "Admin, Médico, Recepcionista" },
  { icon: Smartphone, titulo: "100% Responsive", texto: "Optimizado para celular y tablet" },
  { icon: Lock, titulo: "Datos Seguros", texto: "Información protegida" },
];

export default function Landing() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return (
    <div className="app-surface-bg relative flex min-h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute -right-28 -top-28 h-80 w-80 rounded-full bg-brand-teal/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-28 h-80 w-80 rounded-full bg-brand-emerald/20 blur-3xl" />

      <main className="relative z-10 flex flex-1 items-center justify-center px-5 py-16 sm:px-8">
        <div className="w-full max-w-5xl">
          <div className="flex flex-col items-center text-center">
            <div className="animate-pulse-soft grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-brand-teal to-brand-emerald shadow-teal">
              <HeartPulse className="h-10 w-10 text-white" strokeWidth={2.2} />
            </div>

            <h1 className="mt-7 font-heading text-[48px] font-extrabold leading-none tracking-tight sm:text-[60px]">
              <span className="text-gradient-teal">AuHealth</span>
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Sistema integral de gestión médica para consultorios. Simplificá la administración de pacientes,
              historiales y turnos.
            </p>

            <Link
              to="/auth"
              className="btn-gradient group mt-8 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 text-base font-semibold text-white shadow-soft transition-shadow duration-300 hover:shadow-soft-lg"
            >
              Acceder al Sistema
              <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1.5" />
            </Link>
          </div>

          <div className="mt-14 grid gap-5 sm:grid-cols-3">
            {TARJETAS.map((tarjeta, i) => {
              const Icon = tarjeta.icon;
              return (
                <div
                  key={tarjeta.titulo}
                  className="glass animate-slide-up rounded-2xl border border-white/60 p-6 shadow-soft transition-transform duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${i * 90}ms` }}
                >
                  <span className={cn("grid h-11 w-11 place-items-center rounded-xl", tarjeta.tono)}>
                    <Icon className="h-5 w-5" strokeWidth={2.1} />
                  </span>
                  <h2 className="mt-4 font-heading text-base font-semibold text-foreground">{tarjeta.titulo}</h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{tarjeta.texto}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {EXTRAS.map((extra, i) => {
              const Icon = extra.icon;
              return (
                <div
                  key={extra.titulo}
                  className="animate-slide-up flex items-center gap-3"
                  style={{ animationDelay: `${300 + i * 90}ms` }}
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-teal/10 text-brand-teal">
                    <Icon className="h-4 w-4" strokeWidth={2.1} />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{extra.titulo}</p>
                    <p className="text-xs text-muted-foreground">{extra.texto}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      <AuvanceFooter />
    </div>
  );
}