import { useEffect, useState } from "react";
import { Loader2, Pencil, Plus, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import { useToast } from "@/components/ui/use-toast";
import useSesion from "@/hooks/useSesion";
import { useObrasSociales, usePrestaciones, useRefrescar } from "@/hooks/useDatos";
import { moneda } from "@/lib/earnings";
import { auditar, log } from "@/lib/log";

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

function useGuardar(entidad, clave) {
  const { toast } = useToast();
  const { nombre } = useSesion();
  const refrescar = useRefrescar();
  const [guardando, setGuardando] = useState(false);
  const guardar = async (id, datos) => {
    setGuardando(true);
    try {
      if (id) await base44.entities[entidad].update(id, datos);
      else await base44.entities[entidad].create(datos);
      auditar(id ? "editar" : "crear", entidad, { registro: id || "", usuario_nombre: nombre });
      await refrescar(clave);
      toast({ title: "Guardado" });
      return true;
    } catch (error) {
      log.error(`No se pudo guardar ${entidad}`, error, { componente: "PadronSettings" });
      toast({ variant: "destructive", title: "No pudimos guardar", description: error?.message });
      return false;
    } finally {
      setGuardando(false);
    }
  };
  return { guardar, guardando };
}

export function PrestacionesSettings() {
  const { data: prestaciones = [], isLoading } = usePrestaciones({ incluirInactivas: true });
  const { guardar, guardando } = useGuardar("Prestacion", "prestaciones");
  const [editando, setEditando] = useState(null); // {} = nueva
  const [datos, setDatos] = useState({});

  useEffect(() => {
    if (editando) setDatos({ nombre: "", codigo: "", duracion: 30, precio_particular: 0, activo: true, ...editando });
  }, [editando]);

  const enviar = async (e) => {
    e.preventDefault();
    const ok = await guardar(editando?.id, {
      nombre: datos.nombre.trim(),
      codigo: (datos.codigo || "").trim(),
      duracion: num(datos.duracion) || 30,
      precio_particular: num(datos.precio_particular),
      activo: datos.activo !== false,
    });
    if (ok) setEditando(null);
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Tipos de prestación con su duración y precio particular. Se usan en turnos, cobros y liquidaciones.</p>
        <Button className="btn-gradient shrink-0" onClick={() => setEditando({})}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nueva prestación
        </Button>
      </div>
      {isLoading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-teal" />
      ) : prestaciones.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-soft">
          <EmptyState titulo="Todavía no cargaste prestaciones" descripcion="Ej: Consulta, Control, Sesión de kinesiología." />
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-soft">
          {prestaciones.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">
                  {p.nombre} {p.codigo && <span className="font-mono text-xs text-muted-foreground">({p.codigo})</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.duracion || 30} min · particular {moneda(p.precio_particular)}
                </p>
              </div>
              <StatusBadge estado={p.activo === false ? "inactivo" : "activo"} />
              <Button variant="ghost" size="icon" aria-label={`Editar ${p.nombre}`} onClick={() => setEditando(p)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!editando} onOpenChange={(v) => !v && setEditando(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">{editando?.id ? "Editar prestación" : "Nueva prestación"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={enviar} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pr-nombre">Nombre *</Label>
              <Input id="pr-nombre" required value={datos.nombre || ""} onChange={(e) => setDatos((d) => ({ ...d, nombre: e.target.value }))} className="h-11" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-2">
                <Label htmlFor="pr-codigo">Código</Label>
                <Input id="pr-codigo" value={datos.codigo || ""} onChange={(e) => setDatos((d) => ({ ...d, codigo: e.target.value }))} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pr-dur">Minutos</Label>
                <Input id="pr-dur" type="number" min="5" step="5" value={datos.duracion ?? 30} onChange={(e) => setDatos((d) => ({ ...d, duracion: e.target.value }))} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pr-precio">Particular $</Label>
                <Input id="pr-precio" type="number" min="0" step="0.01" value={datos.precio_particular ?? 0} onChange={(e) => setDatos((d) => ({ ...d, precio_particular: e.target.value }))} className="h-11" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <Label htmlFor="pr-activo">Activa</Label>
              <Switch id="pr-activo" checked={datos.activo !== false} onCheckedChange={(v) => setDatos((d) => ({ ...d, activo: v }))} />
            </div>
            <DialogFooter>
              <Button type="submit" className="btn-gradient" disabled={guardando}>
                {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

export function ObrasSocialesSettings() {
  const { data: obras = [], isLoading } = useObrasSociales({ incluirInactivas: true });
  const { data: prestaciones = [] } = usePrestaciones();
  const { guardar, guardando } = useGuardar("ObraSocial", "obras-sociales");
  const [editando, setEditando] = useState(null);
  const [datos, setDatos] = useState({});

  useEffect(() => {
    if (editando) {
      setDatos({
        nombre: "",
        sigla: "",
        cuit: "",
        tipo: "obra_social",
        planes: [],
        requiere_autorizacion: false,
        aranceles: [],
        contacto: "",
        activo: true,
        ...editando,
        planesTexto: (editando.planes || []).join(", "),
      });
    }
  }, [editando]);

  const arancel = (prestacionId) => (datos.aranceles || []).find((a) => a.prestacion === prestacionId) || {};
  const setArancel = (prestacionId, campo, valor) =>
    setDatos((d) => {
      const otros = (d.aranceles || []).filter((a) => a.prestacion !== prestacionId);
      return { ...d, aranceles: [...otros, { ...arancel(prestacionId), prestacion: prestacionId, [campo]: valor }] };
    });

  const enviar = async (e) => {
    e.preventDefault();
    const ok = await guardar(editando?.id, {
      nombre: datos.nombre.trim(),
      sigla: (datos.sigla || "").trim(),
      cuit: String(datos.cuit || "").replace(/\D/g, ""),
      tipo: datos.tipo,
      planes: (datos.planesTexto || "").split(",").map((p) => p.trim()).filter(Boolean),
      requiere_autorizacion: !!datos.requiere_autorizacion,
      aranceles: (datos.aranceles || [])
        .map((a) => ({ prestacion: a.prestacion, valor: num(a.valor), coseguro: num(a.coseguro) }))
        .filter((a) => a.valor || a.coseguro),
      contacto: datos.contacto || "",
      activo: datos.activo !== false,
    });
    if (ok) setEditando(null);
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Padrón de obras sociales y prepagas, con lo que paga cada una por prestación y el coseguro del paciente.</p>
        <Button className="btn-gradient shrink-0" onClick={() => setEditando({})}>
          <Plus className="mr-1.5 h-4 w-4" />
          Nueva obra social
        </Button>
      </div>
      {isLoading ? (
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-teal" />
      ) : obras.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-soft">
          <EmptyState titulo="Todavía no cargaste obras sociales" />
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-soft">
          {obras.map((o) => (
            <li key={o.id} className="flex items-center gap-3 px-4 py-3 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">
                  {o.nombre} {o.sigla && <span className="text-xs text-muted-foreground">({o.sigla})</span>}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(o.planes || []).length ? `Planes: ${o.planes.join(", ")}` : "Sin planes cargados"} · {(o.aranceles || []).length} arancel(es)
                  {o.requiere_autorizacion ? " · requiere autorización" : ""}
                </p>
              </div>
              <StatusBadge estado={o.activo === false ? "inactivo" : "activo"} />
              <Button variant="ghost" size="icon" aria-label={`Editar ${o.nombre}`} onClick={() => setEditando(o)}>
                <Pencil className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!editando} onOpenChange={(v) => !v && setEditando(null)}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">{editando?.id ? "Editar obra social" : "Nueva obra social"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={enviar} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="os-nombre">Nombre *</Label>
                <Input id="os-nombre" required value={datos.nombre || ""} onChange={(e) => setDatos((d) => ({ ...d, nombre: e.target.value }))} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="os-sigla">Sigla</Label>
                <Input id="os-sigla" value={datos.sigla || ""} onChange={(e) => setDatos((d) => ({ ...d, sigla: e.target.value }))} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="os-tipo">Tipo</Label>
                <Select value={datos.tipo || "obra_social"} onValueChange={(v) => setDatos((d) => ({ ...d, tipo: v }))}>
                  <SelectTrigger id="os-tipo" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="obra_social">Obra social</SelectItem>
                    <SelectItem value="prepaga">Prepaga</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="os-cuit">CUIT</Label>
                <Input id="os-cuit" value={datos.cuit || ""} onChange={(e) => setDatos((d) => ({ ...d, cuit: e.target.value }))} className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="os-planes">Planes (separados por coma)</Label>
                <Input id="os-planes" value={datos.planesTexto || ""} onChange={(e) => setDatos((d) => ({ ...d, planesTexto: e.target.value }))} placeholder="210, 310, 410" className="h-11" />
              </div>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <Label htmlFor="os-aut">Requiere autorización / bono</Label>
              <Switch id="os-aut" checked={!!datos.requiere_autorizacion} onCheckedChange={(v) => setDatos((d) => ({ ...d, requiere_autorizacion: v }))} />
            </div>

            <div className="rounded-xl border border-border p-4">
              <p className="text-sm font-medium text-foreground">Aranceles por prestación</p>
              {prestaciones.length === 0 ? (
                <p className="mt-2 text-xs text-muted-foreground">Cargá primero las prestaciones en su pestaña.</p>
              ) : (
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-[1fr_110px_110px] gap-2 text-xs text-muted-foreground">
                    <span>Prestación</span>
                    <span>Paga la O.S. $</span>
                    <span>Coseguro $</span>
                  </div>
                  {prestaciones.map((p) => (
                    <div key={p.id} className="grid grid-cols-[1fr_110px_110px] items-center gap-2">
                      <span className="truncate text-sm text-foreground">{p.nombre}</span>
                      <Input type="number" min="0" step="0.01" aria-label={`Valor ${p.nombre}`} value={arancel(p.id).valor ?? ""} onChange={(e) => setArancel(p.id, "valor", e.target.value)} className="h-9" />
                      <Input type="number" min="0" step="0.01" aria-label={`Coseguro ${p.nombre}`} value={arancel(p.id).coseguro ?? ""} onChange={(e) => setArancel(p.id, "coseguro", e.target.value)} className="h-9" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
              <Label htmlFor="os-activo">Activa</Label>
              <Switch id="os-activo" checked={datos.activo !== false} onCheckedChange={(v) => setDatos((d) => ({ ...d, activo: v }))} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditando(null)}>
                <X className="mr-1.5 h-4 w-4" />
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
    </section>
  );
}
