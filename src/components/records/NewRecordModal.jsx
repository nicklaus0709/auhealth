import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UploadCloud, X, FileText, Image as ImageIcon, Loader2 } from "lucide-react";
import { pesoArchivo } from "@/lib/format";

const MAX_PESO = 10 * 1024 * 1024;
const TIPOS = [
  "image/",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

const VACIO = { motivo_consulta: "", diagnostico: "", tratamiento: "", notas: "" };

const aceptado = (archivo) =>
  TIPOS.some((tipo) => (tipo.endsWith("/") ? archivo.type.startsWith(tipo) : archivo.type === tipo));

export default function NewRecordModal({ abierto, onOpenChange, onGuardar, guardando, historial }) {
  const [datos, setDatos] = useState(VACIO);
  const [archivos, setArchivos] = useState([]);
  const [arrastrando, setArrastrando] = useState(false);
  const [aviso, setAviso] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    if (!abierto) return;
    setDatos(
      historial
        ? {
            motivo_consulta: historial.motivo_consulta || "",
            diagnostico: historial.diagnostico || "",
            tratamiento: historial.tratamiento || "",
            notas: historial.notas || "",
          }
        : VACIO
    );
    setArchivos([]);
    setAviso("");
  }, [abierto, historial]);

  const set = (campo) => (e) => setDatos((previos) => ({ ...previos, [campo]: e.target.value }));

  const agregar = (lista) => {
    const nuevos = [];
    let rechazados = 0;
    Array.from(lista).forEach((archivo) => {
      if (!aceptado(archivo) || archivo.size > MAX_PESO) {
        rechazados += 1;
        return;
      }
      nuevos.push({
        file: archivo,
        preview: archivo.type.startsWith("image/") ? URL.createObjectURL(archivo) : null,
      });
    });
    if (nuevos.length) setArchivos((previos) => [...previos, ...nuevos]);
    setAviso(rechazados ? `${rechazados} archivo(s) no se agregaron: sólo imágenes, PDFs y documentos de hasta 10 MB.` : "");
  };

  const quitar = (indice) => {
    setArchivos((previos) => {
      const copia = [...previos];
      const [sacado] = copia.splice(indice, 1);
      if (sacado?.preview) URL.revokeObjectURL(sacado.preview);
      return copia;
    });
  };

  const enviar = (e) => {
    e.preventDefault();
    onGuardar({ ...datos, archivos: archivos.map((a) => a.file) });
  };

  return (
    <Dialog open={abierto} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg">
            {historial ? "Editar Atención Médica" : "Nueva Atención Médica"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={enviar} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="motivo_consulta">Motivo de Consulta *</Label>
            <Textarea id="motivo_consulta" required rows={3} value={datos.motivo_consulta} onChange={set("motivo_consulta")} placeholder="Describe el motivo de la consulta..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="diagnostico">Diagnóstico *</Label>
            <Textarea id="diagnostico" required rows={3} value={datos.diagnostico} onChange={set("diagnostico")} placeholder="Diagnóstico médico..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tratamiento">Tratamiento</Label>
            <Textarea id="tratamiento" rows={3} value={datos.tratamiento} onChange={set("tratamiento")} placeholder="Indicaciones y tratamiento..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notas">Notas y Observaciones</Label>
            <Textarea id="notas" rows={3} value={datos.notas} onChange={set("notas")} placeholder="Notas adicionales..." />
          </div>

          <div className="space-y-3">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setArrastrando(true);
              }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={(e) => {
                e.preventDefault();
                setArrastrando(false);
                agregar(e.dataTransfer.files);
              }}
              onClick={() => inputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-7 text-center transition-colors ${
                arrastrando ? "border-brand-teal bg-brand-teal/5" : "border-border hover:border-brand-teal"
              }`}
            >
              <UploadCloud className="h-6 w-6 text-brand-teal" strokeWidth={1.9} />
              <p className="mt-2 text-sm font-medium text-foreground">Arrastrá archivos o hacé click para seleccionar</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Imágenes, PDFs y documentos (máx. 10MB por archivo)</p>
              <input
                ref={inputRef}
                type="file"
                multiple
                className="hidden"
                accept="image/*,application/pdf,.doc,.docx,.txt"
                onChange={(e) => {
                  agregar(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {aviso && <p className="text-xs text-destructive">{aviso}</p>}

            {historial?.adjuntos?.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {historial.adjuntos.length} archivo(s) ya guardado(s) en esta atención.
              </p>
            )}

            {archivos.length > 0 && (
              <div className="rounded-xl border border-border bg-muted/40 p-3">
                <p className="text-xs font-medium text-muted-foreground">
                  {archivos.length} archivo(s) seleccionado(s)
                </p>
                <ul className="mt-2 space-y-2">
                  {archivos.map((archivo, i) => (
                    <li key={`${archivo.file.name}-${i}`} className="flex items-center gap-3 rounded-lg bg-card p-2">
                      {archivo.preview ? (
                        <img src={archivo.preview} alt={archivo.file.name} className="h-10 w-10 rounded-md object-cover" />
                      ) : (
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-muted">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-foreground">{archivo.file.name}</p>
                        <p className="text-xs text-muted-foreground">{pesoArchivo(archivo.file.size)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => quitar(i)}
                        aria-label={`Quitar ${archivo.file.name}`}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={guardando}>
              Cancelar
            </Button>
            <Button type="submit" className="btn-gradient" disabled={guardando}>
              {guardando && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {guardando ? "Guardando..." : historial ? "Guardar Cambios" : "Registrar Atención"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}