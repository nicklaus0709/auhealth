import { useEffect, useState } from "react";
import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, FileSpreadsheet, Loader2, Send } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EmptyState from "@/components/EmptyState";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/components/ConfirmProvider";
import useSesion from "@/hooks/useSesion";
import { useObrasSociales, usePrestaciones } from "@/hooks/useDatos";
import { moneda, num } from "@/lib/earnings";
import { exportarExcel } from "@/lib/exportar";
import { fechaCorta, hoyISO } from "@/lib/format";
import { auditar, log } from "@/lib/log";

const lista = (res) => res?.items ?? res ?? [];
const ESTADOS = { presentada: "Presentada", cobrada: "Cobrada", observada: "Observada" };

/** Liquidación mensual por obra social: prestaciones del período a presentar, exportables, y su seguimiento. */
export default function Liquidaciones() {
  const { toast } = useToast();
  const confirmar = useConfirm();
  const { nombre } = useSesion();
  const { data: obras = [] } = useObrasSociales({ incluirInactivas: true });
  const { data: prestaciones = [] } = usePrestaciones({ incluirInactivas: true });
  const [mes, setMes] = useState(startOfMonth(addMonths(new Date(), -1)));
  const [obraId, setObraId] = useState("");
  const [pagos, setPagos] = useState([]);
  const [liquidaciones, setLiquidaciones] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const periodo = format(mes, "yyyy-MM");
  const obra = obras.find((o) => o.id === obraId);

  useEffect(() => {
    if (!obraId && obras.length) setObraId(obras[0].id);
  }, [obras]);

  const cargar = async () => {
    if (!obraId) return;
    setCargando(true);
    try {
      const [ps, ls] = await Promise.all([
        base44.entities.Pago.filter(
          { obra_social_id: obraId, fecha: { $gte: format(mes, "yyyy-MM-dd"), $lte: format(endOfMonth(mes), "yyyy-MM-dd") } },
          { sort: "fecha", limit: 5000 }
        ),
        base44.entities.Liquidacion.filter({ obra_social: obraId }, { sort: "-periodo", limit: 24 }),
      ]);
      setPagos(lista(ps).filter((p) => num(p.monto_obra_social) > 0));
      setLiquidaciones(lista(ls));
    } catch (error) {
      log.error("No se pudo cargar la liquidación", error, { componente: "Liquidaciones" });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, [obraId, periodo]);

  const pendientes = pagos.filter((p) => !p.liquidacion);
  const total = pendientes.reduce((acc, p) => acc + num(p.monto_obra_social), 0);
  const nombrePrestacion = (id) => prestaciones.find((p) => p.id === id)?.nombre || "";

  const filas = (items) =>
    items.map((p) => ({
      fecha: fechaCorta(p.fecha),
      paciente: p.paciente_nombre,
      ficha: p.paciente_ficha,
      prestacion: nombrePrestacion(p.prestacion) || p.concepto,
      autorizacion: p.numero_autorizacion || "",
      profesional: p.profesional_nombre || "",
      importe_obra_social: num(p.monto_obra_social),
      coseguro: num(p.coseguro),
    }));

  const exportar = () =>
    exportarExcel({ [`${obra?.sigla || obra?.nombre || "OS"} ${periodo}`]: filas(pendientes) }, `liquidacion-${(obra?.sigla || obra?.nombre || "os").replace(/\s+/g, "-")}-${periodo}`);

  const presentar = async () => {
    const ok = await confirmar({
      titulo: `¿Marcar como presentada la liquidación de ${obra?.nombre}?`,
      descripcion: `${pendientes.length} prestaciones por ${moneda(total)} de ${format(mes, "MMMM yyyy", { locale: es })}.`,
      confirmar: "Marcar presentada",
    });
    if (!ok) return;
    setGuardando(true);
    try {
      const liq = await base44.entities.Liquidacion.create({
        obra_social: obraId,
        obra_social_nombre: obra?.nombre || "",
        periodo,
        pagos: pendientes.map((p) => p.id),
        cantidad: pendientes.length,
        total,
        estado: "presentada",
        fecha_presentacion: hoyISO(),
      });
      await Promise.all(pendientes.map((p) => base44.entities.Pago.update(p.id, { liquidacion: liq.id })));
      auditar("presentar", "Liquidacion", { registro: liq.id, usuario_nombre: nombre, detalle: `${obra?.nombre} ${periodo}` });
      toast({ title: "Liquidación registrada" });
      await cargar();
    } catch (error) {
      log.error("No se pudo registrar la liquidación", error, { componente: "Liquidaciones" });
      toast({ variant: "destructive", title: "No pudimos registrar la liquidación", description: error?.message });
    } finally {
      setGuardando(false);
    }
  };

  const cambiarEstado = async (liq, estado) => {
    try {
      await base44.entities.Liquidacion.update(liq.id, { estado, ...(estado === "cobrada" ? { fecha_cobro: hoyISO() } : {}) });
      await cargar();
    } catch (error) {
      log.error("No se pudo actualizar la liquidación", error, { componente: "Liquidaciones" });
    }
  };

  if (obras.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <EmptyState titulo="Cargá el padrón de obras sociales" descripcion="En Configuración → Obras sociales." />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Select value={obraId} onValueChange={setObraId}>
          <SelectTrigger className="h-10 w-[240px] bg-card" aria-label="Obra social">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {obras.map((o) => (
              <SelectItem key={o.id} value={o.id}>
                {o.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Mes anterior" onClick={() => setMes(addMonths(mes, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[140px] text-center text-sm font-semibold capitalize">{format(mes, "MMMM yyyy", { locale: es })}</span>
          <Button variant="outline" size="icon" aria-label="Mes siguiente" onClick={() => setMes(addMonths(mes, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-heading text-sm font-semibold text-foreground">
            A presentar: {pendientes.length} prestaciones · <span className="tabular">{moneda(total)}</span>
          </h3>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportar} disabled={!pendientes.length}>
              <FileSpreadsheet className="mr-1.5 h-4 w-4" />
              Exportar Excel
            </Button>
            <Button className="btn-gradient" onClick={presentar} disabled={!pendientes.length || guardando}>
              {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />}
              Marcar presentada
            </Button>
          </div>
        </div>
        {cargando ? (
          <Loader2 className="mx-auto my-8 h-5 w-5 animate-spin text-brand-teal" />
        ) : pendientes.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No hay prestaciones pendientes de liquidar en este período</p>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="py-2 pr-3">Fecha</th>
                  <th className="py-2 pr-3">Paciente</th>
                  <th className="py-2 pr-3">Prestación</th>
                  <th className="py-2 pr-3">Autorización</th>
                  <th className="py-2 text-right">Importe O.S.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filas(pendientes).map((f, i) => (
                  <tr key={pendientes[i].id}>
                    <td className="py-2 pr-3">{f.fecha}</td>
                    <td className="py-2 pr-3">{f.paciente}</td>
                    <td className="py-2 pr-3">{f.prestacion || "—"}</td>
                    <td className="py-2 pr-3">{f.autorizacion || "—"}</td>
                    <td className="tabular py-2 text-right">{moneda(f.importe_obra_social)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {liquidaciones.length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
          <h3 className="font-heading text-sm font-semibold text-foreground">Liquidaciones de {obra?.nombre}</h3>
          <ul className="mt-3 divide-y divide-border text-sm">
            {liquidaciones.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-3 py-2.5">
                <span className="w-20 font-medium">{l.periodo}</span>
                <span className="tabular flex-1">
                  {l.cantidad} prest. · {moneda(l.total)}
                </span>
                <Select value={l.estado} onValueChange={(v) => cambiarEstado(l, v)}>
                  <SelectTrigger className="h-9 w-[150px] text-xs" aria-label="Estado de la liquidación">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ESTADOS).map(([v, label]) => (
                      <SelectItem key={v} value={v} className="text-xs">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
