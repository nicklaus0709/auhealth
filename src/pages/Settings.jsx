import { useEffect, useState } from "react";
import { Building2, Loader2, Pencil, Plus, Settings as SettingsIcon, ShieldAlert, Stethoscope } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import ProfesionalFormModal, { DIAS } from "@/components/settings/ProfesionalFormModal";
import { useToast } from "@/components/ui/use-toast";
import useSesion from "@/hooks/useSesion";
import { useConsultorio, useProfesionales, useRefrescar } from "@/hooks/useDatos";
import { auditar, log } from "@/lib/log";

const VACIO = {
  nombre: "",
  razon_social: "",
  cuit: "",
  condicion_iva: "monotributo",
  direccion: "",
  localidad: "",
  telefono: "",
  email: "",
  logo_url: "",
  hora_apertura: "08:00",
  hora_cierre: "20:00",
  minutos_inactividad: 15,
};

function DatosConsultorio() {
  const { toast } = useToast();
  const { nombre: usuarioNombre } = useSesion();
  const { data: consultorio, isLoading } = useConsultorio();
  const refrescar = useRefrescar();
  const [datos, setDatos] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);

  useEffect(() => {
    if (consultorio) setDatos({ ...VACIO, ...consultorio });
  }, [consultorio]);

  const set = (campo) => (e) => setDatos((p) => ({ ...p, [campo]: e.target.value }));

  const subirLogo = async (archivo) => {
    if (!archivo) return;
    setSubiendoLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: archivo });
      setDatos((p) => ({ ...p, logo_url: file_url }));
    } catch (error) {
      log.error("No se pudo subir el logo", error, { pantalla: "Settings" });
      toast({ variant: "destructive", title: "No pudimos subir el logo" });
    } finally {
      setSubiendoLogo(false);
    }
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    const { id: _id, created_date: _c, updated_date: _u, created_by: _b, created_by_id: _bi, ...campos } = datos;
    const payload = { ...campos, cuit: String(campos.cuit || "").replace(/\D/g, ""), minutos_inactividad: Number(campos.minutos_inactividad) || 0 };
    try {
      if (consultorio?.id) await base44.entities.Consultorio.update(consultorio.id, payload);
      else await base44.entities.Consultorio.create(payload);
      auditar("editar", "Consultorio", { registro: consultorio?.id || "", usuario_nombre: usuarioNombre });
      await refrescar("consultorio");
      toast({ title: "Datos del consultorio guardados" });
    } catch (error) {
      log.error("No se pudieron guardar los datos del consultorio", error, { pantalla: "Settings" });
      toast({ variant: "destructive", title: "No pudimos guardar los datos", description: error?.message });
    } finally {
      setGuardando(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-14">
        <Loader2 className="h-6 w-6 animate-spin text-brand-teal" />
      </div>
    );
  }

  return (
    <form onSubmit={guardar} className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <p className="text-sm text-muted-foreground">
        Estos datos salen en los encabezados de recetas, órdenes, certificados e impresiones de la historia clínica.
      </p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="c-nombre">Nombre del consultorio</Label>
          <Input id="c-nombre" value={datos.nombre} onChange={set("nombre")} placeholder="Consultorio San Martín" className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-razon">Razón social</Label>
          <Input id="c-razon" value={datos.razon_social} onChange={set("razon_social")} className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-cuit">CUIT</Label>
          <Input id="c-cuit" inputMode="numeric" value={datos.cuit} onChange={set("cuit")} placeholder="30-12345678-9" className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-iva">Condición frente al IVA</Label>
          <Select value={datos.condicion_iva || "monotributo"} onValueChange={(v) => setDatos((p) => ({ ...p, condicion_iva: v }))}>
            <SelectTrigger id="c-iva" className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monotributo">Monotributo</SelectItem>
              <SelectItem value="responsable_inscripto">Responsable inscripto</SelectItem>
              <SelectItem value="exento">Exento</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-dir">Dirección</Label>
          <Input id="c-dir" value={datos.direccion} onChange={set("direccion")} className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-loc">Localidad</Label>
          <Input id="c-loc" value={datos.localidad} onChange={set("localidad")} className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-tel">Teléfono</Label>
          <Input id="c-tel" value={datos.telefono} onChange={set("telefono")} className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-email">Email</Label>
          <Input id="c-email" type="email" value={datos.email} onChange={set("email")} className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-apertura">Abre</Label>
          <Input id="c-apertura" type="time" value={datos.hora_apertura} onChange={set("hora_apertura")} className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-cierre">Cierra</Label>
          <Input id="c-cierre" type="time" value={datos.hora_cierre} onChange={set("hora_cierre")} className="h-11" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-inactividad">Cerrar sesión tras (minutos sin uso)</Label>
          <Input id="c-inactividad" type="number" min="0" value={datos.minutos_inactividad} onChange={set("minutos_inactividad")} className="h-11" />
          <p className="text-xs text-muted-foreground">0 = nunca. Recomendado en PCs compartidas de recepción.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-logo">Logo</Label>
          <div className="flex items-center gap-3">
            {datos.logo_url && <img src={datos.logo_url} alt="Logo del consultorio" className="h-11 w-11 rounded-lg border border-border object-contain" />}
            <Input id="c-logo" type="file" accept="image/*" onChange={(e) => subirLogo(e.target.files?.[0])} className="h-11" disabled={subiendoLogo} />
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end">
        <Button type="submit" className="btn-gradient" disabled={guardando || subiendoLogo}>
          {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar datos
        </Button>
      </div>
    </form>
  );
}

const resumenHorarios = (horarios = []) =>
  horarios.length ? horarios.map((h) => `${DIAS[h.dia]?.slice(0, 3)} ${h.desde}-${h.hasta}`).join(" · ") : "Horario del consultorio";

function Profesionales() {
  const { toast } = useToast();
  const { nombre: usuarioNombre } = useSesion();
  const { data: profesionales = [], isLoading } = useProfesionales({ incluirInactivos: true });
  const refrescar = useRefrescar();
  const [usuarios, setUsuarios] = useState([]);
  const [editando, setEditando] = useState(null);
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    base44.entities.User.list()
      .then((res) => setUsuarios(res.items ?? res))
      .catch((error) => log.error("No se pudo cargar usuarios", error, { pantalla: "Settings" }));
  }, []);

  const guardar = async (datos) => {
    setGuardando(true);
    try {
      if (editando) await base44.entities.Profesional.update(editando.id, datos);
      else await base44.entities.Profesional.create(datos);
      auditar(editando ? "editar" : "crear", "Profesional", { registro: editando?.id || "", usuario_nombre: usuarioNombre });
      await refrescar("profesionales");
      toast({ title: "Profesional guardado" });
      setAbierto(false);
      setEditando(null);
    } catch (error) {
      log.error("No se pudo guardar el profesional", error, { pantalla: "Settings" });
      toast({ variant: "destructive", title: "No pudimos guardar el profesional", description: error?.message });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Cada profesional tiene su columna en la agenda, sus horarios y su matrícula para los documentos.</p>
        <Button
          className="btn-gradient shrink-0"
          onClick={() => {
            setEditando(null);
            setAbierto(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Nuevo profesional
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-14">
          <Loader2 className="h-6 w-6 animate-spin text-brand-teal" />
        </div>
      ) : profesionales.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-soft">
          <EmptyState icon={Stethoscope} titulo="Todavía no cargaste profesionales" descripcion="Cargalos para usar la agenda por profesional." />
        </div>
      ) : (
        <ul className="space-y-3">
          {profesionales.map((p) => (
            <li key={p.id} className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft">
              <span className="h-10 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: p.color || "#259D91" }} />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground">{p.nombre_completo}</p>
                <p className="text-xs text-muted-foreground">
                  {[p.especialidad, p.matricula_nacional && `MN ${p.matricula_nacional}`, p.matricula_provincial && `MP ${p.matricula_provincial}`]
                    .filter(Boolean)
                    .join(" · ") || "Sin especialidad ni matrícula"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {resumenHorarios(p.horarios)} · turnos de {p.duracion_turno || 30} min
                </p>
              </div>
              <StatusBadge estado={p.activo === false ? "inactivo" : "activo"} />
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Editar ${p.nombre_completo}`}
                onClick={() => {
                  setEditando(p);
                  setAbierto(true);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <ProfesionalFormModal
        abierto={abierto}
        onOpenChange={(v) => {
          setAbierto(v);
          if (!v) setEditando(null);
        }}
        profesional={editando}
        usuarios={usuarios}
        onGuardar={guardar}
        guardando={guardando}
      />
    </section>
  );
}

export default function Settings() {
  const { esAdmin } = useSesion();

  if (!esAdmin) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <EmptyState icon={ShieldAlert} titulo="No tenés permisos para ver esta sección" descripcion="Sólo los administradores configuran el consultorio." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader icon={SettingsIcon} titulo="Configuración" subtitulo="Datos del consultorio y de los profesionales" />
      <Tabs defaultValue="consultorio">
        <TabsList className="mb-5">
          <TabsTrigger value="consultorio">
            <Building2 className="mr-1.5 h-4 w-4" />
            Consultorio
          </TabsTrigger>
          <TabsTrigger value="profesionales">
            <Stethoscope className="mr-1.5 h-4 w-4" />
            Profesionales
          </TabsTrigger>
        </TabsList>
        <TabsContent value="consultorio">
          <DatosConsultorio />
        </TabsContent>
        <TabsContent value="profesionales">
          <Profesionales />
        </TabsContent>
      </Tabs>
    </div>
  );
}
