// Signos vitales y antropometría que se registran en cada atención (todos opcionales).
export const SIGNOS = [
  { campo: "tension_sistolica", label: "TA sistólica", unidad: "mmHg", min: 50, max: 260 },
  { campo: "tension_diastolica", label: "TA diastólica", unidad: "mmHg", min: 30, max: 160 },
  { campo: "frecuencia_cardiaca", label: "FC", unidad: "lpm", min: 20, max: 250 },
  { campo: "frecuencia_respiratoria", label: "FR", unidad: "rpm", min: 5, max: 80 },
  { campo: "temperatura", label: "Temperatura", unidad: "°C", min: 30, max: 45, paso: "0.1" },
  { campo: "saturacion", label: "Saturación", unidad: "%", min: 50, max: 100 },
  { campo: "peso", label: "Peso", unidad: "kg", min: 0.5, max: 400, paso: "0.1" },
  { campo: "talla", label: "Talla", unidad: "cm", min: 30, max: 250 },
  { campo: "glucemia", label: "Glucemia", unidad: "mg/dl", min: 20, max: 800 },
];

export function calcularImc(peso, talla) {
  const p = Number(peso);
  const t = Number(talla) / 100;
  if (!p || !t) return null;
  return Math.round((p / (t * t)) * 10) / 10;
}

/** Limpia el formulario: sólo números válidos, más el IMC calculado. */
export function normalizarSignos(datos = {}) {
  const salida = {};
  SIGNOS.forEach(({ campo }) => {
    const n = Number(String(datos[campo] ?? "").replace(",", "."));
    if (datos[campo] !== "" && datos[campo] !== undefined && Number.isFinite(n) && n > 0) salida[campo] = n;
  });
  const imc = calcularImc(salida.peso, salida.talla);
  if (imc) salida.imc = imc;
  return salida;
}

export function resumenSignos(signos = {}) {
  const partes = [];
  if (signos.tension_sistolica && signos.tension_diastolica) partes.push(`TA ${signos.tension_sistolica}/${signos.tension_diastolica}`);
  if (signos.frecuencia_cardiaca) partes.push(`FC ${signos.frecuencia_cardiaca}`);
  if (signos.frecuencia_respiratoria) partes.push(`FR ${signos.frecuencia_respiratoria}`);
  if (signos.temperatura) partes.push(`T ${signos.temperatura}°C`);
  if (signos.saturacion) partes.push(`Sat ${signos.saturacion}%`);
  if (signos.peso) partes.push(`Peso ${signos.peso} kg`);
  if (signos.talla) partes.push(`Talla ${signos.talla} cm`);
  if (signos.imc) partes.push(`IMC ${signos.imc}`);
  if (signos.glucemia) partes.push(`Glucemia ${signos.glucemia}`);
  return partes.join(" · ");
}
