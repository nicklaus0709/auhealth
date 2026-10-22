import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import PatientFormModal from "@/components/patients/PatientFormModal";
import PatientTable from "@/components/patients/PatientTable";
import PatientCardList from "@/components/patients/PatientCardList";
import { useToast } from "@/components/ui/use-toast";
import useSesion from "@/hooks/useSesion";
import { auditar, log } from "@/lib/log";

export default function Patients() {
  const { toast } = useToast();
  const { esAdmin, nombre } = useSesion();
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = async (texto) => {
    setCargando(true);
    try {
      const termino = texto.trim();
      const consulta = termino
        ? {
            $or: [
              { nombre_completo: { $regex: termino, $options: "i" } },
              { dni: { $regex: termino, $options: "i" } },
              { numero_ficha: { $regex: termino, $options: "i" } },
            ],
          }
        : {};
      const res = await base44.entities.Paciente.filter(consulta, { sort: "-created_date", limit: 200 });
      setPacientes(res.items ?? res);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => cargar(busqueda), 300);
    return () => clearTimeout(timer);
  }, [busqueda]);

  const siguienteFicha = async () => {
    const res = await base44.entities.Paciente.list({ sort: "-numero_ficha", limit: 1 });
    const ultimo = (res.items ?? res)[0]?.numero_ficha;
    const numero = ultimo ? parseInt(String(ultimo).replace(/\D/g, ""), 10) : 0;
    const siguiente = (Number.isNaN(numero) ? 0 : numero) + 1;
    return `P${String(siguiente).padStart(6, "0")}`;
  };

  const dniDuplicado = async (dni) => {
    const res = await base44.entities.Paciente.filter({ dni }, { limit: 5 });
    return (res.items ?? res).find((p) => p.id !== editando?.id);
  };

  // La ficha se calcula en el navegador, así que dos altas simultáneas pueden sacar el mismo número.
  // Después de crear verificamos: si otro paciente ya tenía ese número, el más nuevo toma el siguiente libre.
  // (La solución definitiva es generarlo en una función backend.)
  const asegurarFichaUnica = async (creado) => {
    let ficha = creado.numero_ficha;
    for (let intento = 0; intento < 3; intento += 1) {
      const res = await base44.entities.Paciente.filter({ numero_ficha: ficha }, { sort: "created_date", limit: 5 });
      const iguales = res.items ?? res;
      if (iguales.length <= 1 || iguales[0].id === creado.id) return ficha;
      ficha = await siguienteFicha();
      await base44.entities.Paciente.update(creado.id, { numero_ficha: ficha });
    }
    log.warn("No se pudo garantizar un número de ficha único", { registro: creado.id });
    return ficha;
  };

  const guardar = async (datos) => {
    setGuardando(true);
    try {
      const otro = await dniDuplicado(datos.dni);
      if (otro) {
        toast({
          variant: "destructive",
          title: "Ya existe un paciente con ese DNI",
          description: `Ficha ${otro.numero_ficha || "sin número"}${otro.activo === false ? " (dado de baja)" : ""}`,
        });
        return;
      }
      if (editando) {
        await base44.entities.Paciente.update(editando.id, datos);
        auditar("editar", "Paciente", { registro: editando.id, paciente: editando.id, usuario_nombre: nombre });
        toast({ title: "Paciente actualizado" });
      } else {
        const creado = await base44.entities.Paciente.create({ ...datos, numero_ficha: await siguienteFicha() });
        const numero_ficha = await asegurarFichaUnica(creado);
        auditar("crear", "Paciente", { registro: creado.id, paciente: creado.id, usuario_nombre: nombre });
        toast({ title: "Paciente creado", description: `Ficha ${numero_ficha}` });
      }
      setModalAbierto(false);
      setEditando(null);
      await cargar(busqueda);
    } catch (error) {
      log.error("No se pudo guardar el paciente", error, { pantalla: "Patients" });
      toast({
        variant: "destructive",
        title: "No pudimos guardar el paciente",
        description: error?.message || "Revisá los datos e intentá de nuevo",
      });
    } finally {
      setGuardando(false);
    }
  };

  // Los pacientes no se borran: su historia clínica se conserva. Se dan de baja y se pueden reactivar editándolos.
  const darDeBaja = async (paciente) => {
    const confirmado = window.confirm(
      `¿Dar de baja a ${paciente.nombre_completo}? Su historial se conserva y podés reactivarlo editando la ficha.`
    );
    if (!confirmado) return;
    try {
      await base44.entities.Paciente.update(paciente.id, { activo: false });
      auditar("baja", "Paciente", { registro: paciente.id, paciente: paciente.id, usuario_nombre: nombre });
      toast({ title: "Paciente dado de baja" });
      await cargar(busqueda);
    } catch (error) {
      toast({ variant: "destructive", title: "No pudimos dar de baja al paciente" });
    }
  };

  return (
    <div>
      <PageHeader
        icon={Users}
        titulo="Gestión de Pacientes"
        subtitulo="Administra la información de los pacientes"
        accion={
          <Button
            className="btn-gradient"
            onClick={() => {
              setEditando(null);
              setModalAbierto(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Nuevo Paciente
          </Button>
        }
      />

      <div className="glass mb-5 flex items-center gap-2 rounded-xl border border-white/60 px-3 shadow-soft">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre, DNI o número de ficha..."
          className="h-12 border-0 bg-transparent shadow-none focus-visible:ring-0"
        />
      </div>

      {cargando ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-brand-teal" />
        </div>
      ) : pacientes.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-soft">
          <EmptyState icon={Users} titulo="No se encontraron pacientes" descripcion={busqueda ? "Probá con otro término de búsqueda." : "Empezá agregando el primer paciente del consultorio."} />
        </div>
      ) : (
        <>
          <PatientTable pacientes={pacientes} onEditar={(p) => { setEditando(p); setModalAbierto(true); }} onEliminar={darDeBaja} esAdmin={esAdmin} />
          <PatientCardList pacientes={pacientes} onEditar={(p) => { setEditando(p); setModalAbierto(true); }} onEliminar={darDeBaja} esAdmin={esAdmin} />
        </>
      )}

      <PatientFormModal
        abierto={modalAbierto}
        onOpenChange={(v) => {
          setModalAbierto(v);
          if (!v) setEditando(null);
        }}
        paciente={editando}
        onGuardar={guardar}
        guardando={guardando}
      />
    </div>
  );
}