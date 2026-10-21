import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Download, FileText, Image as ImageIcon, Paperclip, Pencil } from "lucide-react";
import AttachmentPreviewModal from "@/components/records/AttachmentPreviewModal";
import { fechaLarga, esImagen, truncar } from "@/lib/format";

function Seccion({ etiqueta, texto }) {
  if (!texto || !String(texto).trim()) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{etiqueta}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{texto}</p>
    </div>
  );
}

export default function MedicalRecordCard({ historial, puedeEditar = false, onEditar }) {
  const [preview, setPreview] = useState(null);
  const adjuntos = historial.adjuntos || [];

  const descargar = async (adjunto) => {
    const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: adjunto.url });
    if (res?.signed_url) window.open(res.signed_url, "_blank");
  };

  return (
    <article className="animate-fade-in rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground">{fechaLarga(historial.fecha_atencion)}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Paciente: {historial.paciente_nombre}
            {historial.paciente_ficha ? ` (${historial.paciente_ficha})` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {adjuntos.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-medium text-brand-blue">
              <Paperclip className="h-3.5 w-3.5" />
              {adjuntos.length}
            </span>
          )}
          {puedeEditar && (
            <button
              type="button"
              onClick={() => onEditar?.(historial)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-brand-teal/40 hover:text-brand-teal"
            >
              <Pencil className="h-3.5 w-3.5" />
              Editar
            </button>
          )}
        </div>
      </header>

      <div className="mt-5 space-y-4">
        <Seccion etiqueta="Motivo de Consulta" texto={historial.motivo_consulta} />
        <Seccion etiqueta="Diagnóstico" texto={historial.diagnostico} />
        <Seccion etiqueta="Tratamiento" texto={historial.tratamiento} />
        <Seccion etiqueta="Notas" texto={historial.notas} />
      </div>

      {adjuntos.length > 0 && (
        <div className="mt-6 border-t border-border pt-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Archivos Adjuntos ({adjuntos.length})
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {adjuntos.map((adjunto, i) => {
              const imagen = esImagen(adjunto.tipo);
              return (
                <div key={`${adjunto.url}-${i}`} className="rounded-xl border border-border bg-muted/40 p-3">
                  <button
                    type="button"
                    disabled={!imagen}
                    onClick={() => imagen && setPreview(adjunto)}
                    className="grid h-20 w-full place-items-center rounded-lg bg-card transition-colors enabled:hover:bg-brand-blue/5 disabled:cursor-default"
                    aria-label={imagen ? `Ver ${adjunto.nombre}` : adjunto.nombre}
                  >
                    {imagen ? (
                      <ImageIcon className="h-7 w-7 text-brand-blue" strokeWidth={1.8} />
                    ) : (
                      <FileText className="h-7 w-7 text-muted-foreground" strokeWidth={1.8} />
                    )}
                  </button>
                  <p className="mt-2 truncate text-xs text-foreground" title={adjunto.nombre}>
                    {truncar(adjunto.nombre)}
                  </p>
                  <button
                    type="button"
                    onClick={() => descargar(adjunto)}
                    className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-brand-teal hover:underline"
                  >
                    <Download className="h-3 w-3" />
                    Descargar
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <AttachmentPreviewModal adjunto={preview} onOpenChange={(v) => !v && setPreview(null)} />
    </article>
  );
}