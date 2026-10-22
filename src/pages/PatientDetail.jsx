import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { Activity, AlertTriangle, ArrowLeft, CalendarDays, Download, FilePlus2, FileText, HeartPulse, Pencil, Plus, Printer, User, Wallet } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import PatientFormModal from "@/components/patients/PatientFormModal";
import AntecedentesCard from "@/components/patients/AntecedentesCard";
import HistoriaClinica from "@/components/records/HistoriaClinica";
import EvolucionCard from "@/components/patients/EvolucionCard";
import DocumentosCard from "@/components/documentos/DocumentosCard";
import EncabezadoImpresion from "@/components/EncabezadoImpresion";
import { useToast } from "@/components/ui/use-toast";
import useSesion from "@/hooks/useSesion";
import { edad, fechaCorta, valorODash } from "@/lib/format";
import { moneda } from "@/lib/earnings";
import { auditar, log } from "@/lib/log";
import { descargarJson, traerTodo } from "@/lib/exportar";

function Dato({ etiqueta, valor }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{etiqueta}</dt>
      <dd className="mt-1 text-sm text-foreground">{valorODash(valor)}</dd>
    </div>
  );
}

const lista = (res) => res?.items ?? res ?? [];

export default function PatientDetail() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  // ?nueva=1&turno=<id> llega desde un turno atendido: abre la atención ya vinculada a ese turno
  const turnoOrigen = params.get("turno") ? { id: params.get("turno") } : null;
  const { toast } = useToast();
  const { esMedico, esAdmin, nombre } = useSesion();
  const [paciente, setPaciente] = useState(null);
  const [antecedentes, setAntecedentes] = useState(null);
  const [turnos, setTurnos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [pestana, setPestana] = useState("resumen");
  const historia = useRef(null);

  const cargarAntecedentes = async () => {
    if (!esMedico) return;
    const res = lista(await base44.entities.Antecedentes.filter({ paciente: id }, { limit: 1 }));
    setAntecedentes(res[0] || null);
  };

  useEffect(() => {
    let vivo = true;
    (async () => {
      setCargando(true);
      try {
        const [p, ts, ps] = await Promise.all([
          base44.entities.Paciente.get(id),
          base44.entities.Turno.filter({ paciente: id }, { sort: "-fecha", limit: 100 }),
          base44.entities.Pago.filter({ paciente: id }, { sort: "-fecha", limit: 100 }),
        ]);
        if (!vivo) return;
        setPaciente(p);
        setTurnos(lista(ts));
        setPagos(lista(ps));
        await cargarAntecedentes();
        auditar("ver", "Paciente", { registro: id, paciente: id, usuario_nombre: nombre });
      } catch (error) {
        log.error("No se pudo cargar la ficha del paciente", error, { pantalla: "PatientDetail" });
      } finally {
        if (vivo) setCargando(false);
      }
    })();
    return () => {
      vivo = false;
    };
  }, [id, esMedico]);

  const guardar = async (datos) => {
    setGuardando(true);
    try {
      const iguales = lista(await base44.entities.Paciente.filter({ dni: datos.dni }, { limit: 5 })).filter((p) => p.id !== id);
      if (iguales.length) {
        toast({ variant: "destructive", title: "Ya existe un paciente con ese DNI", description: `Ficha ${iguales[0].numero_ficha || "sin número"}` });
        return;
      }
      await base44.entities.Paciente.update(id, datos);
      auditar("editar", "Paciente", { registro: id, paciente: id, usuario_nombre: nombre });
      setPaciente((p) => ({ ...p, ...datos }));
      setEditando(false);
      toast({ title: "Paciente actualizado" });
    } catch (error) {
      log.error("No se pudo guardar el paciente", error, { pantalla: "PatientDetail" });
      toast({ variant: "destructive", title: "No pudimos guardar el paciente", description: error?.message });
    } finally {
      setGuardando(false);
    }
  };

  useEffect(() => {
    if (cargando || !paciente || !esMedico || params.get("nueva") !== "1") return;
    setPestana("historia");
    setTimeout(() => historia.current?.nuevaAtencion(), 0);
    const { turno } = Object.fromEntries(params);
    setParams(turno ? { turno } : {}, { replace: true });
  }, [cargando, paciente, esMedico]);

  // Derecho de acceso (Ley 25.326): entrega al paciente todos sus datos en un archivo
  const exportarDatos = async () => {
    try {
      const filtro = { paciente: id };
      const [turnosTodos, pagosTodos, atenciones, notas, documentos] = await Promise.all([
        traerTodo("Turno", filtro),
        traerTodo("Pago", filtro),
        esMedico ? traerTodo("HistorialClinico", filtro) : [],
        esMedico ? traerTodo("HistorialAddenda", filtro) : [],
        esMedico ? traerTodo("DocumentoClinico", filtro) : [],
      ]);
      descargarJson(
        { generado: new Date().toISOString(), paciente, antecedentes: esMedico ? antecedentes : undefined, atenciones, notas, documentos, turnos: turnosTodos, cobros: pagosTodos },
        `datos-${paciente.numero_ficha || paciente.id}`
      );
      auditar("exportar", "Paciente", { registro: id, paciente: id, usuario_nombre: nombre });
    } catch (error) {
      log.error("No se pudieron exportar los datos del paciente", error, { pantalla: "PatientDetail" });
      toast({ variant: "destructive", title: "No pudimos exportar los datos" });
    }
  };

  if (cargando) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-brand-teal" />
      </div>
    );
  }

  if (!paciente) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <EmptyState icon={User} titulo="No encontramos este paciente" accion={<Link to="/patients" className="text-sm font-medium text-brand-teal-700 hover:underline">Volver a Pacientes</Link>} />
      </div>
    );
  }

  const anios = edad(paciente.fecha_nacimiento);

  return (
    <div>
      <EncabezadoImpresion />

      <Link to="/patients" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground print:hidden">
        <ArrowLeft className="h-4 w-4" />
        Pacientes
      </Link>

      {/* Encabezado fijo con lo que hay que ver siempre, alergias primero */}
      <header className="sticky top-16 z-20 mb-6 rounded-2xl border border-border bg-card p-5 shadow-soft print:static print:shadow-none lg:top-0">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">{paciente.nombre_completo}</h1>
              <StatusBadge estado={paciente.activo === false ? "inactivo" : "activo"} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {[
                paciente.numero_ficha,
                anios !== null && `${anios} años`,
                paciente.dni && `DNI ${paciente.dni}`,
                paciente.obra_social && `${paciente.obra_social}${paciente.plan ? ` ${paciente.plan}` : ""}${paciente.numero_afiliado ? ` · ${paciente.numero_afiliado}` : ""}`,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <Button variant="outline" onClick={exportarDatos} title="Derecho de acceso del paciente (Ley 25.326)">
              <Download className="mr-1.5 h-4 w-4" />
              Exportar datos
            </Button>
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-4 w-4" />
              Imprimir
            </Button>
            <Button variant="outline" asChild>
              <Link to={`/appointments?paciente=${paciente.id}`}>
                <CalendarDays className="mr-1.5 h-4 w-4" />
                Dar turno
              </Link>
            </Button>
            {esMedico && (
              <Button
                className="btn-gradient"
                onClick={() => {
                  setPestana("historia");
                  setTimeout(() => historia.current?.nuevaAtencion(), 0);
                }}
              >
                <Plus className="mr-1.5 h-4 w-4" />
                Nueva atención
              </Button>
            )}
          </div>
        </div>
        {esMedico && antecedentes?.alergias && (
          <p className="mt-3 flex items-start gap-2 rounded-xl bg-brand-danger/10 px-3 py-2 text-sm font-semibold text-brand-danger-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            Alergias: {antecedentes.alergias}
          </p>
        )}
      </header>

      <Tabs value={pestana} onValueChange={setPestana}>
        <TabsList className="mb-5 flex h-auto flex-wrap justify-start print:hidden">
          <TabsTrigger value="resumen">
            <User className="mr-1.5 h-4 w-4" />
            Datos
          </TabsTrigger>
          {esMedico && (
            <TabsTrigger value="antecedentes">
              <HeartPulse className="mr-1.5 h-4 w-4" />
              Antecedentes
            </TabsTrigger>
          )}
          {esMedico && (
            <TabsTrigger value="historia">
              <FileText className="mr-1.5 h-4 w-4" />
              Historia clínica
            </TabsTrigger>
          )}
          {esMedico && (
            <TabsTrigger value="evolucion">
              <Activity className="mr-1.5 h-4 w-4" />
              Evolución
            </TabsTrigger>
          )}
          {esMedico && (
            <TabsTrigger value="documentos">
              <FilePlus2 className="mr-1.5 h-4 w-4" />
              Documentos
            </TabsTrigger>
          )}
          <TabsTrigger value="turnos">
            <CalendarDays className="mr-1.5 h-4 w-4" />
            Turnos ({turnos.length})
          </TabsTrigger>
          <TabsTrigger value="cobros">
            <Wallet className="mr-1.5 h-4 w-4" />
            Cobros
          </TabsTrigger>
        </TabsList>

        <TabsContent value="resumen">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-base font-semibold text-foreground">Datos personales</h2>
              <Button variant="outline" size="sm" onClick={() => setEditando(true)} className="print:hidden">
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Editar
              </Button>
            </div>
            <dl className="mt-4 grid gap-4 sm:grid-cols-3">
              <Dato etiqueta="Fecha de nacimiento" valor={fechaCorta(paciente.fecha_nacimiento)} />
              <Dato etiqueta="Teléfono" valor={paciente.telefono} />
              <Dato etiqueta="Email" valor={paciente.email} />
              <Dato etiqueta="Obra social" valor={paciente.obra_social} />
              <Dato etiqueta="N° de afiliado" valor={paciente.numero_afiliado} />
              <Dato etiqueta="Dirección" valor={paciente.direccion} />
              <Dato etiqueta="Contacto de emergencia" valor={paciente.contacto_emergencia} />
              <Dato etiqueta="Teléfono de emergencia" valor={paciente.telefono_emergencia} />
            </dl>
          </section>
        </TabsContent>

        {esMedico && (
          <TabsContent value="antecedentes">
            <AntecedentesCard paciente={paciente} antecedentes={antecedentes} onGuardado={cargarAntecedentes} />
          </TabsContent>
        )}

        {esMedico && (
          <TabsContent value="historia" forceMount className="data-[state=inactive]:hidden">
            <HistoriaClinica ref={historia} paciente={paciente} turno={turnoOrigen} />
          </TabsContent>
        )}

        {esMedico && (
          <TabsContent value="evolucion">
            <EvolucionCard paciente={paciente} />
          </TabsContent>
        )}

        {esMedico && (
          <TabsContent value="documentos">
            <DocumentosCard paciente={paciente} />
          </TabsContent>
        )}

        <TabsContent value="turnos">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
            {turnos.length === 0 ? (
              <EmptyState icon={CalendarDays} titulo="Sin turnos registrados" />
            ) : (
              <ul className="divide-y divide-border">
                {turnos.map((t) => (
                  <li key={t.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                    <span className="tabular w-28 shrink-0 font-medium text-foreground">{fechaCorta(t.fecha)}</span>
                    <span className="tabular w-28 shrink-0 text-muted-foreground">
                      {t.hora_inicio} - {t.hora_fin}
                    </span>
                    <span className="min-w-0 flex-1 text-foreground">
                      {t.tipo_consulta}
                      {t.profesional_nombre && <span className="text-muted-foreground"> · {t.profesional_nombre}</span>}
                    </span>
                    <StatusBadge estado={t.estado} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </TabsContent>

        <TabsContent value="cobros">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
            {pagos.length === 0 ? (
              <EmptyState icon={Wallet} titulo="Sin cobros registrados" descripcion={esAdmin ? undefined : "Sólo ves los cobros que registraste vos."} />
            ) : (
              <ul className="divide-y divide-border">
                {pagos.map((p) => (
                  <li key={p.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                    <span className="tabular w-28 shrink-0 font-medium text-foreground">{fechaCorta(p.fecha)}</span>
                    <span className="min-w-0 flex-1 text-foreground">{p.concepto || "—"}</span>
                    <span className="tabular w-28 text-right text-foreground">{moneda(p.importe)}</span>
                    <StatusBadge estado={p.estado} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </TabsContent>
      </Tabs>

      <PatientFormModal abierto={editando} onOpenChange={setEditando} paciente={paciente} onGuardar={guardar} guardando={guardando} />
    </div>
  );
}
