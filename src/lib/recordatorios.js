import { base44 } from "@/api/base44Client";
import { fechaLarga } from "@/lib/format";

// Recordatorios de turno sin cuentas externas: WhatsApp por link (lo envía la persona de recepción desde
// su WhatsApp) y email con la integración de Base44 (sólo funciona en la app publicada).
// El envío automático programado necesita una cuenta de WhatsApp Business API: ver la propuesta.

export function mensajeRecordatorio(turno, consultorio) {
  const lugar = consultorio?.nombre ? ` en ${consultorio.nombre}` : "";
  const direccion = consultorio?.direccion ? ` (${consultorio.direccion})` : "";
  return (
    `Hola ${String(turno.paciente_nombre || "").split(" ")[0]}! Te recordamos tu turno${lugar}${direccion} ` +
    `el ${fechaLarga(turno.fecha)} a las ${turno.hora_inicio}${turno.profesional_nombre ? ` con ${turno.profesional_nombre}` : ""}. ` +
    `Por favor respondé este mensaje para confirmar o avisanos si no podés venir. ¡Gracias!`
  );
}

/** Normaliza un celular argentino a formato internacional para wa.me (54 9 + característica + número). */
export function telefonoWhatsapp(telefono) {
  let d = String(telefono || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("54")) d = d.slice(2);
  if (d.startsWith("9")) d = d.slice(1);
  if (d.startsWith("0")) d = d.slice(1);
  // "15" de celulares escritos a la antigua: sólo si sobran 2 dígitos (área + 15 + número = 12)
  if (d.length === 12) d = d.replace(/^(\d{2,4})15(\d{6,8})$/, "$1$2");
  return d.length >= 10 ? `549${d}` : "";
}

export function linkWhatsapp(telefono, texto) {
  const numero = telefonoWhatsapp(telefono);
  return numero ? `https://wa.me/${numero}?text=${encodeURIComponent(texto)}` : "";
}

export async function enviarRecordatorioEmail(turno, paciente, consultorio) {
  await base44.integrations.Core.SendEmail({
    to: paciente.email,
    subject: `Recordatorio de turno - ${fechaLarga(turno.fecha)} ${turno.hora_inicio}`,
    body: mensajeRecordatorio(turno, consultorio),
    from_name: consultorio?.nombre || undefined,
  });
}

export async function marcarRecordado(turno, medio) {
  await base44.entities.Turno.update(turno.id, { recordatorio_enviado: new Date().toISOString(), recordatorio_medio: medio });
}
