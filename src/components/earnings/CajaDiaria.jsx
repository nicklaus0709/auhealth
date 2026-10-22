import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Loader2, Lock, Plus, Unlock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useConfirm } from "@/components/ConfirmProvider";
import useSesion from "@/hooks/useSesion";
import { METODOS, moneda, num, resumir } from "@/lib/earnings";
import { fechaLarga, hoyISO } from "@/lib/format";
import { auditar, log } from "@/lib/log";

const lista = (res) => res?.items ?? res ?? [];

/**
 * Caja del día de recepción: apertura con monto inicial, cobros del día por medio de pago,
 * gastos y cierre con arqueo del efectivo (esperado vs contado).
 */
export default function CajaDiaria() {
  const { toast } = useToast();
  const confirmar = useConfirm();
  const { nombre } = useSesion();
  const [caja, setCaja] = useState(null);
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [montoInicial, setMontoInicial] = useState("");
  const [gasto, setGasto] = useState({ concepto: "", monto: "" });
  const [contado, setContado] = useState("");
  const [guardando, setGuardando] = useState(false);
  const hoy = hoyISO();

  const cargar = async () => {
    setCargando(true);
    try {
      const [cajas, ps] = await Promise.all([
        base44.entities.Caja.filter({ fecha: hoy }, { sort: "-created_date", limit: 1 }),
        base44.entities.Pago.filter({ fecha: hoy }, { limit: 1000 }),
      ]);
      setCaja(lista(cajas)[0] || null);
      setPagos(lista(ps));
    } catch (error) {
      log.error("No se pudo cargar la caja", error, { componente: "CajaDiaria" });
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const resumen = resumir(pagos);
  const gastos = caja?.gastos || [];
  const totalGastos = gastos.reduce((acc, g) => acc + num(g.monto), 0);
  const efectivoEsperado = num(caja?.monto_inicial) + resumen.monto_efectivo - totalGastos;

  const guardar = async (cambios, mensaje) => {
    setGuardando(true);
    try {
      const actualizada = caja?.id ? await base44.entities.Caja.update(caja.id, cambios) : await base44.entities.Caja.create({ fecha: hoy, ...cambios });
      setCaja((c) => ({ ...c, ...actualizada, ...cambios }));
      if (mensaje) toast({ title: mensaje });
      return true;
    } catch (error) {
      log.error("No se pudo guardar la caja", error, { componente: "CajaDiaria" });
      toast({ variant: "destructive", title: "No pudimos guardar la caja", description: error?.message });
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const abrir = (e) => {
    e.preventDefault();
    guardar({ estado: "abierta", monto_inicial: num(montoInicial), gastos: [], abierta_por: nombre }, "Caja abierta");
  };

  const agregarGasto = async (e) => {
    e.preventDefault();
    if (!gasto.concepto.trim() || num(gasto.monto) <= 0) return;
    const ok = await guardar({ gastos: [...gastos, { concepto: gasto.concepto.trim(), monto: num(gasto.monto), hora: format(new Date(), "HH:mm") }] }, "Gasto registrado");
    if (ok) setGasto({ concepto: "", monto: "" });
  };

  const cerrar = async (e) => {
    e.preventDefault();
    const contadoNum = num(contado);
    const diferencia = Math.round((contadoNum - efectivoEsperado) * 100) / 100;
    const ok = await confirmar({
      titulo: "¿Cerrar la caja del día?",
      descripcion: `Efectivo esperado ${moneda(efectivoEsperado)}, contado ${moneda(contadoNum)}. Diferencia: ${moneda(diferencia)}.`,
      confirmar: "Cerrar caja",
    });
    if (!ok) return;
    const cerrada = await guardar(
      {
        estado: "cerrada",
        efectivo_esperado: efectivoEsperado,
        efectivo_contado: contadoNum,
        diferencia,
        totales: Object.fromEntries(METODOS.map(({ campo }) => [campo, resumen[campo]])),
        cerrada_por: nombre,
      },
      "Caja cerrada"
    );
    if (cerrada) auditar("cerrar", "Caja", { registro: caja?.id || "", usuario_nombre: nombre, detalle: `diferencia ${diferencia}` });
  };

  if (cargando) {
    return (
      <div className="flex justify-center py-14">
        <Loader2 className="h-6 w-6 animate-spin text-brand-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Caja del {fechaLarga(hoy)}. Incluye los cobros de hoy que podés ver (el admin ve los de todos).</p>

      {!caja ? (
        <form onSubmit={abrir} className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-card p-5 shadow-soft">
          <div className="space-y-1.5">
            <Label htmlFor="caja-inicial">Efectivo inicial en caja $</Label>
            <Input id="caja-inicial" type="number" min="0" step="0.01" value={montoInicial} onChange={(e) => setMontoInicial(e.target.value)} className="h-11 w-48" />
          </div>
          <Button type="submit" className="btn-gradient h-11" disabled={guardando}>
            <Unlock className="mr-1.5 h-4 w-4" />
            Abrir caja
          </Button>
        </form>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
              <p className="text-xs text-muted-foreground">Inicial</p>
              <p className="tabular mt-1 font-heading text-lg font-bold">{moneda(caja.monto_inicial)}</p>
            </div>
            {METODOS.map(({ campo, label }) => (
              <div key={campo} className="rounded-2xl border border-border bg-card p-4 shadow-soft">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="tabular mt-1 font-heading text-lg font-bold">{moneda(resumen[campo])}</p>
              </div>
            ))}
          </div>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h3 className="font-heading text-sm font-semibold text-foreground">Gastos del día ({moneda(totalGastos)})</h3>
            {gastos.length > 0 && (
              <ul className="mt-3 divide-y divide-border text-sm">
                {gastos.map((g, i) => (
                  <li key={i} className="flex justify-between py-2">
                    <span className="text-foreground">
                      <span className="tabular text-muted-foreground">{g.hora}</span> · {g.concepto}
                    </span>
                    <span className="tabular">{moneda(g.monto)}</span>
                  </li>
                ))}
              </ul>
            )}
            {caja.estado === "abierta" && (
              <form onSubmit={agregarGasto} className="mt-3 flex flex-wrap gap-2">
                <Input aria-label="Concepto del gasto" value={gasto.concepto} onChange={(e) => setGasto((g) => ({ ...g, concepto: e.target.value }))} placeholder="Concepto (ej: librería)" className="h-10 flex-1" />
                <Input aria-label="Monto del gasto" type="number" min="0" step="0.01" value={gasto.monto} onChange={(e) => setGasto((g) => ({ ...g, monto: e.target.value }))} placeholder="$" className="h-10 w-32" />
                <Button type="submit" variant="outline" className="h-10" disabled={guardando}>
                  <Plus className="mr-1 h-4 w-4" />
                  Agregar
                </Button>
              </form>
            )}
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h3 className="font-heading text-sm font-semibold text-foreground">Arqueo de efectivo</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Esperado en caja: <span className="tabular font-semibold text-foreground">{moneda(efectivoEsperado)}</span> (inicial + efectivo cobrado − gastos)
            </p>
            {caja.estado === "abierta" ? (
              <form onSubmit={cerrar} className="mt-3 flex flex-wrap items-end gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="caja-contado">Efectivo contado $</Label>
                  <Input id="caja-contado" type="number" min="0" step="0.01" required value={contado} onChange={(e) => setContado(e.target.value)} className="h-11 w-48" />
                </div>
                <Button type="submit" className="btn-gradient h-11" disabled={guardando}>
                  <Lock className="mr-1.5 h-4 w-4" />
                  Cerrar caja
                </Button>
              </form>
            ) : (
              <p className="mt-3 text-sm">
                Cerrada por {caja.cerrada_por || "—"}. Contado {moneda(caja.efectivo_contado)} · diferencia{" "}
                <span className={num(caja.diferencia) === 0 ? "font-semibold text-brand-emerald-700" : "font-semibold text-brand-danger-700"}>{moneda(caja.diferencia)}</span>
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
