import { useState } from "react";
import { Ban, Loader2, Trash2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/components/ConfirmProvider";
import { fechaCorta, hoyISO } from "@/lib/format";
import { log } from "@/lib/log";

const TODOS = "__todos__";

/** Vacaciones, feriados, congresos: días en los que la agenda no ofrece turnos. */
export default function BloqueosModal({ abierto, onOpenChange, bloqueos, profesionales, onCambio }) {
  const { toast } = useToast();
  const confirmar = useConfirm();
  const [datos, setDatos] = useState({ profesional: TODOS, desde: hoyISO(), hasta: hoyISO(), motivo: "" });
  const [guardando, setGuardando] = useState(false);

  const agregar = async (e) => {
    e.preventDefault();
    if (datos.hasta < datos.desde) {
      toast({ variant: "destructive", title: "La fecha de fin no puede ser anterior al inicio" });
      return;
    }
    setGuardando(true);
    try {
      const prof = profesionales.find((p) => p.id === datos.profesional);
      await base44.entities.Bloqueo.create({
        profesional: prof?.id || "",
        profesional_nombre: prof?.nombre_completo || "",
        desde: datos.desde,
        hasta: datos.hasta,
        motivo: datos.motivo.trim(),
      });
      toast({ title: "Bloqueo agregado" });
      setDatos((p) => ({ ...p, motivo: "" }));
      onCambio();
    } catch (error) {
      log.error("No se pudo crear el bloqueo", error, { componente: "BloqueosModal" });
      toast({ variant: "destructive", title: "No pudimos agregar el bloqueo", description: error?.message });
    } finally {
      setGuardando(false);
    }
  };

  const quitar = async (bloqueo) => {
    if (!(await confirmar({ titulo: "¿Quitar este bloqueo?", confirmar: "Quitar", peligro: true }))) return;
    try {
      await base44.entities.Bloqueo.delete(bloqueo.id);
      onCambio();
    } catch (error) {
      log.error("No se pudo quitar el bloqueo", error, { componente: "BloqueosModal" });
      toast({ variant: "destructive", title: "No pudimos quitar el bloqueo" });
    }
  };

  const vigentes = bloqueos.filter((b) => b.hasta >= hoyISO());

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">Bloqueos de agenda</DialogTitle>
        </DialogHeader>

        <form onSubmit={agregar} className="grid gap-3 rounded-xl border border-border p-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bloq-prof">Quién</Label>
            <Select value={datos.profesional} onValueChange={(v) => setDatos((p) => ({ ...p, profesional: v }))}>
              <SelectTrigger id="bloq-prof" className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS}>Todo el consultorio</SelectItem>
                {profesionales.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nombre_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bloq-desde">Desde</Label>
            <Input id="bloq-desde" type="date" required value={datos.desde} onChange={(e) => setDatos((p) => ({ ...p, desde: e.target.value }))} className="h-10" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bloq-hasta">Hasta</Label>
            <Input id="bloq-hasta" type="date" required value={datos.hasta} onChange={(e) => setDatos((p) => ({ ...p, hasta: e.target.value }))} className="h-10" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bloq-motivo">Motivo</Label>
            <Input id="bloq-motivo" value={datos.motivo} onChange={(e) => setDatos((p) => ({ ...p, motivo: e.target.value }))} placeholder="Vacaciones, feriado, congreso..." className="h-10" />
          </div>
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" className="btn-gradient" disabled={guardando}>
              {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Ban className="mr-1.5 h-4 w-4" />}
              Bloquear
            </Button>
          </div>
        </form>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Vigentes y próximos</p>
          {vigentes.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No hay bloqueos cargados</p>
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {vigentes.map((b) => (
                <li key={b.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-foreground">
                      {fechaCorta(b.desde)}
                      {b.hasta !== b.desde && ` al ${fechaCorta(b.hasta)}`} · {b.motivo || "Sin motivo"}
                    </p>
                    <p className="text-xs text-muted-foreground">{b.profesional_nombre || "Todo el consultorio"}</p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label="Quitar bloqueo" onClick={() => quitar(b)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
