import { Clock, Pencil, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge from "@/components/StatusBadge";

const ESTADOS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "confirmado", label: "Confirmado" },
  { value: "atendido", label: "Atendido" },
  { value: "cancelado", label: "Cancelado" },
];

export default function AppointmentRow({ turno, onEstado, onEditar, onEliminar, esAdmin }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-soft sm:flex-row sm:items-center">
      <div className="flex items-center gap-3 sm:w-[210px] sm:shrink-0">
        <Clock className="h-4 w-4 shrink-0 text-brand-teal" />
        <span className="tabular text-sm font-medium text-foreground">
          {turno.hora_inicio} - {turno.hora_fin}
        </span>
        <StatusBadge estado={turno.estado} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">
          {turno.paciente_nombre}{" "}
          <span className="font-normal text-muted-foreground">{turno.paciente_ficha}</span>
        </p>
        <p className="text-xs text-muted-foreground">{turno.tipo_consulta}</p>
        {turno.notas && <p className="mt-1 text-xs italic text-muted-foreground">{turno.notas}</p>}
      </div>

      <div className="flex items-center gap-2">
        <Select value={turno.estado} onValueChange={(valor) => onEstado(turno, valor)}>
          <SelectTrigger className="h-9 w-[140px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ESTADOS.map((estado) => (
              <SelectItem key={estado.value} value={estado.value} className="text-xs">
                {estado.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <button
          type="button"
          aria-label="Editar turno"
          onClick={() => onEditar(turno)}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-brand-teal/10 hover:text-brand-teal"
        >
          <Pencil className="h-4 w-4" />
        </button>

        {esAdmin && (
          <button
            type="button"
            aria-label="Eliminar turno"
            onClick={() => onEliminar(turno)}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}