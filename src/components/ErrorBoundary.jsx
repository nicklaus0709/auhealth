import { Component } from "react";
import { AlertTriangle } from "lucide-react";
import { log } from "@/lib/log";

// Evita la pantalla en blanco ante un error de React y deja el error registrado.
export default class ErrorBoundary extends Component {
  state = { conError: false };

  static getDerivedStateFromError() {
    return { conError: true };
  }

  componentDidCatch(error, info) {
    log.error("Error no controlado en la interfaz", error, { componente: info?.componentStack?.split("\n")[1]?.trim() });
  }

  render() {
    if (!this.state.conError) return this.props.children;
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-soft">
          <AlertTriangle className="mx-auto h-8 w-8 text-brand-amber" />
          <h1 className="mt-4 font-heading text-lg font-semibold text-foreground">Algo salió mal</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ocurrió un error inesperado. Recargá la página; si se repite, avisale al administrador.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-gradient mt-6 rounded-xl px-4 py-2 text-sm font-semibold text-white"
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }
}
