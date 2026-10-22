import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useObrasSociales } from "@/hooks/useDatos";
import { hoyISO } from "@/lib/format";

const PARTICULAR = "__particular__";

const VACIO = {
  nombre_completo: "",
  dni: "",
  fecha_nacimiento: "",
  telefono: "",
  email: "",
  obra_social: "",
  obra_social_id: "",
  plan: "",
  numero_afiliado: "",
  direccion: "",
  contacto_emergencia: "",
  telefono_emergencia: "",
  activo: true,
  consentimiento_datos: false,
  consentimiento_fecha: "",
};

export default function PatientFormModal({ abierto, onOpenChange, paciente, onGuardar, guardando }) {
  const [datos, setDatos] = useState(VACIO);
  const { data: obras = [] } = useObrasSociales();
  const obraElegida = obras.find((o) => o.id === datos.obra_social_id);

  useEffect(() => {
    if (!abierto) return;
    setDatos(
      paciente
        ? {
            ...VACIO,
            ...Object.fromEntries(
              Object.keys(VACIO).map((campo) => [campo, paciente[campo] ?? VACIO[campo]])
            ),
          }
        : VACIO
    );
  }, [abierto, paciente]);

  const set = (campo) => (e) => setDatos((previos) => ({ ...previos, [campo]: e.target.value }));

  const enviar = (e) => {
    e.preventDefault();
    onGuardar({
      nombre_completo: datos.nombre_completo.trim(),
      dni: datos.dni.replace(/[.\s-]/g, ""),
      fecha_nacimiento: datos.fecha_nacimiento,
      telefono: datos.telefono,
      email: datos.email,
      // Con padrón cargado, el nombre se toma de la obra social elegida (evita "OSDE" / "osde" / "Osde")
      obra_social: obras.length ? obraElegida?.nombre || "" : datos.obra_social,
      obra_social_id: obras.length ? datos.obra_social_id || "" : "",
      plan: datos.plan || "",
      numero_afiliado: datos.numero_afiliado,
      direccion: datos.direccion,
      contacto_emergencia: datos.contacto_emergencia,
      telefono_emergencia: datos.telefono_emergencia,
      activo: datos.activo !== false,
      consentimiento_datos: !!datos.consentimiento_datos,
      consentimiento_fecha: datos.consentimiento_datos ? datos.consentimiento_fecha || hoyISO() : "",
    });
  };

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">{paciente ? "Editar Paciente" : "Nuevo Paciente"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={enviar} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="nombre_completo">Nombre Completo *</Label>
              <Input id="nombre_completo" required value={datos.nombre_completo} onChange={set("nombre_completo")} placeholder="Juan Pérez" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dni">DNI *</Label>
              <Input id="dni" required inputMode="numeric" pattern="[0-9.\s\-]{6,12}" title="Sólo números (puede llevar puntos)" value={datos.dni} onChange={set("dni")} placeholder="30123456" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento *</Label>
              <Input id="fecha_nacimiento" type="date" required value={datos.fecha_nacimiento} onChange={set("fecha_nacimiento")} className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" value={datos.telefono} onChange={set("telefono")} placeholder="11 5555 5555" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={datos.email} onChange={set("email")} placeholder="paciente@ejemplo.com" className="h-11" />
            </div>
            {obras.length ? (
              <div className="space-y-2">
                <Label htmlFor="obra_social">Obra Social</Label>
                <Select
                  value={datos.obra_social_id || PARTICULAR}
                  onValueChange={(v) => setDatos((p) => ({ ...p, obra_social_id: v === PARTICULAR ? "" : v, plan: "" }))}
                >
                  <SelectTrigger id="obra_social" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={PARTICULAR}>Particular</SelectItem>
                    {obras.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!datos.obra_social_id && datos.obra_social && (
                  <p className="text-xs text-brand-amber-700">Cargada antes como «{datos.obra_social}»: elegila del padrón.</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="obra_social">Obra Social</Label>
                <Input id="obra_social" value={datos.obra_social} onChange={set("obra_social")} placeholder="OSDE" className="h-11" />
              </div>
            )}
            {obraElegida?.planes?.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="plan">Plan</Label>
                <Select value={datos.plan || undefined} onValueChange={(v) => setDatos((p) => ({ ...p, plan: v }))}>
                  <SelectTrigger id="plan" className="h-11">
                    <SelectValue placeholder="Elegí el plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {obraElegida.planes.map((plan) => (
                      <SelectItem key={plan} value={plan}>
                        {plan}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="numero_afiliado">Número de Afiliado</Label>
              <Input id="numero_afiliado" value={datos.numero_afiliado} onChange={set("numero_afiliado")} placeholder="610012345678" className="h-11" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input id="direccion" value={datos.direccion} onChange={set("direccion")} placeholder="Av. Siempre Viva 742" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contacto_emergencia">Contacto de Emergencia</Label>
              <Input id="contacto_emergencia" value={datos.contacto_emergencia} onChange={set("contacto_emergencia")} placeholder="María Pérez" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefono_emergencia">Teléfono de Emergencia</Label>
              <Input id="telefono_emergencia" value={datos.telefono_emergencia} onChange={set("telefono_emergencia")} placeholder="11 4444 4444" className="h-11" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border bg-muted/50 px-4 py-3">
            <div>
              <Label htmlFor="activo" className="text-sm font-medium">
                Paciente Activo
              </Label>
              <p className="text-xs text-muted-foreground">Los pacientes inactivos no aparecen en la agenda</p>
            </div>
            <Switch id="activo" checked={datos.activo !== false} onCheckedChange={(v) => setDatos((p) => ({ ...p, activo: v }))} />
          </div>

          <label className="flex items-start gap-3 rounded-xl border border-border px-4 py-3 text-sm">
            <input
              type="checkbox"
              checked={!!datos.consentimiento_datos}
              onChange={(e) => setDatos((p) => ({ ...p, consentimiento_datos: e.target.checked }))}
              className="mt-0.5 h-4 w-4"
            />
            <span>
              <span className="font-medium text-foreground">El paciente aceptó el tratamiento de sus datos personales y de salud</span>
              <span className="block text-xs text-muted-foreground">
                Ley 25.326. {datos.consentimiento_fecha ? `Registrado el ${datos.consentimiento_fecha}.` : "Se registra con la fecha de hoy."}
              </span>
            </span>
          </label>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" className="btn-gradient" disabled={guardando}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {paciente ? "Actualizar Paciente" : "Crear Paciente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}