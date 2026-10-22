import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const COLORES = ["#259D91", "#0DA2E7", "#8B5CF6", "#F59F0A", "#E11D48", "#2BAB6F", "#64748B"];

const VACIO = {
  nombre_completo: "",
  especialidad: "",
  matricula_nacional: "",
  matricula_provincial: "",
  cuit: "",
  telefono: "",
  email: "",
  usuario: "",
  firma_url: "",
  color: COLORES[0],
  duracion_turno: 30,
  horarios: [],
  activo: true,
};

const SIN_USUARIO = "__ninguno__";

export default function ProfesionalFormModal({ abierto, onOpenChange, profesional, usuarios, onGuardar, guardando }) {
  const [datos, setDatos] = useState(VACIO);
  const [error, setError] = useState("");
  const [subiendoFirma, setSubiendoFirma] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    setError("");
    setDatos(profesional ? { ...VACIO, ...profesional, horarios: profesional.horarios || [] } : VACIO);
  }, [abierto, profesional]);

  const set = (campo) => (e) => setDatos((p) => ({ ...p, [campo]: e.target.value }));
  const setHorario = (i, campo, valor) =>
    setDatos((p) => ({ ...p, horarios: p.horarios.map((h, j) => (j === i ? { ...h, [campo]: valor } : h)) }));

  // La firma se guarda como archivo privado: sólo se ve con URL firmada al imprimir documentos
  const subirFirma = async (archivo) => {
    if (!archivo) return;
    setSubiendoFirma(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: archivo });
      setDatos((p) => ({ ...p, firma_url: file_uri }));
    } catch {
      setError("No pudimos subir la firma, probá de nuevo");
    } finally {
      setSubiendoFirma(false);
    }
  };

  const enviar = (e) => {
    e.preventDefault();
    const malos = datos.horarios.filter((h) => !h.desde || !h.hasta || h.hasta <= h.desde);
    if (malos.length) return setError("Revisá las franjas horarias: el fin tiene que ser posterior al inicio");
    onGuardar({
      nombre_completo: datos.nombre_completo.trim(),
      especialidad: datos.especialidad.trim(),
      matricula_nacional: datos.matricula_nacional.trim(),
      matricula_provincial: datos.matricula_provincial.trim(),
      cuit: datos.cuit.replace(/\D/g, ""),
      telefono: datos.telefono,
      email: datos.email,
      usuario: datos.usuario || "",
      color: datos.color,
      duracion_turno: Number(datos.duracion_turno) || 30,
      horarios: datos.horarios.map((h) => ({ dia: Number(h.dia), desde: h.desde, hasta: h.hasta })),
      firma_url: datos.firma_url || "",
      activo: datos.activo !== false,
    });
  };

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">{profesional ? "Editar profesional" : "Nuevo profesional"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={enviar} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="prof-nombre">Nombre y apellido *</Label>
              <Input id="prof-nombre" required value={datos.nombre_completo} onChange={set("nombre_completo")} placeholder="Dra. Ana Gómez" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prof-especialidad">Especialidad</Label>
              <Input id="prof-especialidad" value={datos.especialidad} onChange={set("especialidad")} placeholder="Clínica médica" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prof-usuario">Usuario del sistema</Label>
              <Select value={datos.usuario || SIN_USUARIO} onValueChange={(v) => setDatos((p) => ({ ...p, usuario: v === SIN_USUARIO ? "" : v }))}>
                <SelectTrigger id="prof-usuario" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SIN_USUARIO}>Sin usuario vinculado</SelectItem>
                  {usuarios.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nombre_completo || u.full_name || u.email} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prof-mn">Matrícula nacional (MN)</Label>
              <Input id="prof-mn" value={datos.matricula_nacional} onChange={set("matricula_nacional")} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prof-mp">Matrícula provincial (MP)</Label>
              <Input id="prof-mp" value={datos.matricula_provincial} onChange={set("matricula_provincial")} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prof-cuit">CUIT</Label>
              <Input id="prof-cuit" inputMode="numeric" value={datos.cuit} onChange={set("cuit")} placeholder="20-30123456-7" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prof-duracion">Duración del turno (min)</Label>
              <Input id="prof-duracion" type="number" min="5" step="5" value={datos.duracion_turno} onChange={set("duracion_turno")} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prof-tel">Teléfono</Label>
              <Input id="prof-tel" value={datos.telefono} onChange={set("telefono")} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prof-email">Email</Label>
              <Input id="prof-email" type="email" value={datos.email} onChange={set("email")} className="h-11" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prof-firma">Firma escaneada (para órdenes y certificados)</Label>
            <Input id="prof-firma" type="file" accept="image/png,image/jpeg" onChange={(e) => subirFirma(e.target.files?.[0])} disabled={subiendoFirma} className="h-11" />
            <p className="text-xs text-muted-foreground">
              {subiendoFirma ? "Subiendo..." : datos.firma_url ? "Firma cargada. Subí otra imagen para reemplazarla." : "PNG con fondo blanco o transparente."}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Color en la agenda</Label>
            <div className="flex gap-2">
              {COLORES.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`Color ${color}`}
                  aria-pressed={datos.color === color}
                  onClick={() => setDatos((p) => ({ ...p, color }))}
                  className={`h-8 w-8 rounded-full ring-offset-2 ${datos.color === color ? "ring-2 ring-foreground" : ""}`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">Horarios de atención</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDatos((p) => ({ ...p, horarios: [...p.horarios, { dia: 1, desde: "09:00", hasta: "13:00" }] }))}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Agregar franja
              </Button>
            </div>
            {datos.horarios.length === 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">Sin franjas cargadas: la agenda usa el horario del consultorio.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {datos.horarios.map((h, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2">
                    <Select value={String(h.dia)} onValueChange={(v) => setHorario(i, "dia", Number(v))}>
                      <SelectTrigger className="h-10 w-[140px]" aria-label="Día">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DIAS.map((dia, n) => (
                          <SelectItem key={dia} value={String(n)}>
                            {dia}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input type="time" aria-label="Desde" value={h.desde} onChange={(e) => setHorario(i, "desde", e.target.value)} className="h-10 w-[120px]" />
                    <span className="text-sm text-muted-foreground">a</span>
                    <Input type="time" aria-label="Hasta" value={h.hasta} onChange={(e) => setHorario(i, "hasta", e.target.value)} className="h-10 w-[120px]" />
                    <button
                      type="button"
                      aria-label="Quitar franja"
                      onClick={() => setDatos((p) => ({ ...p, horarios: p.horarios.filter((_, j) => j !== i) }))}
                      className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/50 px-4 py-3">
            <Label htmlFor="prof-activo" className="text-sm font-medium">
              Profesional activo
            </Label>
            <Switch id="prof-activo" checked={datos.activo !== false} onCheckedChange={(v) => setDatos((p) => ({ ...p, activo: v }))} />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" className="btn-gradient" disabled={guardando || subiendoFirma}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
