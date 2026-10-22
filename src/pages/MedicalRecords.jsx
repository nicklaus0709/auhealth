import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, FileText, FolderOpen, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import HistoriaClinica from "@/components/records/HistoriaClinica";
import PacienteCombobox from "@/components/patients/PacienteCombobox";
import { useToast } from "@/components/ui/use-toast";
import useSesion from "@/hooks/useSesion";
import { log } from "@/lib/log";

export default function MedicalRecords() {
  const { toast } = useToast();
  const { esMedico } = useSesion();
  const [params] = useSearchParams();
  const [pacienteElegido, setPacienteElegido] = useState(null);
  const historia = useRef(null);

  // /medical-records?paciente=<id> abre directamente ese paciente (por ejemplo desde la ficha)
  useEffect(() => {
    const id = params.get("paciente");
    if (!id || !esMedico) return;
    base44.entities.Paciente.get(id)
      .then(setPacienteElegido)
      .catch((error) => log.error("No se pudo abrir el paciente pedido", error, { pantalla: "MedicalRecords" }));
  }, [params, esMedico]);

  // El servidor ya bloquea los historiales para quien no es médico; acá sólo lo explicamos.
  if (!esMedico) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <EmptyState
          icon={ShieldAlert}
          titulo="No tenés permisos para ver los historiales"
          descripcion="Sólo los médicos y administradores acceden a la historia clínica."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        icon={FileText}
        titulo="Historiales Médicos"
        accion={
          <Button
            className="btn-gradient"
            onClick={() =>
              pacienteElegido
                ? historia.current?.nuevaAtencion()
                : toast({ title: "Elegí un paciente", description: "Primero seleccioná el paciente de la atención." })
            }
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nueva Atención
          </Button>
        }
      />

      <div className="glass mb-6 rounded-xl border border-border p-4 shadow-soft">
        <label htmlFor="historial-paciente" className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Paciente
        </label>
        <PacienteCombobox
          id="historial-paciente"
          seleccionado={pacienteElegido}
          onElegir={setPacienteElegido}
          soloActivos={false}
          className="mt-2 h-12"
        />
      </div>

      {!pacienteElegido ? (
        <div className="rounded-2xl border border-border bg-card shadow-soft">
          <EmptyState icon={FolderOpen} titulo="Seleccioná un paciente para ver su historial médico" />
        </div>
      ) : (
        <HistoriaClinica ref={historia} paciente={pacienteElegido} />
      )}
    </div>
  );
}
