import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useConsultorio, useProfesionales } from "@/hooks/useDatos";
import { fechaLarga } from "@/lib/format";

function Hoja({ documento, consultorio, firmaUrl }) {
  return (
    <article className="mx-auto max-w-[680px] bg-white p-8 text-[13px] leading-relaxed text-black">
      <header className="flex items-start justify-between border-b border-black/20 pb-4">
        <div className="flex items-center gap-3">
          {consultorio?.logo_url && <img src={consultorio.logo_url} alt="" className="h-14 w-14 object-contain" />}
          <div>
            <p className="text-base font-bold">{consultorio?.nombre || "Consultorio"}</p>
            <p className="text-xs">{[consultorio?.direccion, consultorio?.localidad].filter(Boolean).join(", ")}</p>
            <p className="text-xs">{[consultorio?.telefono, consultorio?.email].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
        <p className="text-xs">{fechaLarga(documento.fecha)}</p>
      </header>

      <h1 className="mt-6 text-center text-lg font-bold uppercase tracking-wide">{documento.titulo}</h1>

      <section className="mt-5 grid grid-cols-2 gap-1 text-xs">
        <p>
          <strong>Paciente:</strong> {documento.paciente_nombre}
        </p>
        <p>
          <strong>DNI:</strong> {documento.paciente_dni || "—"}
        </p>
        <p>
          <strong>Obra social:</strong> {documento.paciente_obra_social || "Particular"}
        </p>
        {documento.diagnostico_cie10 || documento.diagnostico ? (
          <p>
            <strong>Diagnóstico:</strong> {[documento.diagnostico_cie10, documento.diagnostico].filter(Boolean).join(" ")}
          </p>
        ) : null}
      </section>

      <div className="mt-6 min-h-[220px] whitespace-pre-wrap">{documento.contenido}</div>

      <footer className="mt-12 flex justify-end">
        <div className="w-64 text-center text-xs">
          {firmaUrl ? <img src={firmaUrl} alt="Firma" className="mx-auto h-16 object-contain" /> : <div className="h-16" />}
          <div className="border-t border-black/40 pt-1">
            <p className="font-semibold">{documento.medico_nombre}</p>
            <p>{documento.medico_matricula}</p>
          </div>
        </div>
      </footer>
    </article>
  );
}

/** Vista previa e impresión de un documento con membrete, datos del paciente y firma del profesional. */
export default function DocumentoImprimible({ documento, onOpenChange }) {
  const { data: consultorio } = useConsultorio();
  const { data: profesionales = [] } = useProfesionales({ incluirInactivos: true });
  const [firmaUrl, setFirmaUrl] = useState("");
  const profesional = profesionales.find((p) => p.id === documento?.profesional);

  useEffect(() => {
    setFirmaUrl("");
    if (!profesional?.firma_url) return;
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: profesional.firma_url })
      .then((res) => setFirmaUrl(res?.signed_url || ""))
      .catch(() => setFirmaUrl(""));
  }, [profesional?.firma_url]);

  // Al imprimir sólo sale la hoja: el resto de la app se oculta con la clase del body (ver index.css)
  const imprimir = () => {
    document.body.classList.add("imprimiendo-documento");
    const limpiar = () => {
      document.body.classList.remove("imprimiendo-documento");
      window.removeEventListener("afterprint", limpiar);
    };
    window.addEventListener("afterprint", limpiar);
    window.print();
  };

  if (!documento) return null;

  return (
    <>
      <Dialog open={!!documento} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-lg">{documento.titulo}</DialogTitle>
          </DialogHeader>
          <div className="rounded-xl border border-border bg-muted/40 p-3">
            <Hoja documento={documento} consultorio={consultorio} firmaUrl={firmaUrl} />
          </div>
          <div className="flex justify-end">
            <Button className="btn-gradient" onClick={imprimir}>
              <Printer className="mr-1.5 h-4 w-4" />
              Imprimir o guardar PDF
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {createPortal(
        <div id="hoja-impresion">
          <Hoja documento={documento} consultorio={consultorio} firmaUrl={firmaUrl} />
        </div>,
        document.body
      )}
    </>
  );
}
