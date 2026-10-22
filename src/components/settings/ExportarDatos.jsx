import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import useSesion from "@/hooks/useSesion";
import { exportarExcel, traerTodo } from "@/lib/exportar";
import { auditar, log } from "@/lib/log";

const ENTIDADES = [
  ["Pacientes", "Paciente"],
  ["Antecedentes", "Antecedentes"],
  ["Atenciones", "HistorialClinico"],
  ["Notas de atenciones", "HistorialAddenda"],
  ["Documentos", "DocumentoClinico"],
  ["Turnos", "Turno"],
  ["Cobros", "Pago"],
  ["Liquidaciones", "Liquidacion"],
  ["Caja", "Caja"],
  ["Profesionales", "Profesional"],
  ["Obras sociales", "ObraSocial"],
  ["Prestaciones", "Prestacion"],
];

/** Copia de seguridad de toda la información del consultorio en un Excel (una hoja por tabla). Sólo admin. */
export default function ExportarDatos() {
  const { toast } = useToast();
  const { nombre } = useSesion();
  const [exportando, setExportando] = useState(false);

  const exportar = async () => {
    setExportando(true);
    try {
      const hojas = {};
      for (const [hoja, entidad] of ENTIDADES) {
        hojas[hoja] = await traerTodo(entidad);
      }
      await exportarExcel(hojas, `auhealth-copia-${format(new Date(), "yyyy-MM-dd")}`);
      auditar("exportar", "Consultorio", { usuario_nombre: nombre, detalle: "copia completa" });
      toast({ title: "Copia descargada", description: "Guardala en un lugar seguro: contiene datos de salud." });
    } catch (error) {
      log.error("No se pudo exportar la copia", error, { componente: "ExportarDatos" });
      toast({ variant: "destructive", title: "No pudimos generar la copia" });
    } finally {
      setExportando(false);
    }
  };

  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <h2 className="font-heading text-base font-semibold text-foreground">Copia de seguridad</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Descarga toda la información del consultorio en un Excel, una hoja por tabla. Contiene historias clínicas: guardalo cifrado y no lo
        compartas por mail.
      </p>
      <Button variant="outline" className="mt-4" onClick={exportar} disabled={exportando}>
        {exportando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-1.5 h-4 w-4" />}
        {exportando ? "Generando..." : "Descargar copia completa"}
      </Button>
    </section>
  );
}
