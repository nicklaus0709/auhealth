import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import PacienteCombobox from "@/components/patients/PacienteCombobox";
import { METODOS, calcularCobrado, calcularEstado, moneda, num } from "@/lib/earnings";
import { hoyISO } from "@/lib/format";

const VACIO = {
  paciente: "",
  fecha: "",
  concepto: "",
  importe: "",
  monto_efectivo: "",
  monto_obra_social: "",
  monto_transferencia: "",
  monto_tarjeta: "",
  facturado: false,
  comprobante: "",
  notas: "",
};

export default function PaymentFormModal({ abierto, onOpenChange, pago, pacienteInicial = null, onGuardar, guardando }) {
  const [datos, setDatos] = useState(VACIO);
  const [paciente, setPaciente] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!abierto) return;
    setError("");
    // Al editar mostramos al paciente del cobro aunque hoy esté dado de baja
    setPaciente(
      pago ? { id: pago.paciente, nombre_completo: pago.paciente_nombre, numero_ficha: pago.paciente_ficha, obra_social: pago.obra_social } : pacienteInicial
    );
    if (pago) {
      setDatos(
        Object.fromEntries(
          Object.keys(VACIO).map((k) => [k, pago[k] === null || pago[k] === undefined ? VACIO[k] : pago[k]])
        )
      );
    } else {
      setDatos({ ...VACIO, fecha: hoyISO() });
    }
  }, [abierto, pago, pacienteInicial]);

  const set = (campo) => (e) => setDatos((previos) => ({ ...previos, [campo]: e.target.value }));
  const cobrado = calcularCobrado(datos);
  const estado = calcularEstado(num(datos.importe), cobrado);

  const enviar = (e) => {
    e.preventDefault();
    if (!paciente) return setError("Elegí un paciente");
    if (num(datos.importe) <= 0) return setError("Ingresá el importe de la prestación");
    if (cobrado > num(datos.importe)) return setError("Lo cobrado no puede superar el importe");
    onGuardar({
      paciente: paciente.id,
      paciente_nombre: paciente.nombre_completo || "",
      paciente_ficha: paciente.numero_ficha || "",
      obra_social: paciente.obra_social || "",
      fecha: datos.fecha,
      concepto: datos.concepto.trim(),
      importe: num(datos.importe),
      ...Object.fromEntries(METODOS.map(({ campo }) => [campo, num(datos[campo])])),
      cobrado,
      estado,
      facturado: datos.facturado,
      comprobante: datos.facturado ? datos.comprobante.trim() : "",
      notas: datos.notas,
      turno: pago?.turno || paciente.turno || "",
    });
  };

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">{pago ? "Editar cobro" : "Registrar cobro"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={enviar} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pago-paciente">Paciente *</Label>
            <PacienteCombobox id="pago-paciente" seleccionado={paciente} onElegir={setPaciente} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pago-fecha">Fecha *</Label>
              <Input id="pago-fecha" type="date" required value={datos.fecha} onChange={set("fecha")} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pago-importe">Importe de la prestación *</Label>
              <Input id="pago-importe" type="number" min="0" step="0.01" required value={datos.importe} onChange={set("importe")} placeholder="0" className="h-11" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pago-concepto">Concepto</Label>
            <Input id="pago-concepto" value={datos.concepto} onChange={set("concepto")} placeholder="Ej: Consulta, sesión de kinesiología" className="h-11" />
          </div>

          <div className="rounded-xl border border-border p-4">
            <p className="text-sm font-medium text-foreground">¿Cómo pagó?</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {METODOS.map(({ campo, label }) => (
                <div key={campo} className="space-y-1.5">
                  <Label htmlFor={`pago-${campo}`} className="text-xs text-muted-foreground">
                    {label}
                  </Label>
                  <Input id={`pago-${campo}`} type="number" min="0" step="0.01" value={datos[campo]} onChange={set(campo)} placeholder="0" className="h-10" />
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Cobrado: <strong className="text-foreground">{moneda(cobrado)}</strong>
              </span>
              <StatusBadge estado={estado} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={datos.facturado} onChange={(e) => setDatos((p) => ({ ...p, facturado: e.target.checked }))} className="h-4 w-4" />
              Ya está facturado en ARCA
            </label>
            {datos.facturado && (
              <Input value={datos.comprobante} onChange={set("comprobante")} placeholder="N° de comprobante" className="h-10 max-w-[220px]" />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pago-notas">Notas</Label>
            <Textarea id="pago-notas" rows={2} value={datos.notas} onChange={set("notas")} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" className="btn-gradient" disabled={guardando}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
