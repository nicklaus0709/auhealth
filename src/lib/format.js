import { differenceInYears, format, parseISO, isValid } from "date-fns";
import { es } from "date-fns/locale";

export const DIAS_CORTOS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

function aFecha(valor) {
  if (!valor) return null;
  const fecha = typeof valor === "string" ? parseISO(valor) : new Date(valor);
  return isValid(fecha) ? fecha : null;
}

export function fechaLarga(valor) {
  const fecha = aFecha(valor);
  return fecha ? format(fecha, "d 'de' MMMM 'de' yyyy", { locale: es }) : "—";
}

export function fechaMedia(valor) {
  const fecha = aFecha(valor);
  return fecha ? format(fecha, "EEEE d 'de' MMMM", { locale: es }) : "—";
}

export function fechaHora(valor) {
  const fecha = aFecha(valor);
  return fecha ? format(fecha, "dd/MM/yyyy HH:mm") : "—";
}

export function fechaCorta(valor) {
  const fecha = aFecha(valor);
  return fecha ? format(fecha, "dd/MM/yyyy") : "—";
}

export function edad(fechaNacimiento) {
  const fecha = aFecha(fechaNacimiento);
  return fecha ? differenceInYears(new Date(), fecha) : null;
}

export function hoyISO() {
  return format(new Date(), "yyyy-MM-dd");
}

export function pesoArchivo(bytes) {
  const n = Number(bytes);
  if (!n || n < 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function valorODash(valor) {
  const texto = valor === null || valor === undefined ? "" : String(valor).trim();
  return texto || "—";
}

export function esImagen(tipo) {
  return String(tipo || "").toLowerCase().startsWith("image/");
}

export function truncar(texto, largo = 18) {
  const valor = String(texto || "");
  return valor.length > largo ? `${valor.slice(0, largo)}…` : valor;
}