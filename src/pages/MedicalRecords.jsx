import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, FileText, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import MedicalRecordCard from "@/components/records/MedicalRecordCard";
import NewRecordModal from "@/components/records/NewRecordModal";
import { useToast } from "@/components/ui/use-toast";
import useSesion from "@/hooks/useSesion";

export default function MedicalRecords() {
  const { toast } = useToast();
  const { user, nombre, esMedico, esAdmin } = useSesion();
  const [pacientes, setPacientes] = useState([]);
  const [pacienteId, setPacienteId] = useState("");
  const [historiales, setHistoriales] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await base44.entities.Paciente.filter({ activo: true }, { sort: "nombre_completo", limit: 300 });
      setPacientes(res.items ?? res);
    })();
  }, []);

  const cargarHistoriales = async (id) => {
    if (!id) {
      setHistoriales([]);
      return;
    }
    setCargando(true);
    try {
      const res = await base44.entities.HistorialClinico.filter(
        { paciente: id },
        { sort: "-fecha_atencion", limit: 100 }
      );
      setHistoriales(res.items ?? res);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarHistoriales(pacienteId);
  }, [pacienteId]);

  const abrirModal = (historial = null) => {
    if (!pacienteId) {
      toast({ title: "Elegí un paciente", description: "Primero seleccioná el paciente de la atención." });
      return;
    }
    if (historial) {
      if (!esAdmin && historial.created_by_id !== user?.id) {
        toast({
          variant: "destructive",
          title: "Sólo podés editar los historiales que creaste",
        });
        return;
      }
    } else if (!esMedico) {
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
        // si un archivo falla, seguimos con los demás
      }
    }
    return subidos;
  };

  const guardar = async ({ motivo_consulta, diagnostico, tratamiento, notas, archivos }) => {
    setGuardando(true);
    try {
      const nuevos = await subirAdjuntos(archivos);

      if (editando) {
        await base44.entities.HistorialClinico.update(editando.id, {
          motivo_consulta,
          diagnostico,
          tratamiento,
          notas,
          adjuntos: [...(editando.adjuntos || []), ...nuevos],
        });
        toast({ title: "Atención actualizada" });
      } else {
        const paciente = pacientes.find((p) => p.id === pacienteId);
        await base44.entities.HistorialClinico.create({
          paciente: pacienteId,
          paciente_nombre: paciente?.nombre_completo || "",
          paciente_ficha: paciente?.numero_ficha || "",
          medico: user?.id || "",
          medico_nombre: nombre,
          fecha_atencion: new Date().toISOString(),
          motivo_consulta,
          diagnostico,
          tratamiento,
          notas,
          adjuntos: nuevos,
        });
        toast({ title: "Atención registrada" });
      }

      setModalAbierto(false);
      setEditando(null);
      await cargarHistoriales(pacienteId);
    } catch (error) {
      toast({
        variant: "destructive",
        title: editando ? "No pudimos actualizar la atención" : "No pudimos registrar la atención",
        description: error?.message,
      });
    } finally {
      setGuardando(false);
    }
  };

  const pacienteElegido = pacientes.find((p) => p.id === pacienteId);

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
        <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Paciente
        </label>
        <Select value={pacienteId} onValueChange={setPacienteId}>
          <SelectTrigger className="mt-2 h-12 bg-card">
            <SelectValue placeholder="Seleccioná un paciente" />
          </SelectTrigger>
          <SelectContent>
            {pacientes.map((paciente) => (
              <SelectItem key={paciente.id} value={paciente.id}>
                {paciente.nombre_completo} - {paciente.numero_ficha}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
              puedeEditar={esAdmin || historial.created_by_id === user?.id}
              onEditar={abrirModal}
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