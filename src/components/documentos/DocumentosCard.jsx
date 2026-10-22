import { useEffect, useState } from "react";
import { FilePlus2, FileText, Loader2, Paperclip } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/EmptyState";
import Cie10Input from "@/components/records/Cie10Input";
import DocumentoImprimible from "@/components/documentos/DocumentoImprimible";
import { useToast } from "@/components/ui/use-toast";
import useSesion from "@/hooks/useSesion";
import { useMiProfesional } from "@/hooks/useDatos";
import { OPCIONES_DOCUMENTO, TIPOS_DOCUMENTO, etiquetaTipo } from "@/lib/documentos";
import { fechaHora } from "@/lib/format";
import { auditar, log } from "@/lib/log";

const matriculaDe = (p) => [p?.matricula_nacional && `MN ${p.matricula_nacional}`, p?.matricula_provincial && `MP ${p.matricula_provincial}`].filter(Boolean).join(" · ");

/** Órdenes, derivaciones, certificados, indicaciones y consentimientos del paciente, firmados por el profesional. */
export default function DocumentosCard({ paciente }) {
  const { toast } = useToast();
  const { user, nombre } = useSesion();
  const { data: miProfesional } = useMiProfesional();
  const [documentos, setDocumentos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [abierto, setAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [viendo, setViendo] = useState(null);
  const [clave, setClave] = useState("orden_estudio");
  const [datos, setDatos] = useState({ titulo: "", contenido: "", diagnostico: "", diagnostico_cie10: "" });
  const [archivo, setArchivo] = useState(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const res = await base44.entities.DocumentoClinico.filter({ paciente: paciente.id }, { sort: "-fecha", limit: 100 });
      setDocumentos(res.items ?? res);
    } catch (error) {
      log.error("No se pudieron cargar los documentos", error, { componente: "DocumentosCard" });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [paciente.id]);

  const elegirTipo = (nueva) => {
    setClave(nueva);
    const t = TIPOS_DOCUMENTO[nueva];
    setDatos((d) => ({ ...d, titulo: t.titulo, contenido: t.plantilla }));
  };

  const abrir = () => {
    elegirTipo("orden_estudio");
    setDatos((d) => ({ ...d, diagnostico: "", diagnostico_cie10: "" }));
    setArchivo(null);
    setAbierto(true);
  };

  const emitir = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      let adjuntos = [];
      if (archivo) {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: archivo });
        adjuntos = [{ nombre: archivo.name, url: file_uri, tipo: archivo.type, tamano: archivo.size }];
      }
      const opcion = OPCIONES_DOCUMENTO.find((o) => o.clave === clave);
      const creado = await base44.entities.DocumentoClinico.create({
        tipo: opcion?.tipo || clave,
        paciente: paciente.id,
        paciente_nombre: paciente.nombre_completo,
        paciente_dni: paciente.dni || "",
        paciente_obra_social: [paciente.obra_social, paciente.numero_afiliado].filter(Boolean).join(" · "),
        titulo: datos.titulo.trim() || TIPOS_DOCUMENTO[clave].titulo,
        contenido: datos.contenido,
        diagnostico: datos.diagnostico,
        diagnostico_cie10: datos.diagnostico_cie10,
        medico: user?.id || "",
        medico_nombre: miProfesional?.nombre_completo || nombre,
        medico_matricula: matriculaDe(miProfesional),
        profesional: miProfesional?.id || "",
        fecha: new Date().toISOString(),
        adjuntos,
      });
      auditar("crear", "DocumentoClinico", { registro: creado?.id || "", paciente: paciente.id, usuario_nombre: nombre, detalle: clave });
      toast({ title: "Documento emitido" });
      setAbierto(false);
      await cargar();
      setViendo(creado);
    } catch (error) {
      log.error("No se pudo emitir el documento", error, { componente: "DocumentosCard" });
      toast({ variant: "destructive", title: "No pudimos emitir el documento", description: error?.message });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-base font-semibold text-foreground">Documentos</h2>
          <p className="text-xs text-muted-foreground">
            Órdenes, derivaciones, certificados y consentimientos. Las recetas de medicamentos se emiten por receta electrónica.
          </p>
        </div>
        <Button className="btn-gradient" onClick={abrir}>
          <FilePlus2 className="mr-1.5 h-4 w-4" />
          Nuevo documento
        </Button>
      </div>

      {!miProfesional && (
        <p className="mt-3 rounded-xl bg-brand-amber/10 px-3 py-2 text-xs text-brand-amber-700">
          Tu usuario no está vinculado a una ficha de profesional: los documentos saldrán sin matrícula ni firma. Pedile al admin que lo vincule en Configuración.
        </p>
      )}

      {cargando ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-brand-teal" />
        </div>
      ) : documentos.length === 0 ? (
        <EmptyState icon={FileText} titulo="Sin documentos emitidos" />
      ) : (
        <ul className="mt-4 divide-y divide-border">
          {documentos.map((d) => (
            <li key={d.id}>
              <button type="button" onClick={() => setViendo(d)} className="flex w-full items-center gap-3 py-3 text-left text-sm hover:bg-muted/40">
                <FileText className="h-4 w-4 shrink-0 text-brand-teal-700" />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground">{d.titulo}</span>
                  <span className="block text-xs text-muted-foreground">
                    {etiquetaTipo(d.tipo)} · {fechaHora(d.fecha)} · {d.medico_nombre}
                  </span>
                </span>
                {d.adjuntos?.length > 0 && <Paperclip className="h-4 w-4 text-muted-foreground" aria-label="Tiene adjunto" />}
              </button>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={abierto} onOpenChange={setAbierto}>
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">Nuevo documento</DialogTitle>
          </DialogHeader>
          <form onSubmit={emitir} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="doc-tipo">Tipo</Label>
                <Select value={clave} onValueChange={elegirTipo}>
                  <SelectTrigger id="doc-tipo" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPCIONES_DOCUMENTO.map((o) => (
                      <SelectItem key={o.clave} value={o.clave}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="doc-titulo">Título</Label>
                <Input id="doc-titulo" value={datos.titulo} onChange={(e) => setDatos((d) => ({ ...d, titulo: e.target.value }))} className="h-11" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-cie10">Diagnóstico (opcional)</Label>
              <Cie10Input
                id="doc-cie10"
                codigo={datos.diagnostico_cie10}
                onElegir={({ codigo, descripcion }) => setDatos((d) => ({ ...d, diagnostico_cie10: codigo, diagnostico: descripcion || d.diagnostico }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="doc-contenido">Contenido *</Label>
              <Textarea id="doc-contenido" required rows={10} value={datos.contenido} onChange={(e) => setDatos((d) => ({ ...d, contenido: e.target.value }))} />
            </div>
            {clave === "consentimiento" && (
              <div className="space-y-2">
                <Label htmlFor="doc-adjunto">Consentimiento firmado (foto o PDF, opcional)</Label>
                <Input id="doc-adjunto" type="file" accept="image/*,application/pdf" onChange={(e) => setArchivo(e.target.files?.[0] || null)} className="h-11" />
              </div>
            )}
            <p className="text-xs text-muted-foreground">Una vez emitido el documento no se edita: si hay un error, emití uno nuevo.</p>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setAbierto(false)} disabled={guardando}>
                Cancelar
              </Button>
              <Button type="submit" className="btn-gradient" disabled={guardando}>
                {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Emitir
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <DocumentoImprimible documento={viendo} onOpenChange={(v) => !v && setViendo(null)} />
    </section>
  );
}
