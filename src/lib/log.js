import { base44 } from "@/api/base44Client";

// Logger único de la app. Nunca registrar datos de pacientes (nombres, DNI, diagnósticos):
// sólo la acción, la pantalla y los ids. Si se suma un servicio de errores (Sentry o similar),
// se conecta acá en `enviarAServicio` y el resto de la app no cambia.
const enviarAServicio = () => {};

function escribir(nivel, mensaje, contexto = {}) {
  const evento = { nivel, mensaje, ...contexto, ruta: window.location.pathname, fecha: new Date().toISOString() };
  // eslint-disable-next-line no-console
  (nivel === "error" ? console.error : console.warn)(`[AuHealth] ${mensaje}`, evento);
  enviarAServicio(evento);
}

export const log = {
  warn: (mensaje, contexto) => escribir("warn", mensaje, contexto),
  error: (mensaje, error, contexto = {}) =>
    escribir("error", mensaje, { ...contexto, error: error?.message || String(error ?? ""), status: error?.status }),
};

// Registro de auditoría de acciones sobre datos sensibles. No bloquea la acción principal:
// si falla, queda en el log. Para que no se pueda saltear, a futuro conviene moverlo a funciones backend.
export function auditar(accion, entidad, { registro = "", paciente = "", detalle = "", usuario_nombre = "" } = {}) {
  base44.entities.Auditoria.create({ accion, entidad, registro, paciente, detalle, usuario_nombre }).catch((error) =>
    log.error("No se pudo registrar la auditoría", error, { accion, entidad, registro })
  );
}
