import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus } from "lucide-react";
import { ROL_OPTIONS } from "@/lib/roles";

const nombreDe = (usuario) => usuario?.nombre_completo || usuario?.full_name || usuario?.email || "—";

export default function AssignRoleCard({ usuarios, onAsignar, asignando }) {
  const [usuarioId, setUsuarioId] = useState("");
  const [rol, setRol] = useState("recepcionista");

  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6">
      <h2 className="font-heading text-base font-semibold text-foreground">Asignar Rol</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Elegí un usuario y el rol que querés darle. Los permisos se aplican al instante.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_200px_auto]">
        <Select value={usuarioId} onValueChange={setUsuarioId}>
          <SelectTrigger className="h-11">
            <SelectValue placeholder="Seleccioná un usuario" />
          </SelectTrigger>
          <SelectContent>
            {usuarios.map((usuario) => (
              <SelectItem key={usuario.id} value={usuario.id}>
                {nombreDe(usuario)} ({usuario.email})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={rol} onValueChange={setRol}>
          <SelectTrigger className="h-11">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROL_OPTIONS.map((opcion) => (
              <SelectItem key={opcion.value} value={opcion.value}>
                {opcion.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          className="btn-gradient h-11"
          disabled={!usuarioId || asignando}
          onClick={() => onAsignar(usuarioId, rol)}
        >
          <UserPlus className="mr-1.5 h-4 w-4" />
          Asignar
        </Button>
      </div>
    </section>
  );
}