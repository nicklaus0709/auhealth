import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { FileText, Plus } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import MedicalRecordCard from "@/components/records/MedicalRecordCard";
import NewRecordModal from "@/components/records/NewRecordModal";
import { useToast } from "@/components/ui/use-toast";
import useSesion from "@/hooks/useSesion";
import { useMiProfesional } from "@/hooks/useDatos";
import { auditar, log } from "@/lib/log";

const matriculaDe = (profesional) =>
  [profesional?.matricula_nacional && `MN ${profesional.matricula_nacional}`, profesional?.matricula_provincial && `MP ${profesional.matricula_provincial}`]
    .filter(Boolean)
    .join(" · ");

/**
 * Historia clínica de un paciente: atenciones + notas (addendas). La usan la pantalla de Historiales
 * y la ficha del paciente. Expone `nuevaAtencion()` por ref para abrir el alta desde afuera
 * (por ejemplo desde un turno atendido); `turno` vincula la atención con ese turno.
 */
const HistoriaClinica = forwardRef(function HistoriaClinica({ paciente, turno = null, onRegistrada }, ref) {
  const { toast } = useToast();
  const { user, nombre, esMedico } = useSesion();
  const { data: miProfesional } = useMiProfesional();
  const [historiales, setHistoriales] = useState([]);
  const [addendas, setAddendas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [editando, setEditando] = useState(null);
  const pacienteId = paciente?.id || "";

  const cargar = async () => {
    if (!pacienteId) {
      setHistoriales([]);
      setAddendas([]);
      return;
    }
    setCargando(true);
    try {
      const [res, notas] = await Promise.all([
        base44.entities.HistorialClinico.filter({ paciente: pacienteId }, { sort: "-fecha_atencion", limit: 100 }),
        base44.entities.HistorialAddenda.filter({ paciente: pacienteId }, { sort: "fecha", limit: 500 }),
      ]);
      setHistoriales(res.items ?? res);
      setAddendas(notas.items ?? notas);
    } catch (error) {
      log.error("No se pudo cargar la historia clínica", error, { componente: "HistoriaClinica" });
      toast({ variant: "destructive", title: "No pudimos cargar la historia clínica" });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    if (!esMedico) return;
    cargar();
    if (pacienteId) auditar("ver", "HistorialClinico", { paciente: pacienteId, usuario_nombre: nombre });
  }, [pacienteId, esMedico]);

  const abrirModal = (historial = null) => {
    if (!esMedico) {
      toast({ variant: "destructive", title: "Necesitás rol de Médico o Administrador" });
      return;
    }
    setEditando(historial);
    setModalAbierto(true);
  };

  useImperativeHandle(ref, () => ({ nuevaAtencion: () => abrirModal() }));

  const subirAdjuntos = async (archivos) => {
    const subidos = [];
    const fallidos = [];
    for (const archivo of archivos) {
      try {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: archivo });
        subidos.push({ nombre: archivo.name, url: file_uri, tipo: archivo.type, tamano: archivo.size });
      } catch (error) {
        // si un archivo falla, seguimos con los demás y avisamos al final
        fallidos.push(archivo.name);
        log.error("No se pudo subir un adjunto", error, { componente: "HistoriaClinica", tipo: archivo.type, tamano: archivo.size });
      }
    }
    return { subidos, fallidos };
  };

  // Firma: nombre y matrícula del profesional al momento de registrar (quedan fijos aunque cambien después)
  const firma = () => ({
    medico: user?.id || "",
    medico_nombre: miProfesional?.nombre_completo || nombre,
    medico_matricula: matriculaDe(miProfesional),
  });

  const guardar = async ({ motivo_consulta, diagnostico, diagnostico_cie10, tratamiento, notas, texto, archivos, signos_vitales }) => {
    setGuardando(true);
    try {
      const { subidos: nuevos, fallidos } = await subirAdjuntos(archivos);

      if (editando) {
        const addenda = await base44.entities.HistorialAddenda.create({
          historial: editando.id,
          paciente: pacienteId,
          ...firma(),
          fecha: new Date().toISOString(),
          texto,
          adjuntos: nuevos,
        });
        auditar("addenda", "HistorialClinico", { registro: editando.id, paciente: pacienteId, usuario_nombre: nombre, detalle: addenda?.id || "" });
        toast({ title: "Nota agregada a la atención" });
      } else {
        const creado = await base44.entities.HistorialClinico.create({
          paciente: pacienteId,
          paciente_nombre: paciente?.nombre_completo || "",
          paciente_ficha: paciente?.numero_ficha || "",
          ...firma(),
          turno: turno?.id || "",
          fecha_atencion: new Date().toISOString(),
          motivo_consulta,
          diagnostico,
          diagnostico_cie10: diagnostico_cie10 || "",
          tratamiento,
          notas,
          signos_vitales: signos_vitales || {},
          adjuntos: nuevos,
        });
        auditar("crear", "HistorialClinico", { registro: creado?.id || "", paciente: pacienteId, usuario_nombre: nombre });
        toast({ title: "Atención registrada" });
        onRegistrada?.(creado);
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
      await cargar();
    } catch (error) {
      log.error("No se pudo guardar en la historia clínica", error, { componente: "HistoriaClinica" });
      toast({
        variant: "destructive",
        title: editando ? "No pudimos agregar la nota" : "No pudimos registrar la atención",
        description: error?.message,
      });
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-brand-teal" />
        </div>
      ) : historiales.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-soft">
          <EmptyState
            icon={FileText}
            titulo="No hay registros médicos para este paciente"
            descripcion={paciente?.nombre_completo}
            accion={
              esMedico && (
                <Button className="btn-gradient" onClick={() => abrirModal()}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  Registrar primera atención
                </Button>
              )
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
    </>
  );
});

export default HistoriaClinica;
