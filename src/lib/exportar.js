// Exportaciones: copia completa del consultorio (Excel) y datos de un paciente (derecho de acceso, Ley 25.326).

const OCULTAS = new Set(["app_id", "is_sample", "environment", "entity_name", "is_deleted", "deleted_date"]);

const celda = (valor) => {
  if (valor === null || valor === undefined) return "";
  if (typeof valor === "object") return JSON.stringify(valor);
  return valor;
};

/** Convierte registros en filas de write-excel-file, con encabezado = unión de campos. */
function hoja(registros) {
  const campos = [...new Set(registros.flatMap((r) => Object.keys(r)))].filter((c) => !OCULTAS.has(c));
  return [
    campos.map((value) => ({ value, fontWeight: "bold" })),
    ...registros.map((r) => campos.map((c) => {
      const v = celda(r[c]);
      return typeof v === "number" ? { value: v, type: Number } : { value: String(v) };
    })),
  ];
}

export async function exportarExcel(hojas, nombreArchivo) {
  const { default: writeExcelFile } = await import("write-excel-file/browser");
  const nombres = Object.keys(hojas);
  const vacia = [[{ value: "Sin registros" }]];
  await writeExcelFile(
    nombres.map((n) => ({ sheet: n.slice(0, 31), data: hojas[n].length ? hoja(hojas[n]) : vacia }))
  ).toFile(`${nombreArchivo}.xlsx`);
}

export function descargarJson(datos, nombreArchivo) {
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${nombreArchivo}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Trae todos los registros de una entidad recorriendo las páginas con el cursor del SDK. */
export async function traerTodo(entidad, filtro = {}, tope = 50000) {
  const { base44 } = await import("@/api/base44Client");
  const salida = [];
  let pagina = await base44.entities[entidad].filter(filtro, { sort: "created_date", limit: 1000 });
  salida.push(...(pagina?.items ?? []));
  while (pagina?.next_cursor && salida.length < tope) {
    pagina = await base44.entities[entidad].filter(filtro, { cursor: pagina.next_cursor, limit: 1000 });
    salida.push(...(pagina?.items ?? []));
  }
  return salida;
}
