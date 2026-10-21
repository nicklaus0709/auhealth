export const ROL_OPTIONS = [
  { value: "admin", label: "Administrador" },
  { value: "medico", label: "Médico" },
  { value: "recepcionista", label: "Recepcionista" },
];

export const ROL_LABEL = {
  admin: "Administrador",
  medico: "Médico",
  recepcionista: "Recepcionista",
};

export const ROL_BADGE = {
  admin: "bg-brand-danger/10 text-brand-danger",
  medico: "bg-brand-teal/10 text-brand-teal",
  recepcionista: "bg-brand-emerald/10 text-[#1E8552]",
};

export function rolesDe(user) {
  const propios = Array.isArray(user?.roles) ? user.roles.filter((r) => ROL_LABEL[r]) : [];
  if (user?.role === "admin" && !propios.includes("admin")) return [...propios, "admin"];
  return propios;
}

export function esAdmin(user) {
  return user?.role === "admin";
}

export function esMedico(user) {
  return esAdmin(user) || rolesDe(user).includes("medico");
}

export function nombreDe(user) {
  return user?.nombre_completo || user?.full_name || user?.email || "";
}

export function inicialDe(user) {
  const base = user?.email || user?.nombre_completo || "?";
  return base.charAt(0).toUpperCase();
}