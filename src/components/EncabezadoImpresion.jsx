import { useConsultorio } from "@/hooks/useDatos";
import { fechaHora } from "@/lib/format";

/** Membrete del consultorio que sólo aparece al imprimir (fichas, historia clínica y documentos). */
export default function EncabezadoImpresion() {
  const { data: consultorio } = useConsultorio();
  return (
    <div className="mb-6 hidden items-center justify-between border-b border-border pb-4 print:flex">
      <div className="flex items-center gap-3">
        {consultorio?.logo_url && <img src={consultorio.logo_url} alt="" className="h-12 w-12 object-contain" />}
        <div>
          <p className="font-heading text-lg font-bold">{consultorio?.nombre || "AuHealth"}</p>
          <p className="text-xs">
            {[consultorio?.direccion, consultorio?.localidad, consultorio?.telefono].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>
      <p className="text-xs">Impreso el {fechaHora(new Date().toISOString())}</p>
    </div>
  );
}
