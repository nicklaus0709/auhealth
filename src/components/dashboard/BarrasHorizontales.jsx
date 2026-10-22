import { moneda } from "@/lib/earnings";

/**
 * Ranking de una sola serie (magnitud): un solo color, valor como texto al lado, sin leyenda.
 * Ordenado de mayor a menor; lo que pasa de `maximo` se agrupa en "Otras".
 */
export default function BarrasHorizontales({ titulo, datos, maximo = 6, vacio = "Sin datos en el período" }) {
  const ordenados = [...datos].filter((d) => d.valor > 0).sort((a, b) => b.valor - a.valor);
  const visibles = ordenados.slice(0, maximo);
  const resto = ordenados.slice(maximo).reduce((acc, d) => acc + d.valor, 0);
  if (resto > 0) visibles.push({ etiqueta: "Otras", valor: resto });
  const tope = Math.max(...visibles.map((d) => d.valor), 1);
  const total = ordenados.reduce((acc, d) => acc + d.valor, 0);

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <h2 className="font-heading text-sm font-semibold text-foreground">{titulo}</h2>
      {visibles.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">{vacio}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {visibles.map((d) => {
            const porcentaje = total ? Math.round((d.valor / total) * 100) : 0;
            return (
              <li key={d.etiqueta} className="group" title={`${d.etiqueta}: ${moneda(d.valor)} (${porcentaje}%)`}>
                <div className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="truncate text-foreground">{d.etiqueta}</span>
                  <span className="tabular shrink-0 font-medium text-foreground">
                    {moneda(d.valor)} <span className="text-muted-foreground">· {porcentaje}%</span>
                  </span>
                </div>
                <div className="mt-1 h-2 rounded bg-muted">
                  <div
                    className="h-2 rounded bg-brand-teal transition-opacity group-hover:opacity-80"
                    style={{ width: `${Math.max((d.valor / tope) * 100, 2)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
