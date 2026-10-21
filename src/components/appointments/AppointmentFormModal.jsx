import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const ESTADOS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "confirmado", label: "Confirmado" },
  { value: "atendido", label: "Atendido" },
  { value: "cancelado", label: "Cancelado" },
];

export default function AppointmentFormModal({ abierto, onOpenChange, pacientes, dia, onGuardar, guardando }) {
  const [datos, setDatos] = useState({ paciente: "", inicio: "", fin: "", tipo_consulta: "", estado: "pendiente", notas: "" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!abierto) return;
    const base = format(dia, "yyyy-MM-dd");
    setDatos({ paciente: "", inicio: `${base}T09:00`, fin: `${base}T09:30`, tipo_consulta: "", estado: "pendiente", notas: "" });
    setError("");
  }, [abierto, dia]);

  const set = (campo) => (e) => setDatos((previos) => ({ ...previos, [campo]: e.target.value }));

  const enviar = (e) => {
    e.preventDefault();
    const inicio = new Date(datos.inicio);
    const fin = new Date(datos.fin);
    if (!datos.inicio || !datos.fin || Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) {
      setError("Completá la fecha y hora de inicio y de fin");
      return;
    }
    if (fin <= inicio) {
      setError("La fecha/hora de fin debe ser posterior a la de inicio");
      return;
    }
    const paciente = pacientes.find((p) => p.id === datos.paciente);
    onGuardar({
      paciente: datos.paciente,
      paciente_nombre: paciente?.nombre_completo || "",
      paciente_ficha: paciente?.numero_ficha || "",
      fecha: format(inicio, "yyyy-MM-dd"),
      hora_inicio: format(inicio, "HH:mm"),
      hora_fin: format(fin, "HH:mm"),
      tipo_consulta: datos.tipo_consulta.trim(),
      estado: datos.estado,
      notas: datos.notas,
    });
  };

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Nuevo Turno</DialogTitle>
        </DialogHeader>

        <form onSubmit={enviar} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="turno-paciente">Paciente *</Label>
            <Select value={datos.paciente} onValueChange={(valor) => setDatos((p) => ({ ...p, paciente: valor }))}>
              <SelectTrigger id="turno-paciente" className="h-11">
                <SelectValue placeholder="Seleccioná un paciente" />
              </SelectTrigger>
              <SelectContent>
                {pacientes.map((paciente) => (
                  <SelectItem key={paciente.id} value={paciente.id}>
                    {paciente.nombre_completo} - {paciente.numero_ficha}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="turno-inicio">Fecha y Hora de Inicio *</Label>
              <Input id="turno-inicio" type="datetime-local" required value={datos.inicio} onChange={set("inicio")} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="turno-fin">Fecha y Hora de Fin *</Label>
              <Input id="turno-fin" type="datetime-local" required value={datos.fin} onChange={set("fin")} className="h-11" />
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
              Agendar Turno
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}