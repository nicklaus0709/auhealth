import { Link } from "react-router-dom";
import { FileText, Pencil, Trash2, User, Wallet } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StatusBadge, { ESTADOS_TURNO } from "@/components/StatusBadge";
import { fechaLarga } from "@/lib/format";

/**
 * Detalle de un turno con las acciones encadenadas: cambiar estado, editar,
 * y una vez atendido, registrar la atención y el cobro con el paciente ya cargado.
 */
export default function TurnoDetalleModal({ turno, onOpenChange, onEstado, onEditar, onEliminar, esAdmin, esMedico }) {
  if (!turno) return null;
  const atendido = turno.estado === "atendido" || turno.estado === "en_consulta";

  return (
    <Dialog open={!!turno} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">{turno.paciente_nombre}</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 text-sm">
          <p className="text-foreground">
            {fechaLarga(turno.fecha)} · <span className="tabular">{turno.hora_inicio} - {turno.hora_fin}</span>
          </p>
          <p className="text-muted-foreground">
            {turno.tipo_consulta} · {turno.profesional_nombre || "Sin profesional"}
          </p>
          {turno.notas && <p className="italic text-muted-foreground">{turno.notas}</p>}
        </div>

        <div className="flex items-center gap-2">
          <StatusBadge estado={turno.estado} />
          <Select value={turno.estado} onValueChange={(v) => onEstado(turno, v, v === "en_espera" ? { llegada: new Date().toISOString() } : {})}>
            <SelectTrigger className="ml-auto h-9 w-[180px] text-xs" aria-label="Cambiar estado">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS_TURNO.map((e) => (
                <SelectItem key={e.value} value={e.value} className="text-xs">
                  {e.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {atendido && (
          <div className="grid gap-2 rounded-xl bg-brand-teal/5 p-3 sm:grid-cols-2">
            {esMedico && (
              <Button className="btn-gradient" asChild>
                <Link to={`/patients/${turno.paciente}?nueva=1&turno=${turno.id}`}>
                  <FileText className="mr-1.5 h-4 w-4" />
                  Registrar atención
                </Link>
              </Button>
            )}
            <Button variant="outline" asChild>
              <Link to={`/earnings?paciente=${turno.paciente}&turno=${turno.id}`}>
                <Wallet className="mr-1.5 h-4 w-4" />
                Registrar cobro
              </Link>
            </Button>
          </div>
        )}

        <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-4">
          <Button variant="ghost" asChild>
            <Link to={`/patients/${turno.paciente}`}>
              <User className="mr-1.5 h-4 w-4" />
              Ver ficha
            </Link>
          </Button>
          <div className="flex gap-2">
            {esAdmin && (
              <Button variant="ghost" size="icon" aria-label="Eliminar turno" onClick={() => onEliminar(turno)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
            <Button variant="outline" onClick={() => onEditar(turno)}>
              <Pencil className="mr-1.5 h-4 w-4" />
              Editar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
