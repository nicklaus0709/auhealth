import { Link } from "react-router-dom";
import { HeartPulse } from "lucide-react";

export default function PageNotFound() {
  return (
    <div className="app-surface-bg flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="animate-scale-in flex flex-col items-center">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-teal to-brand-emerald shadow-teal">
          <HeartPulse className="h-8 w-8 text-white" strokeWidth={2.2} />
        </div>

        <span className="text-gradient-teal mt-6 font-heading text-7xl font-extrabold tracking-tight">404</span>

        <p className="mt-3 font-heading text-xl font-bold text-foreground">Página no encontrada</p>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          La página que buscás no existe o fue movida.
        </p>

        <Link
          to="/"
          className="btn-gradient mt-8 inline-flex items-center rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-soft transition-shadow hover:shadow-soft-lg"
        >
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}