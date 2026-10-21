import { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { esAdmin, esMedico, nombreDe, inicialDe } from "@/lib/roles";

/**
 * Sesión del usuario logueado, con sus permisos ya resueltos.
 * Si ingresó con Google y todavía no tiene nombre guardado, lo tomamos de su cuenta.
 */
export default function useSesion() {
  const { user, checkUserAuth } = useAuth();

  useEffect(() => {
    if (user && !user.nombre_completo && user.full_name) {
      base44.auth
        .updateMe({ nombre_completo: user.full_name })
        .then(() => checkUserAuth())
        .catch(() => {});
    }
  }, [user?.id, user?.nombre_completo, user?.full_name, checkUserAuth]);

  return {
    user,
    nombre: nombreDe(user),
    inicial: inicialDe(user),
    esAdmin: esAdmin(user),
    esMedico: esMedico(user),
  };
}