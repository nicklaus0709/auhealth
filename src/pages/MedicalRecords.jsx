import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, FileText, FolderOpen, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import MedicalRecordCard from "@/components/records/MedicalRecordCard";
import NewRecordModal from "@/components/records/NewRecordModal";
import PacienteCombobox from "@/components/patients/PacienteCombobox";
import { useToast } from "@/components/ui/use-toast";
import useSesion from "@/hooks/useSesion";
import { auditar, log } from "@/lib/log";

export default function MedicalRecords() {
  const { toast } = useToast();
  const { user, nombre, esMedico } = useSesion();
  const [pacienteElegido, setPacienteElegido] = useState(null);
  const pacienteId = pacienteElegido?.id || "";
  const [historiales, setHistoriales] = useState([]);
  const [addendas, setAddendas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(null);

  const cargarHistoriales = async (id) => {
    if (!id) {
      setHistoriales([]);
      setAddendas([]);
      return;
    }
    setCargando(true);
    try {
      const [res, notas] = await Promise.all([
        base44.entities.HistorialClinico.filter({ paciente: id }, { sort: "-fecha_atencion", limit: 100 }),
        base44.entities.HistorialAddenda.filter({ paciente: id }, { sort: "fecha", limit: 500 }),
      ]);
      setHistoriales(res.items ?? res);
      setAddendas(notas.items ?? notas);
    } catch (error) {
      log.error("No se pudo cargar la historia clínica", error, { pantalla: "MedicalRecords" });
      toast({ variant: "destructive", title: "No pudimos cargar la historia clínica" });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (!esMedico) return;
    cargarHistoriales(pacienteId);
    if (pacienteId) auditar("ver", "HistorialClinico", { paciente: pacienteId, usuario_nombre: nombre });
  }, [pacienteId, esMedico]);

  const abrirModal = (historial = null) => {
    if (!pacienteId) {
      toast({ title: "Elegí un paciente", description: "Primero seleccioná el paciente de la atención." });
      return;
    }
    if (!esMedico) {
      toast({
        variant: "destructive",
        title: "Necesitás rol de Médico o Administrador",
        description: "Pedile a un administrador que te asigne el rol.",
      });
      return;
    }
    setEditando(historial);
    setModalAbierto(true);
  };

  const subirAdjuntos = async (archivos) => {
    const subidos = [];
    const fallidos = [];
    for (const archivo of archivos) {
      try {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: archivo });
        subidos.push({
          nombre: archivo.name,
          url: file_uri,
          tipo: archivo.type,
          tamano: archivo.size,
        });
      } catch (error) {
        // si un archivo falla, seguimos con los demás y avisamos al final
        fallidos.push(archivo.name);
        log.error("No se pudo subir un adjunto", error, { pantalla: "MedicalRecords", tipo: archivo.type, tamano: archivo.size });
      }
    }
    return { subidos, fallidos };
  };

  const guardar = async ({ motivo_consulta, diagnostico, tratamiento, notas, texto, archivos }) => {
    setGuardando(true);
    try {
      const { subidos: nuevos, fallidos } = await subirAdjuntos(archivos);

      if (editando) {
        const addenda = await base44.entities.HistorialAddenda.create({
          historial: editando.id,
          paciente: pacienteId,
          medico: user?.id || "",
          medico_nombre: nombre,
          fecha: new Date().toISOString(),
          texto,
          adjuntos: nuevos,
        });
        auditar("addenda", "HistorialClinico", { registro: editando.id, paciente: pacienteId, usuario_nombre: nombre, detalle: addenda?.id || "" });
        toast({ title: "Nota agregada a la atención" });
      } else {
        const creado = await base44.entities.HistorialClinico.create({
          paciente: pacienteId,
          paciente_nombre: pacienteElegido?.nombre_completo || "",
          paciente_ficha: pacienteElegido?.numero_ficha || "",
          medico: user?.id || "",
          medico_nombre: nombre,
          fecha_atencion: new Date().toISOString(),
          motivo_consulta,
          diagnostico,
          tratamiento,
          notas,
          adjuntos: nuevos,
        });
        auditar("crear", "HistorialClinico", { registro: creado?.id || "", paciente: pacienteId, usuario_nombre: nombre });
        toast({ title: "Atención registrada" });
      }
      if (fallidos.length) {
        toast({
          variant: "destructive",
          title: `${fallidos.length} archivo(s) no se pudieron subir`,
          description: `${fallidos.join(", ")}. Probá agregarlos de nuevo con "Agregar nota".`,
        });
      }

      setModalAbierto(false);
      setEditando(null);
      await cargarHistoriales(pacienteId);
    } catch (error) {
      toast({
        variant: "destructive",
        title: editando ? "No pudimos agregar la nota" : "No pudimos registrar la atención",
        description: error?.message,
      });
    } finally {
      setGuardando(false);
    }
  };

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
          <Button className="btn-gradient" onClick={() => abrirModal()}>
            <Plus className="mr-1.5 h-4 w-4" />
            Nueva Atención
          </Button>
        }
      />

      <div className="glass mb-6 rounded-xl border border-white/60 p-4 shadow-soft">
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

      {!pacienteId ? (
        <div className="rounded-2xl border border-border bg-card shadow-soft">
          <EmptyState icon={FolderOpen} titulo="Seleccioná un paciente para ver su historial médico" />
        </div>
      ) : cargando ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-brand-teal" />
        </div>
      ) : historiales.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-soft">
          <EmptyState
            icon={FileText}
            titulo="No hay registros médicos para este paciente"
            descripcion={pacienteElegido?.nombre_completo}
            accion={
              <Button className="btn-gradient" onClick={() => abrirModal()}>
                <Plus className="mr-1.5 h-4 w-4" />
                Registrar primera atención
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-4">
          {historiales.map((historial) => (
            <MedicalRecordCard
              key={historial.id}
              historial={historial}
              addendas={addendas.filter((a) => a.historial === historial.id)}
              puedeAgregarNota={esMedico}
              onAgregarNota={abrirModal}
            />
          ))}
        </div>
      )}

      <NewRecordModal
        abierto={modalAbierto}
        onOpenChange={(v) => {
          setModalAbierto(v);
          if (!v) setEditando(null);
        }}
        onGuardar={guardar}
        guardando={guardando}
        historial={editando}
      />
    </div>
  );
}