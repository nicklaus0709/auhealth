import { Link } from "react-router-dom";
import { Pencil, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatusBadge from "@/components/StatusBadge";
import { valorODash } from "@/lib/format";

export default function PatientCardList({ pacientes, onEditar, onEliminar, esAdmin }) {
  return (
    <div className="space-y-3 md:hidden">
      {pacientes.map((paciente) => (
        <div key={paciente.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link to={`/patients/${paciente.id}`} className="font-medium text-foreground hover:text-brand-teal-700 hover:underline">{paciente.nombre_completo}</Link>
              <p className="mt-0.5 font-mono text-xs text-brand-teal-700">{valorODash(paciente.numero_ficha)}</p>
            </div>
            <StatusBadge estado={paciente.activo === false ? "inactivo" : "activo"} />
          </div>

          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground">DNI:</dt>
              <dd className="text-foreground">{valorODash(paciente.dni)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Teléfono:</dt>
              <dd className="text-foreground">{valorODash(paciente.telefono)}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground">Obra Social:</dt>
              <dd className="text-foreground">{valorODash(paciente.obra_social)}</dd>
            </div>
          </dl>

          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => onEditar(paciente)}>
              <Pencil className="mr-2 h-3.5 w-3.5" />
              Editar
            </Button>
            {esAdmin && paciente.activo !== false && (
              <Button variant="outline" size="icon" onClick={() => onEliminar(paciente)} aria-label="Dar de baja paciente">
                <UserX className="h-3.5 w-3.5 text-destructive" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}