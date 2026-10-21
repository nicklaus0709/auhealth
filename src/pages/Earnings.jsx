import { useEffect, useMemo, useState } from "react";
import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { base44 } from "@/api/base44Client";
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Pencil,
  Plus,
  Trash2,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import PaymentFormModal from "@/components/earnings/PaymentFormModal";
import { useToast } from "@/components/ui/use-toast";
import useSesion from "@/hooks/useSesion";
import { fechaCorta } from "@/lib/format";
import { ARCA_URL, METODOS, exportarPdf, exportarXlsx, moneda, resumir } from "@/lib/earnings";

function Resumen({ etiqueta, valor, destacado = false }) {
  return (
    <div className={`rounded-2xl border border-border p-5 shadow-soft ${destacado ? "bg-brand-teal/10" : "bg-card"}`}>
      <p className="text-sm text-muted-foreground">{etiqueta}</p>
      <p className="tabular mt-2 font-heading text-2xl font-bold text-foreground">{moneda(valor)}</p>
    </div>
  );
}

export default function Earnings() {
  const { toast } = useToast();
  const { user, nombre } = useSesion();
  const [mes, setMes] = useState(startOfMonth(new Date()));
  const [pagos, setPagos] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    (async () => {
      const res = await base44.entities.Paciente.filter({ activo: true }, { sort: "nombre_completo", limit: 300 });
      setPacientes(res.items ?? res);
    })();
  }, []);

  const cargar = async () => {
    setCargando(true);
    try {
      const res = await base44.entities.Pago.filter(
        { fecha: { $gte: format(mes, "yyyy-MM-dd"), $lte: format(endOfMonth(mes), "yyyy-MM-dd") } },
        { sort: "-fecha", limit: 500 }
      );
      setPagos(res.items ?? res);
    } catch (error) {
      toast({ variant: "destructive", title: "No pudimos cargar los cobros" });
    } finally {
      setCargando(false);
    }
  };

  const claveMes = format(mes, "yyyy-MM");
  useEffect(() => {
    cargar();
  }, [claveMes]);

  const resumen = useMemo(() => resumir(pagos), [pagos]);
  const periodo = format(mes, "MMMM yyyy", { locale: es });
  const archivo = `ganancias-${claveMes}`;

  const guardar = async (datos) => {
    setGuardando(true);
    try {
      if (editando) {
        await base44.entities.Pago.update(editando.id, datos);
        toast({ title: "Cobro actualizado" });
      } else {
        await base44.entities.Pago.create({ ...datos, profesional: user?.id, profesional_nombre: nombre });
        toast({ title: "Cobro registrado" });
      }
      setModalAbierto(false);
      await cargar();
    } catch (error) {
      toast({ variant: "destructive", title: "No pudimos guardar el cobro", description: error?.message });
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (pago) => {
    if (!window.confirm(`¿Eliminar el cobro de ${pago.paciente_nombre}?`)) return;
    try {
      await base44.entities.Pago.delete(pago.id);
      toast({ title: "Cobro eliminado" });
      await cargar();
    } catch (error) {
      toast({ variant: "destructive", title: "No pudimos eliminar el cobro" });
    }
  };

  const exportar = async (tipo) => {
    if (pagos.length === 0) {
      toast({ title: "No hay cobros para exportar en este período" });
      return;
    }
    try {
      if (tipo === "xlsx") await exportarXlsx(pagos, false, archivo);
      else await exportarPdf(pagos, false, periodo, archivo);
    } catch (error) {
      toast({ variant: "destructive", title: "No pudimos generar el reporte" });
    }
  };

  return (
    <div>
      <PageHeader
        icon={Wallet}
        titulo="Ganancias"
        subtitulo="Tus cobros por paciente"
        accion={
          <>
            <Button variant="outline" asChild>
              <a href={ARCA_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-4 w-4" />
                Facturar en ARCA
              </a>
            </Button>
            <Button
              className="btn-gradient"
              onClick={() => {
                setEditando(null);
                setModalAbierto(true);
              }}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Registrar cobro
            </Button>
          </>
        }
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Mes anterior" onClick={() => setMes(addMonths(mes, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[150px] text-center font-heading text-base font-semibold capitalize">{periodo}</span>
          <Button variant="outline" size="icon" aria-label="Mes siguiente" onClick={() => setMes(addMonths(mes, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => exportar("xlsx")}>
            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            Excel
          </Button>
          <Button variant="outline" onClick={() => exportar("pdf")}>
            <FileText className="mr-1.5 h-4 w-4" />
            PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Resumen etiqueta="Total cobrado" valor={resumen.cobrado} destacado />
        <Resumen etiqueta="Total prestaciones" valor={resumen.importe} />
        <Resumen etiqueta="Pendiente de cobro" valor={resumen.pendiente} />
        <Resumen etiqueta="Cobrado sin facturar" valor={resumen.sinFacturar} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {METODOS.map(({ campo, label }) => (
          <Resumen key={campo} etiqueta={label} valor={resumen[campo]} />
        ))}
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
        <h2 className="font-heading text-base font-semibold text-foreground">
          Cobros de {periodo} ({resumen.cantidad})
        </h2>
        <div className="mt-4">
          {cargando ? (
            <div className="flex justify-center py-14">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-brand-teal" />
            </div>
          ) : pagos.length === 0 ? (
            <EmptyState icon={Banknote} titulo="No hay cobros registrados en este período" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="py-2 pr-3">Fecha</th>
                    <th className="py-2 pr-3">Paciente</th>
                    <th className="py-2 pr-3 text-right">Importe</th>
                    <th className="py-2 pr-3 text-right">Cobrado</th>
                    <th className="py-2 pr-3">Medios</th>
                    <th className="py-2 pr-3">Estado</th>
                    <th className="py-2 pr-3">Factura</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pagos.map((pago) => (
                    <tr key={pago.id}>
                      <td className="whitespace-nowrap py-3 pr-3">{fechaCorta(pago.fecha)}</td>
                      <td className="py-3 pr-3">
                        <p className="font-medium text-foreground">{pago.paciente_nombre}</p>
                        <p className="text-xs text-muted-foreground">{pago.concepto || pago.obra_social || "—"}</p>
                      </td>
                      <td className="tabular py-3 pr-3 text-right">{moneda(pago.importe)}</td>
                      <td className="tabular py-3 pr-3 text-right font-medium">{moneda(pago.cobrado)}</td>
                      <td className="py-3 pr-3 text-xs text-muted-foreground">
                        {METODOS.filter((m) => pago[m.campo] > 0)
                          .map((m) => `${m.label} ${moneda(pago[m.campo])}`)
                          .join(" · ") || "—"}
                      </td>
                      <td className="py-3 pr-3">
                        <StatusBadge estado={pago.estado} />
                      </td>
                      <td className="whitespace-nowrap py-3 pr-3">{pago.facturado ? pago.comprobante || "Sí" : "No"}</td>
                      <td className="whitespace-nowrap py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Editar"
                          onClick={() => {
                            setEditando(pago);
                            setModalAbierto(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Eliminar" onClick={() => eliminar(pago)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      <PaymentFormModal
        abierto={modalAbierto}
        onOpenChange={setModalAbierto}
        pacientes={pacientes}
        pago={editando}
        onGuardar={guardar}
        guardando={guardando}
      />
    </div>
  );
}
