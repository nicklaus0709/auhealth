import { useEffect, useMemo, useState } from "react";
import { addMonths, endOfMonth, format, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { BarChart3, ChevronLeft, ChevronRight, FileSpreadsheet, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import BarrasHorizontales from "@/components/dashboard/BarrasHorizontales";
import useSesion from "@/hooks/useSesion";
import { METODOS, moneda, num, resumir } from "@/lib/earnings";
import { exportarExcel, traerTodo } from "@/lib/exportar";
import { log } from "@/lib/log";

const contar = (items, clave) =>
  Object.entries(
    items.reduce((acc, item) => {
      const k = clave(item);
      if (k) acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {})
  ).map(([etiqueta, valor]) => ({ etiqueta, valor }));

const sumar = (items, clave, valor) =>
  Object.entries(
    items.reduce((acc, item) => {
      const k = clave(item);
      if (k) acc[k] = (acc[k] || 0) + valor(item);
      return acc;
    }, {})
  ).map(([etiqueta, v]) => ({ etiqueta, valor: v }));

const enteros = (n) => String(Math.round(n));
const porcentaje = (parte, total) => (total ? `${Math.round((parte / total) * 100)}%` : "—");

function Tabla({ titulo, columnas, filas }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h2 className="font-heading text-sm font-semibold text-foreground">{titulo}</h2>
      {filas.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Sin datos en el período</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-muted-foreground">
              <tr>
                {columnas.map((c, i) => (
                  <th key={c} className={`py-2 pr-3 ${i > 0 ? "text-right" : ""}`}>
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filas.map((f) => (
                <tr key={f[0]}>
                  {f.map((v, i) => (
                    <td key={i} className={`py-2 pr-3 ${i > 0 ? "tabular text-right" : "text-foreground"}`}>
                      {v}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** Reportes del mes para el admin: producción, ausentismo, ingresos, liquidaciones pendientes y diagnósticos. */
export default function Reports() {
  const { esAdmin } = useSesion();
  const [mes, setMes] = useState(startOfMonth(new Date()));
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    if (!esAdmin) return;
    let vivo = true;
    setDatos(null);
    const desde = format(mes, "yyyy-MM-dd");
    const hasta = format(endOfMonth(mes), "yyyy-MM-dd");
    (async () => {
      try {
        const [turnos, pagos, atenciones, pacientes] = await Promise.all([
          traerTodo("Turno", { fecha: { $gte: desde, $lte: hasta } }),
          traerTodo("Pago", { fecha: { $gte: desde, $lte: hasta } }),
          traerTodo("HistorialClinico", { fecha_atencion: { $gte: `${desde}T00:00:00`, $lte: `${hasta}T23:59:59` } }),
          traerTodo("Paciente"),
        ]);
        if (vivo) setDatos({ turnos, pagos, atenciones, pacientes });
      } catch (error) {
        log.error("No se pudieron cargar los reportes", error, { pantalla: "Reports" });
        if (vivo) setDatos({ turnos: [], pagos: [], atenciones: [], pacientes: [] });
      }
    })();
    return () => {
      vivo = false;
    };
  }, [mes, esAdmin]);

  const r = useMemo(() => {
    if (!datos) return null;
    const { turnos, pagos, atenciones, pacientes } = datos;
    const obraDe = Object.fromEntries(pacientes.map((p) => [p.id, p.obra_social || "Particular"]));
    const desde = format(mes, "yyyy-MM-dd");
    const pasados = turnos.filter((t) => t.estado !== "cancelado" && t.fecha <= format(new Date(), "yyyy-MM-dd"));
    const profesionalesTurnos = [...new Set(pasados.map((t) => t.profesional_nombre || "Sin profesional"))];

    const produccion = [...new Set([...profesionalesTurnos, ...atenciones.map((a) => a.medico_nombre || "—"), ...pagos.map((p) => p.profesional_nombre || "—")])]
      .map((prof) => {
        const suyos = pasados.filter((t) => (t.profesional_nombre || "Sin profesional") === prof);
        const ausentes = suyos.filter((t) => t.estado === "ausente").length;
        return [
          prof,
          String(suyos.filter((t) => t.estado === "atendido").length),
          String(atenciones.filter((a) => (a.medico_nombre || "—") === prof).length),
          porcentaje(ausentes, suyos.length),
          moneda(pagos.filter((p) => (p.profesional_nombre || "—") === prof).reduce((acc, p) => acc + num(p.cobrado), 0)),
        ];
      })
      .filter((f) => f.slice(1, 3).some((v) => v !== "0") || f[4] !== moneda(0));

    const ausentismoOs = Object.entries(
      pasados.reduce((acc, t) => {
        const os = obraDe[t.paciente] || "Particular";
        acc[os] = acc[os] || { total: 0, ausentes: 0 };
        acc[os].total += 1;
        if (t.estado === "ausente") acc[os].ausentes += 1;
        return acc;
      }, {})
    ).map(([os, v]) => [os, String(v.total), String(v.ausentes), porcentaje(v.ausentes, v.total)]);

    const atendidos = new Set([...atenciones.map((a) => a.paciente), ...turnos.filter((t) => t.estado === "atendido").map((t) => t.paciente)]);
    const nuevos = pacientes.filter((p) => atendidos.has(p.id) && String(p.created_date || "") >= desde).length;

    return {
      resumen: resumir(pagos),
      produccion,
      ausentismoOs,
      porObraSocial: sumar(pagos, (p) => p.obra_social?.trim() || "Particular", (p) => num(p.cobrado)),
      pendienteLiquidar: sumar(
        pagos.filter((p) => num(p.monto_obra_social) > 0 && !p.liquidacion),
        (p) => p.obra_social || "Sin obra social",
        (p) => num(p.monto_obra_social)
      ),
      diagnosticos: contar(atenciones, (a) => (a.diagnostico_cie10 ? `${a.diagnostico_cie10} ${a.diagnostico || ""}`.trim() : null)),
      nuevos,
      recurrentes: atendidos.size - nuevos,
    };
  }, [datos, mes]);

  const exportar = () =>
    exportarExcel(
      {
        Produccion: r.produccion.map(([profesional, atendidos, atenciones, ausentismo, cobrado]) => ({ profesional, atendidos, atenciones, ausentismo, cobrado })),
        "Ausentismo por OS": r.ausentismoOs.map(([obra_social, turnos, ausentes, ausentismo]) => ({ obra_social, turnos, ausentes, ausentismo })),
        "Cobrado por OS": r.porObraSocial,
        "Pendiente de liquidar": r.pendienteLiquidar,
        Diagnosticos: r.diagnosticos,
      },
      `reportes-${format(mes, "yyyy-MM")}`
    );

  if (!esAdmin) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <EmptyState icon={ShieldAlert} titulo="No tenés permisos para ver los reportes" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        icon={BarChart3}
        titulo="Reportes"
        subtitulo="Producción, ausentismo e ingresos del consultorio"
        accion={
          <Button variant="outline" onClick={exportar} disabled={!r}>
            <FileSpreadsheet className="mr-1.5 h-4 w-4" />
            Excel
          </Button>
        }
      />

      <div className="mb-5 flex items-center gap-2">
        <Button variant="outline" size="icon" aria-label="Mes anterior" onClick={() => setMes(addMonths(mes, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-[150px] text-center font-heading text-base font-semibold capitalize">{format(mes, "MMMM yyyy", { locale: es })}</span>
        <Button variant="outline" size="icon" aria-label="Mes siguiente" onClick={() => setMes(addMonths(mes, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {!r ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-brand-teal" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              ["Cobrado", moneda(r.resumen.cobrado)],
              ["Pendiente de cobro", moneda(r.resumen.pendiente)],
              ["Pacientes nuevos atendidos", String(r.nuevos)],
              ["Pacientes recurrentes", String(r.recurrentes)],
            ].map(([etiqueta, valor]) => (
              <div key={etiqueta} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <p className="text-sm text-muted-foreground">{etiqueta}</p>
                <p className="tabular mt-2 font-heading text-2xl font-bold text-foreground">{valor}</p>
              </div>
            ))}
          </div>

          <Tabla titulo="Producción por profesional" columnas={["Profesional", "Turnos atendidos", "Atenciones", "Ausentismo", "Cobrado"]} filas={r.produccion} />

          <div className="grid gap-6 lg:grid-cols-2">
            <BarrasHorizontales titulo="Cobrado por medio de pago" datos={METODOS.map(({ campo, label }) => ({ etiqueta: label, valor: r.resumen[campo] }))} />
            <BarrasHorizontales titulo="Cobrado por obra social" datos={r.porObraSocial} />
            <BarrasHorizontales titulo="Pendiente de liquidar a obras sociales" datos={r.pendienteLiquidar} vacio="Nada pendiente de liquidar" />
            <BarrasHorizontales titulo="Diagnósticos más frecuentes (CIE-10)" datos={r.diagnosticos} maximo={10} formato={enteros} vacio="Sin diagnósticos codificados" />
          </div>

          <Tabla titulo="Ausentismo por obra social" columnas={["Obra social", "Turnos", "Ausentes", "Ausentismo"]} filas={r.ausentismoOs} />
        </div>
      )}
    </div>
  );
}
