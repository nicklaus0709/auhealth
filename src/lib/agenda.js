// Utilidades de la agenda. Las horas se manejan como "HH:mm" y se comparan en minutos.

export const aMinutos = (hora) => {
  const [h, m] = String(hora || "0:0").split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

export const aHora = (minutos) => `${String(Math.floor(minutos / 60)).padStart(2, "0")}:${String(minutos % 60).padStart(2, "0")}`;

export const sumarMinutos = (hora, minutos) => aHora(Math.min(aMinutos(hora) + minutos, 23 * 60 + 59));

/** Franjas de la grilla entre apertura y cierre, cada `paso` minutos. */
export function franjas(apertura = "08:00", cierre = "20:00", paso = 30) {
  const salida = [];
  for (let m = aMinutos(apertura); m < aMinutos(cierre); m += paso) salida.push(aHora(m));
  return salida;
}

/** ¿El profesional atiende ese día a esa hora? Sin horarios cargados, se asume que sí (horario del consultorio). */
export function atiende(profesional, fecha, hora) {
  const horarios = profesional?.horarios || [];
  if (!profesional || horarios.length === 0) return true;
  const dia = new Date(`${fecha}T12:00:00`).getDay();
  const m = aMinutos(hora);
  return horarios.some((h) => Number(h.dia) === dia && aMinutos(h.desde) <= m && m < aMinutos(h.hasta));
}

/** Bloqueo que afecta a ese profesional en esa fecha (los que no tienen profesional son de todo el consultorio). */
export function bloqueoDe(bloqueos, fecha, profesionalId) {
  return bloqueos.find((b) => b.desde <= fecha && fecha <= b.hasta && (!b.profesional || b.profesional === profesionalId)) || null;
}

/** Turnos que se pisan con [inicio, fin) del mismo profesional (o todos si no se indica profesional). */
export function superpuestos(turnos, { fecha, hora_inicio, hora_fin, profesional, id }) {
  return turnos.filter(
    (t) =>
      t.id !== id &&
      t.fecha === fecha &&
      t.estado !== "cancelado" &&
      (!profesional || !t.profesional || t.profesional === profesional) &&
      t.hora_inicio < hora_fin &&
      hora_inicio < t.hora_fin
  );
}
