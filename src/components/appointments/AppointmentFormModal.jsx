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
import { ESTADOS_TURNO } from "@/components/StatusBadge";
import { sumarMinutos } from "@/lib/agenda";

const SIN_PROFESIONAL = "__sin__";

/**
 * Con `turno` el modal edita/reprograma. Sin él, crea uno nuevo para `dia`, opcionalmente
 * con `inicial` = { hora, profesional, paciente } (por ejemplo al hacer clic en un hueco de la grilla).
 */
export default function AppointmentFormModal({ abierto, onOpenChange, turno, dia, inicial, profesionales = [], onGuardar, guardando }) {
  const [paciente, setPaciente] = useState(null);
  const [datos, setDatos] = useState({ fecha: "", inicio: "", fin: "", profesional: "", tipo_consulta: "", estado: "pendiente", notas: "" });
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
        profesional: turno.profesional || "",
        tipo_consulta: turno.tipo_consulta || "",
        estado: turno.estado || "pendiente",
        notas: turno.notas || "",
      });
    } else {
      const prof = inicial?.profesional || (profesionales.length === 1 ? profesionales[0] : null);
      const inicio = inicial?.hora || "09:00";
      setPaciente(inicial?.paciente || null);
      setDatos({
        fecha: inicial?.fecha || format(dia, "yyyy-MM-dd"),
        inicio,
        fin: sumarMinutos(inicio, prof?.duracion_turno || 30),
        profesional: prof?.id || "",
        tipo_consulta: "",
        estado: "pendiente",
        notas: "",
      });
    }
  }, [abierto, dia, turno, inicial]);

  const set = (campo) => (e) => setDatos((previos) => ({ ...previos, [campo]: e.target.value }));

  const elegirProfesional = (valor) => {
    const prof = profesionales.find((p) => p.id === valor);
    setDatos((p) => ({
      ...p,
      profesional: prof?.id || "",
      // al cambiar de profesional, el fin se ajusta a su duración de turno
      fin: prof && !turno ? sumarMinutos(p.inicio, prof.duracion_turno || 30) : p.fin,
    }));
  };

  const enviar = (e) => {
    e.preventDefault();
    if (!paciente) return setError("Elegí un paciente");
    if (!datos.fecha || !datos.inicio || !datos.fin) return setError("Completá la fecha y los horarios");
    // HH:mm se compara bien como texto
    if (datos.fin <= datos.inicio) return setError("La hora de fin debe ser posterior a la de inicio");
    if (profesionales.length > 0 && !datos.profesional) return setError("Elegí el profesional");
    setError("");
    const prof = profesionales.find((p) => p.id === datos.profesional);
    onGuardar({
      paciente: paciente.id,
      paciente_nombre: paciente.nombre_completo || "",
      paciente_ficha: paciente.numero_ficha || "",
      profesional: prof?.id || "",
      profesional_nombre: prof?.nombre_completo || "",
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

          {profesionales.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="turno-profesional">Profesional *</Label>
              <Select value={datos.profesional || SIN_PROFESIONAL} onValueChange={elegirProfesional}>
                <SelectTrigger id="turno-profesional" className="h-11">
                  <SelectValue placeholder="Elegí el profesional" />
                </SelectTrigger>
                <SelectContent>
                  {!datos.profesional && <SelectItem value={SIN_PROFESIONAL}>Elegí el profesional</SelectItem>}
                  {profesionales.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre_completo}
                      {p.especialidad ? ` · ${p.especialidad}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
                {ESTADOS_TURNO.map((estado) => (
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
