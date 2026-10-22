import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, FileText, CalendarDays, Wallet, Shield, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";
import BrandMark from "@/components/BrandMark";
import useSesion from "@/hooks/useSesion";
import { cn } from "@/lib/utils";

const NAV = [
  { label: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { label: "Pacientes", to: "/patients", icon: Users },
  { label: "Historiales", to: "/medical-records", icon: FileText, soloMedico: true },
  { label: "Agenda", to: "/appointments", icon: CalendarDays },
  { label: "Ganancias", to: "/earnings", icon: Wallet },
];

export default function Sidebar({ className, onNavegar }) {
  const { pathname } = useLocation();
  const { user, inicial, esAdmin, esMedico } = useSesion();
  const visibles = NAV.filter((item) => !item.soloMedico || esMedico);
  const items = esAdmin ? [...visibles, { label: "Usuarios", to: "/user-roles", icon: Shield }] : visibles;

  return (
    <aside
      className={cn(
        "w-[260px] shrink-0 flex-col bg-[linear-gradient(180deg,#1D2530_0%,#161D27_100%)]",
        className
      )}
    >
      <div className="px-6 py-7">
        <BrandMark
          iconSize={40}
          showWordmark
          wordmarkClass="text-white"
          subtitle="Sistema Médico"
          subtitleClass="text-white/50"
        />
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {items.map(({ label, to, icon: Icon }) => {
          const activo = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              onClick={onNavegar}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                activo ? "bg-brand-teal/20 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
              )}
            >
              <Icon
                className={cn("h-[18px] w-[18px]", activo ? "text-brand-teal" : "text-white/50 group-hover:text-white")}
                strokeWidth={2.1}
              />
              <span className="flex-1">{label}</span>
              {activo && <span className="h-1.5 w-1.5 rounded-full bg-brand-teal" />}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-teal text-sm font-semibold text-white">
            {inicial}
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs text-white">{user?.email}</p>
            <p className="text-[11px] font-medium text-brand-emerald">En línea</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => base44.auth.logout("/")}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:border-white/25 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}