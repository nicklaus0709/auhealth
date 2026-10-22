import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import PacienteCombobox from "@/components/patients/PacienteCombobox";

const ESTADOS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "confirmado", label: "Confirmado" },
  { value: "atendido", label: "Atendido" },
  { value: "cancelado", label: "Cancelado" },
];

// Con `turno` el modal edita/reprograma; sin él, crea uno nuevo para `dia`.
export default function AppointmentFormModal({ abierto, onOpenChange, turno, dia, onGuardar, guardando }) {
  const [paciente, setPaciente] = useState(null);
  const [datos, setDatos] = useState({ fecha: "", inicio: "", fin: "", tipo_consulta: "", estado: "pendiente", notas: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!abierto) return;
    setError("");
    if (turno) {
      setPaciente({ id: turno.paciente, nombre_completo: turno.paciente_nombre, numero_ficha: turno.paciente_ficha });
      setDatos({
        fecha: turno.fecha,
        inicio: turno.hora_inicio,
        fin: turno.hora_fin,
        tipo_consulta: turno.tipo_consulta || "",
        estado: turno.estado || "pendiente",
        notas: turno.notas || "",
      });
    } else {
      setPaciente(null);
      setDatos({ fecha: format(dia, "yyyy-MM-dd"), inicio: "09:00", fin: "09:30", tipo_consulta: "", estado: "pendiente", notas: "" });
    }
  }, [abierto, dia, turno]);

  const set = (campo) => (e) => setDatos((previos) => ({ ...previos, [campo]: e.target.value }));

  const enviar = (e) => {
    e.preventDefault();
    if (!paciente) return setError("Elegí un paciente");
    if (!datos.fecha || !datos.inicio || !datos.fin) return setError("Completá la fecha y los horarios");
    // HH:mm se compara bien como texto
    if (datos.fin <= datos.inicio) return setError("La hora de fin debe ser posterior a la de inicio");
    setError("");
    onGuardar({
      paciente: paciente.id,
      paciente_nombre: paciente.nombre_completo || "",
      paciente_ficha: paciente.numero_ficha || "",
      fecha: datos.fecha,
      hora_inicio: datos.inicio,
      hora_fin: datos.fin,
      tipo_consulta: datos.tipo_consulta.trim(),
      estado: datos.estado,
      notas: datos.notas,
    });
  };

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">{turno ? "Editar Turno" : "Nuevo Turno"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={enviar} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="turno-paciente">Paciente *</Label>
            <PacienteCombobox id="turno-paciente" seleccionado={paciente} onElegir={setPaciente} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="turno-fecha">Fecha *</Label>
              <Input id="turno-fecha" type="date" required value={datos.fecha} onChange={set("fecha")} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="turno-inicio">Desde *</Label>
              <Input id="turno-inicio" type="time" required value={datos.inicio} onChange={set("inicio")} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="turno-fin">Hasta *</Label>
              <Input id="turno-fin" type="time" required value={datos.fin} onChange={set("fin")} className="h-11" />
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="space-y-2">
            <Label htmlFor="turno-tipo">Tipo de Consulta *</Label>
            <Input id="turno-tipo" required value={datos.tipo_consulta} onChange={set("tipo_consulta")} placeholder="Ej: Consulta general, control" className="h-11" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="turno-estado">Estado</Label>
            <Select value={datos.estado} onValueChange={(valor) => setDatos((p) => ({ ...p, estado: valor }))}>
              <SelectTrigger id="turno-estado" className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS.map((estado) => (
                  <SelectItem key={estado.value} value={estado.value}>
                    {estado.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="turno-notas">Notas</Label>
            <Textarea id="turno-notas" rows={3} value={datos.notas} onChange={set("notas")} placeholder="Observaciones del turno..." />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" className="btn-gradient" disabled={guardando}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {turno ? "Guardar Cambios" : "Agendar Turno"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
