import { fechaCorta } from "@/lib/format";

export const ARCA_URL = "https://www.arca.gob.ar";

export const METODOS = [
  { campo: "monto_efectivo", label: "Efectivo" },
  { campo: "monto_obra_social", label: "Obra social" },
  { campo: "monto_transferencia", label: "Transferencia" },
  { campo: "monto_tarjeta", label: "Tarjeta" },
];

export const ESTADO_PAGO = {
  pagado: "Pagado",
  parcial: "Parcial",
  pendiente: "Pendiente",
};

export const num = (valor) => {
  const n = Number(valor);
  return Number.isFinite(n) ? n : 0;
};

export function calcularCobrado(datos) {
  return METODOS.reduce((acc, { campo }) => acc + num(datos[campo]), 0);
}

export function calcularEstado(importe, cobrado) {
  if (cobrado <= 0) return "pendiente";
  return cobrado >= importe ? "pagado" : "parcial";
}

export const moneda = (valor) =>
  new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 2 }).format(num(valor));

export function resumir(pagos) {
  const resumen = { importe: 0, cobrado: 0, pendiente: 0, sinFacturar: 0, cantidad: pagos.length };
  METODOS.forEach(({ campo }) => (resumen[campo] = 0));
  pagos.forEach((pago) => {
    resumen.importe += num(pago.importe);
    resumen.cobrado += num(pago.cobrado);
    resumen.pendiente += Math.max(num(pago.importe) - num(pago.cobrado), 0);
    if (!pago.facturado) resumen.sinFacturar += num(pago.cobrado);
    METODOS.forEach(({ campo }) => (resumen[campo] += num(pago[campo])));
  });
  return resumen;
}

export function filasReporte(pagos, conProfesional) {
  const encabezado = [
    "Fecha",
    "Paciente",
    "Ficha",
    "Concepto",
    ...(conProfesional ? ["Profesional"] : []),
    "Importe",
    ...METODOS.map((m) => m.label),
    "Cobrado",
    "Estado",
    "Facturado",
  ];
  const filas = pagos.map((p) => [
    fechaCorta(p.fecha),
    p.paciente_nombre || "",
    p.paciente_ficha || "",
    p.concepto || "",
    ...(conProfesional ? [p.profesional_nombre || ""] : []),
    num(p.importe),
    ...METODOS.map((m) => num(p[m.campo])),
    num(p.cobrado),
    ESTADO_PAGO[p.estado] || "",
    p.facturado ? `Sí${p.comprobante ? ` (${p.comprobante})` : ""}` : "No",
  ]);
  return { encabezado, filas };
}

export async function exportarXlsx(pagos, conProfesional, nombreArchivo) {
  const { default: writeExcelFile } = await import("write-excel-file/browser");
  const { encabezado, filas } = filasReporte(pagos, conProfesional);
  const resumen = resumir(pagos);
  const primeraNumerica = conProfesional ? 5 : 4;
  const datos = [
    encabezado.map((value) => ({ value, fontWeight: "bold" })),
    ...filas.map((fila) => fila.map((value, i) => (i >= primeraNumerica && i < primeraNumerica + 6 ? { value, type: Number } : value))),
    [],
    [{ value: "Total importe", fontWeight: "bold" }, { value: resumen.importe, type: Number }],
    [{ value: "Total cobrado", fontWeight: "bold" }, { value: resumen.cobrado, type: Number }],
    [{ value: "Pendiente de cobro", fontWeight: "bold" }, { value: resumen.pendiente, type: Number }],
  ];
  await writeExcelFile(datos).toFile(`${nombreArchivo}.xlsx`);
}

export async function exportarPdf(pagos, conProfesional, periodo, nombreArchivo) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const doc = new jsPDF({ orientation: "landscape" });
  const resumen = resumir(pagos);
  const { encabezado, filas } = filasReporte(pagos, conProfesional);

  doc.setFontSize(16);
  doc.text("AuHealth - Reporte de ganancias", 14, 16);
  doc.setFontSize(10);
  doc.text(`Período: ${periodo}`, 14, 23);
  doc.text(
    `Importe: ${moneda(resumen.importe)}   Cobrado: ${moneda(resumen.cobrado)}   Pendiente: ${moneda(resumen.pendiente)}`,
    14,
    29
  );
  doc.text(
    METODOS.map((m) => `${m.label}: ${moneda(resumen[m.campo])}`).join("   "),
    14,
    35
  );

  const primeraNumerica = conProfesional ? 5 : 4;
  autoTable(doc, {
    startY: 40,
    head: [encabezado],
    body: filas.map((fila) => fila.map((v, i) => (i >= primeraNumerica && i < primeraNumerica + 6 ? moneda(v) : v))),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [37, 157, 145] },
  });
  doc.save(`${nombreArchivo}.pdf`);
}
