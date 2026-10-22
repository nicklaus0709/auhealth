import { useEffect, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity } from "lucide-react";
import { base44 } from "@/api/base44Client";
import EmptyState from "@/components/EmptyState";
import { fechaCorta } from "@/lib/format";
import { log } from "@/lib/log";

// Paleta validada (teal de marca + óxido): pasa separación para daltonismo y contraste sobre blanco
const COLOR_1 = "#259D91";
const COLOR_2 = "#C2410C";
const EJE = { fontSize: 11, fill: "hsl(var(--muted-foreground))" };

function Grafico({ titulo, datos, series, unidad }) {
  const conDatos = datos.filter((d) => series.some((s) => d[s.campo]));
  if (conDatos.length < 2) {
    return (
      <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <h3 className="font-heading text-sm font-semibold text-foreground">{titulo}</h3>
        <p className="py-8 text-center text-sm text-muted-foreground">Hacen falta al menos 2 registros para ver la evolución</p>
      </section>
    );
  }
  const ultimo = conDatos[conDatos.length - 1];
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-heading text-sm font-semibold text-foreground">{titulo}</h3>
        {/* Leyenda + último valor como etiqueta directa: la identidad no depende sólo del color */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          {series.map((s, i) => (
            <span key={s.campo} className="inline-flex items-center gap-1.5">
              <span className="h-0.5 w-4 rounded" style={{ backgroundColor: i === 0 ? COLOR_1 : COLOR_2 }} />
              {s.label}: <span className="tabular font-semibold text-foreground">{ultimo[s.campo] ?? "—"}</span> {unidad}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-3 h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={conDatos} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="etiqueta" tick={EJE} tickLine={false} axisLine={false} />
            <YAxis tick={EJE} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
            <Tooltip
              contentStyle={{ borderRadius: 12, border: "1px solid hsl(var(--border))", fontSize: 12 }}
              formatter={(valor, nombre) => [`${valor} ${unidad}`, nombre]}
            />
            {series.map((s, i) => (
              <Line
                key={s.campo}
                type="monotone"
                dataKey={s.campo}
                name={s.label}
                stroke={i === 0 ? COLOR_1 : COLOR_2}
                strokeWidth={2}
                dot={{ r: 4, strokeWidth: 2, fill: "#fff" }}
                activeDot={{ r: 5 }}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer">Ver como tabla</summary>
        <table className="mt-2 w-full text-left">
          <thead>
            <tr>
              <th className="py-1">Fecha</th>
              {series.map((s) => (
                <th key={s.campo} className="py-1">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {conDatos.map((d) => (
              <tr key={d.id}>
                <td className="tabular py-1">{d.etiqueta}</td>
                {series.map((s) => (
                  <td key={s.campo} className="tabular py-1 text-foreground">
                    {d[s.campo] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </section>
  );
}

/** Evolución de signos vitales del paciente a partir de sus atenciones. */
export default function EvolucionCard({ paciente }) {
  const [datos, setDatos] = useState(null);

  useEffect(() => {
    base44.entities.HistorialClinico.filter({ paciente: paciente.id }, { sort: "fecha_atencion", limit: 200 })
      .then((res) =>
        setDatos(
          (res.items ?? res)
            .filter((h) => h.signos_vitales && Object.keys(h.signos_vitales).length)
            .map((h) => ({ id: h.id, etiqueta: fechaCorta(h.fecha_atencion), ...h.signos_vitales }))
        )
      )
      .catch((error) => {
        log.error("No se pudo cargar la evolución", error, { componente: "EvolucionCard" });
        setDatos([]);
      });
  }, [paciente.id]);

  if (!datos) {
    return (
      <div className="flex justify-center py-14">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-muted border-t-brand-teal" />
      </div>
    );
  }

  if (datos.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card shadow-soft">
        <EmptyState icon={Activity} titulo="Todavía no hay signos vitales registrados" descripcion="Se cargan al registrar cada atención." />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Grafico titulo="Tensión arterial" unidad="mmHg" datos={datos} series={[{ campo: "tension_sistolica", label: "Sistólica" }, { campo: "tension_diastolica", label: "Diastólica" }]} />
      <Grafico titulo="Peso" unidad="kg" datos={datos} series={[{ campo: "peso", label: "Peso" }]} />
      <Grafico titulo="IMC" unidad="" datos={datos} series={[{ campo: "imc", label: "IMC" }]} />
      <Grafico titulo="Glucemia" unidad="mg/dl" datos={datos} series={[{ campo: "glucemia", label: "Glucemia" }]} />
    </div>
  );
}
